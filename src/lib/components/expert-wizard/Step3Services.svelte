<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	interface Service {
		name: string;
		_id: string;
	}

	interface Props {
		availableServices: Service[];
		selectedServices: string[];
		serviceRoles: Record<string, 'lead' | 'regular'>;
		isLoadingServices: boolean;
		currentOrgId: string | null;
		isDraftMode: boolean;
	}

	let {
		availableServices,
		selectedServices = $bindable([]),
		serviceRoles = $bindable({}),
		isLoadingServices,
		currentOrgId,
		isDraftMode
	}: Props = $props();

	$effect(() => {
		console.log('🔍 Step3Services - selectedServices:', selectedServices);
		console.log('🔍 Step3Services - selectedServices type:', typeof selectedServices);
		console.log('🔍 Step3Services - selectedServices isArray:', Array.isArray(selectedServices));
		console.log("Service roles:", serviceRoles);
	});


	// Debug logging
	function toggleRole(serviceName: string) {
		dispatch('toggleRole', serviceName);
	}
</script>

<div class="services-step">
	{#if currentOrgId}
		<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
			<div class="flex items-center text-sm text-green-700">
				<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
				<span
					><strong>Approved Services:</strong> Showing only services that your organization is
					approved to provide ({availableServices.length} available)</span
				>
			</div>
		</div>
	{:else}
		<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex items-center text-sm text-blue-700">
				<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				<span
					><strong>Prototype Mode:</strong> Showing all available services ({availableServices.length}
					available)</span
				>
			</div>
		</div>
	{/if}

	{#if isLoadingServices}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
			<div class="flex items-center">
				<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
				<span class="text-blue-700">Loading available services...</span>
			</div>
		</div>
	{:else if availableServices.length === 0}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class="text-yellow-700">No services available. Please seed the database first.</span>
			</div>
		</div>
	{/if}

	<div class="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
		<div class="flex items-center text-sm text-blue-700">
			<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
					clip-rule="evenodd"
				/>
			</svg>
			<span
				><strong>Tip:</strong> Click the role badges to toggle between LEAD and Regular expert</span
			>
		</div>
	</div>

	{#if !isLoadingServices && availableServices.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each availableServices as service}
				<div
					class="flex items-center justify-between p-4 border-2 rounded-lg transition-all {selectedServices.includes(
						service.name
					)
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
				>
					<label class="flex items-center cursor-pointer flex-1">
						<input
							type="checkbox"
							bind:group={selectedServices}
							value={service.name}
							class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
						/>
						<span class="ml-3 text-sm font-medium text-gray-900">{service.name}</span>
					</label>

					{#if selectedServices.includes(service.name)}
						<button
							type="button"
							onclick={() => toggleRole(service.name)}
							class="ml-3 inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors {serviceRoles[
								service.name
							] === 'lead'
								? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
								: 'bg-blue-100 text-blue-800 hover:bg-blue-200'}"
						>
							{serviceRoles[service.name] === 'lead' ? 'LEAD' : 'Regular'}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
