<script lang="ts">
	import { checkoutStore } from '$lib/stores/checkout.svelte';

	// Props
	interface Props {
		showDetails?: boolean;
		compact?: boolean;
	}

	let { showDetails = true, compact = false }: Props = $props();

	// Store state
	let storeState = $derived($checkoutStore);
	let totalAmount = $derived(storeState.totalAmount);
	let selectedExperts = $derived(
		storeState.experts.filter((expert) =>
			storeState.selectedExpertIds.includes(expert.assignmentId)
		)
	);

	// Calculate counts correctly
	let selectedCount = $derived(selectedExperts.length); // Individual service assignments
	let uniqueExpertCount = $derived(new Set(selectedExperts.map((expert) => expert.userId)).size); // Unique experts
</script>

<div
	class="bg-white border border-gray-200 rounded-lg p-{compact ? '4' : '6'} {compact
		? ''
		: 'shadow-sm'}"
>
	{#if !compact}
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
	{/if}

	<div class="space-y-3">
		<!-- Selected Experts Count -->
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-700">Selected Experts</span>
			<span class="text-sm font-semibold text-gray-900">{uniqueExpertCount}</span>
		</div>

		<!-- Service Count -->
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-700">Service Assignments</span>
			<span class="text-sm font-semibold text-gray-900">{selectedCount}</span>
		</div>

		<!-- Total Amount -->
		<div class="flex items-center justify-between pt-3 border-t border-gray-200">
			<span class="text-base font-semibold text-gray-900">Total Amount</span>
			<span class="text-xl font-bold text-gray-900">€{totalAmount.toFixed(2)}</span>
		</div>
	</div>

	{#if showDetails && selectedExperts.length > 0}
		<div class="mt-4 pt-4 border-t border-gray-200">
			<h4 class="text-sm font-medium text-gray-700 mb-3">Selected Experts</h4>
			<div class="space-y-2">
				{#each selectedExperts as expert}
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center space-x-2">
							<span class="text-gray-900 font-medium">{expert.userName}</span>
							<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
								{expert.serviceVersionName}
							</span>
							{#if expert.role === 'lead'}
								<span
									class="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded-full font-semibold"
								>
									LEAD
								</span>
							{/if}
						</div>
						<span class="text-gray-600 font-medium">€{expert.price.toFixed(2)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if uniqueExpertCount === 0}
		<div class="mt-4 pt-4 border-t border-gray-200">
			<div class="text-center py-4">
				<svg
					class="w-8 h-8 mx-auto text-gray-300 mb-2"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<p class="text-sm text-gray-500">No experts selected</p>
			</div>
		</div>
	{/if}
</div>
