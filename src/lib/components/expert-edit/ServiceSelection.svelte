<script lang="ts">
	import { canEditServices, getCVStatusDisplayName, type CVStatus } from '../../../convex/model/status';
	import { calculateServicePricing } from '$lib';

	interface Service {
		_id: string;
		name: string;
		description: string;
		version: string;
		serviceParent?: {
			name: string;
		} | null;
	}

	interface Props {
		cvStatus: CVStatus;
		availableServices: Service[];
		selectedServices: string[];
		serviceRoles: Record<string, string>;
		roleChanges: Record<string, string>;
		onServiceToggle: (serviceId: string) => void;
		onRoleChange: (serviceId: string, role: string) => void;
		isLoading?: boolean;
		error?: string;
		hasLeadExpert?: (serviceId: string) => boolean; // Check if service already has a lead expert
		readOnlyServices?: string[]; // Services that are read-only (already approved)
	}

	let { 
		cvStatus, 
		availableServices, 
		selectedServices, 
		serviceRoles, 
		roleChanges, 
		onServiceToggle, 
		onRoleChange,
		isLoading = false,
		error = '',
		hasLeadExpert,
		readOnlyServices = []
	}: Props = $props();

	// Check if service editing is allowed based on CV status
	let canEdit = $derived(canEditServices(cvStatus));
	
	// Calculate pricing based on number of NEW services (exclude read-only)
	let newServicesCount = $derived(
		selectedServices.filter(serviceId => !readOnlyServices.includes(serviceId)).length
	);
	
	// Reactive pricing calculation
	let pricing = $derived(calculateServicePricing(newServicesCount));
</script>

<!-- Service Selection Component -->
<div>
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between mb-3">
			<div>
				<h3 class="text-xl font-semibold text-gray-900">Select Services</h3>
				<p class="text-sm text-gray-600 mt-1">Choose the services you want to apply for</p>
			</div>
			<div class="text-right">
				<div class="text-2xl font-bold text-blue-600">{selectedServices.length}</div>
				<div class="text-xs text-gray-500">selected</div>
			</div>
		</div>

		<!-- Service Editing Locked Message -->
		{#if !canEdit}
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
				<div class="flex items-center space-x-3">
					<svg class="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
					</svg>
					<div>
						<p class="text-yellow-800 font-medium">Service editing is locked</p>
						<p class="text-yellow-700 text-sm">CV status is "{getCVStatusDisplayName(cvStatus)}" - services cannot be modified at this time.</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="text-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p class="text-gray-500">Loading available services...</p>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-center space-x-3">
				<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<p class="text-red-700">Error loading services: {error}</p>
			</div>
		</div>
	{:else if availableServices && availableServices.length > 0}
		<div class="grid grid-cols-1 gap-4">
			{#each availableServices as service}
				{#key service._id}
					{@const wasLeadInitially = (serviceRoles as any)[service._id] === 'lead'}
					{@const canBeLead = !hasLeadExpert || !hasLeadExpert(service._id) || wasLeadInitially}
					{@const isReadOnly = readOnlyServices.includes(service._id)}
					{@const isSelected = selectedServices.includes(service._id)}
					<div class="bg-white border-2 {isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} rounded-lg p-5 transition-all duration-200 shadow-sm {!canEdit ? 'opacity-50' : ''}" data-service-id={service._id}>
						<div class="flex items-start space-x-4">
							<div class="flex-shrink-0 pt-1">
								<input 
									type="checkbox" 
									id="service-{service._id}"
									checked={isSelected}
									onchange={() => onServiceToggle(service._id)}
									disabled={!canEdit || isReadOnly}
									class="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
								/>
							</div>
							<div class="flex-1 min-w-0">
								<label for="service-{service._id}" class="block {isReadOnly || !canEdit ? 'cursor-not-allowed' : 'cursor-pointer'}">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h4 class="text-base font-semibold {isReadOnly ? 'text-gray-500' : isSelected ? 'text-blue-900' : 'text-gray-900'}">
												{service.name}
											</h4>
											<p class="text-sm {isReadOnly ? 'text-gray-400' : 'text-gray-600'} mt-1">
												{service.description}
											</p>
										</div>
										{#if isSelected}
											<svg class="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
											</svg>
										{/if}
									</div>
									<div class="flex items-center space-x-2 mt-3">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
											v{service.version}
										</span>
										{#if service.serviceParent}
											<span class="text-xs text-gray-500">• {service.serviceParent.name}</span>
										{/if}
										{#if isReadOnly}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
												✓ Approved
											</span>
										{/if}
									</div>
								</label>
							</div>
							<!-- Role Dropdown - Only show when service is selected -->
							{#if isSelected}
								<div class="flex-shrink-0">
									<select 
										class="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm min-w-[140px] {isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}"
										onchange={(e) => onRoleChange(service._id, (e.target as HTMLSelectElement).value)}
										value={(roleChanges as any)[service._id] || (serviceRoles as any)[service._id] || 'regular'}
										disabled={!canEdit || isReadOnly}
									>
										<option value="regular">Regular Expert</option>
										<option value="lead" disabled={!canBeLead}>
											Lead Expert
										</option>
									</select>
									{#if !canBeLead && ((roleChanges as any)[service._id] || (serviceRoles as any)[service._id]) !== 'lead'}
										<p class="text-xs text-amber-600 mt-1 text-center">
											Lead already assigned
										</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/key}
			{/each}
		</div>
	{:else}
		<p class="text-gray-500">No available services found for this organization</p>
	{/if}

	<!-- Pricing Summary - Only show if there are NEW services (not read-only) -->
	{#if newServicesCount > 0}
		<div class="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
						<span class="text-xl">💰</span>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">Cost Summary</h3>
						<p class="text-sm text-gray-600">
							{newServicesCount} new service{newServicesCount > 1 ? 's' : ''} selected
						</p>
					</div>
				</div>
			</div>
			
			<div class="bg-white rounded-lg p-4 space-y-3">
				{#each pricing.breakdown as item}
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-700">
							Service {item.serviceNumber}
							{#if item.discountPercentage > 0}
								<span class="text-green-600 font-medium ml-2">-{item.discountPercentage}%</span>
							{/if}
						</span>
						<span class="font-semibold text-gray-900">€{item.finalPrice.toFixed(2)}</span>
					</div>
				{/each}
			</div>
			
			<div class="mt-4 pt-4 border-t-2 border-blue-200">
				<div class="flex justify-between items-center">
					<span class="text-lg font-semibold text-gray-900">Total Amount</span>
					<span class="text-2xl font-bold text-blue-600">€{pricing.total.toFixed(2)}</span>
				</div>
				
				{#if pricing.savings > 0}
					<div class="mt-3 flex items-center justify-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
						<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
						</svg>
						<span class="text-sm font-semibold text-green-700">
							You save €{pricing.savings.toFixed(2)}!
						</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
