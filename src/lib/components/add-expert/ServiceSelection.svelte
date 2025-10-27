<script lang="ts">
	import { calculateServicePricing } from '$lib/pricing';

	interface Service {
		_id: string;
		name: string;
		description: string;
		version: string;
		serviceParent?: {
			name: string;
		};
	}

	interface Props {
		availableServices: Service[];
		selectedServices: string[]; // Array of service IDs
		serviceRoles: Record<string, 'regular' | 'lead'>;
		onServiceToggle: (serviceId: string) => void;
		onServiceRoleToggle: (serviceId: string, newRole: string) => void;
		isLoading?: boolean;
		hasLeadExpert?: (serviceId: string) => boolean; // Check if service already has a lead expert
		readOnlyServices?: string[]; // Services that are read-only (already approved)
	}

		let {
		availableServices,
		selectedServices,
		serviceRoles,
		onServiceToggle,
		onServiceRoleToggle,
		isLoading = false,
		hasLeadExpert,
		readOnlyServices = []
	}: Props = $props();

	// Calculate pricing based on number of NEW services (exclude read-only)
	let newServicesCount = $derived(
		selectedServices.filter(serviceId => !readOnlyServices.includes(serviceId)).length
	);
	
	let pricing = $derived(calculateServicePricing(newServicesCount));
</script>

<div class="space-y-6">
	{#if isLoading}
		<div class="text-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p class="text-gray-500">Loading available services...</p>
		</div>
	{:else if availableServices.length === 0}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<p class="text-sm text-yellow-700">No approved services available for your organization.</p>
		</div>
	{:else if availableServices.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each availableServices as service}
						{#key service._id}
							{@const canBeLead = !hasLeadExpert || !hasLeadExpert(service._id)}
							{@const isReadOnly = readOnlyServices.includes(service._id)}
							<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow" data-service-id={service._id}>
								<div class="flex items-start space-x-3">
									<input
										type="checkbox"
										id="service-{service._id}"
										checked={selectedServices.includes(service._id)}
										disabled={isReadOnly}
										onchange={() => onServiceToggle(service._id)}
										class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<div class="flex-1">
										<label for="service-{service._id}" class="block {isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}">
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
												onchange={(e) => onServiceRoleToggle(service._id, (e.target as HTMLSelectElement).value)}
												value={serviceRoles[service._id] || 'regular'}
												disabled={isReadOnly}
											>
												<option value="regular">Regular</option>
												<option value="lead" disabled={!canBeLead}>
													Lead {#if !canBeLead}(Already assigned){/if}
												</option>
											</select>
											{#if !canBeLead && serviceRoles[service._id] !== 'lead'}
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
	{/if}

	<!-- Pricing Summary - Only show if there are NEW services (not read-only) -->
	{#if newServicesCount > 0}
		<div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
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

				<hr class="my-3" />

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
