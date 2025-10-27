<script lang="ts">
	import { canEditServices, getCVStatusDisplayName, type CVStatus } from '../../../convex/model/status';
	import { calculateServicePricing } from '$lib/pricing';

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
<div class="mt-6">
	<h3 class="text-lg font-semibold text-gray-800 mb-3">Available Services</h3>
	<p class="text-sm text-gray-600 mb-4">Selected: {selectedServices.length} services</p>
	
	<!-- Service Editing Locked Message -->
	{#if !canEdit}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
			<div class="flex items-center space-x-3">
				<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
				</svg>
				<div>
					<p class="text-yellow-800 font-medium">Service editing is locked</p>
					<p class="text-yellow-700 text-sm">CV status is "{getCVStatusDisplayName(cvStatus)}" - services cannot be modified at this time.</p>
				</div>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<p class="text-gray-500">Loading available services...</p>
	{:else if error}
		<p class="text-red-500">Error loading services: {error}</p>
	{:else if availableServices && availableServices.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each availableServices as service}
				{#key service._id}
					{@const canBeLead = !hasLeadExpert || !hasLeadExpert(service._id)}
					{@const isReadOnly = readOnlyServices.includes(service._id)}
					<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow {!canEdit ? 'opacity-50' : ''}" data-service-id={service._id}>
						<div class="flex items-start space-x-3">
							<input 
								type="checkbox" 
								id="service-{service._id}"
								checked={selectedServices.includes(service._id)}
								onchange={() => onServiceToggle(service._id)}
								disabled={!canEdit || isReadOnly}
								class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							<div class="flex-1">
								<label for="service-{service._id}" class="block {isReadOnly || !canEdit ? 'cursor-not-allowed' : 'cursor-pointer'}">
									<h4 class="text-sm font-semibold {isReadOnly ? 'text-gray-500' : 'text-gray-800'}">{service.name}</h4>
									<p class="text-xs {isReadOnly ? 'text-gray-400' : 'text-gray-600'} mt-1">{service.description}</p>
									<div class="flex items-center space-x-2 mt-2">
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
											{service.version}
										</span>
										{#if service.serviceParent}
											<span class="text-xs text-gray-500">{service.serviceParent.name}</span>
										{/if}
										{#if isReadOnly}
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
												Already Approved
											</span>
										{/if}
									</div>
								</label>
							</div>
							<!-- Role Dropdown - Only show when service is selected -->
							{#if selectedServices.includes(service._id)}
								<div class="ml-4 flex-shrink-0">
									<select 
										class="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px] shadow-sm {isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}"
										onchange={(e) => onRoleChange(service._id, (e.target as HTMLSelectElement).value)}
										value={(roleChanges as any)[service._id] || (serviceRoles as any)[service._id] || 'regular'}
										disabled={!canEdit || isReadOnly}
									>
										<option value="regular">Regular</option>
										<option value="lead" disabled={!canBeLead}>
											Lead {#if !canBeLead}(Already assigned){/if}
										</option>
									</select>
									{#if !canBeLead && ((roleChanges as any)[service._id] || (serviceRoles as any)[service._id]) !== 'lead'}
										<p class="text-xs text-amber-600 mt-1">
											Already has a lead expert
										</p>
									{/if}
								</div>
							{:else}
								<div class="ml-4 flex-shrink-0 w-[100px]"></div>
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
		<div class="mt-8 p-6 bg-gray-50 rounded-lg border">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Additional Services Cost</h3>
			<p class="text-sm text-gray-600 mb-4">
				Pricing for {newServicesCount} new service{newServicesCount > 1 ? 's' : ''} (approved services are excluded)
			</p>
			
			<div class="space-y-3">
				{#each pricing.breakdown as item}
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">
							Service {item.serviceNumber}
							{#if item.discountPercentage > 0}
								<span class="text-green-600 ml-2">({item.discountPercentage}% off)</span>
							{/if}
						</span>
						<span class="font-medium">€{item.finalPrice.toFixed(2)}</span>
					</div>
				{/each}
				
				<hr class="my-3">
				
				<div class="flex justify-between items-center text-lg font-semibold">
					<span>Total</span>
					<span class="text-blue-600">€{pricing.total.toFixed(2)}</span>
				</div>
				
				{#if pricing.savings > 0}
					<div class="text-center text-green-600 font-medium">
						🎉 You save €{pricing.savings.toFixed(2)}!
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
