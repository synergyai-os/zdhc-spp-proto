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
	
	// Calculate pricing breakdown
	let totalWithoutDiscount = $derived(
		selectedExperts.reduce((sum, expert) => sum + (expert.basePrice || expert.price), 0)
	);
	let totalDiscount = $derived(
		selectedExperts.reduce((sum, expert) => {
			const basePrice = expert.basePrice || expert.price;
			return sum + (basePrice - expert.price);
		}, 0)
	);
	let finalTotal = $derived(totalAmount);
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
		<!-- Total Price (without discount) -->
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-700">Total Price</span>
			<span class="text-sm font-semibold text-gray-900">€{totalWithoutDiscount.toFixed(2)}</span>
		</div>

		<!-- Discount -->
		{#if totalDiscount > 0}
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-green-700">Discount</span>
				<span class="text-sm font-semibold text-green-700">-€{totalDiscount.toFixed(2)}</span>
			</div>
		{/if}

		<!-- Final Total -->
		<div class="flex items-center justify-between pt-3 border-t border-gray-200">
			<span class="text-base font-semibold text-gray-900">Total Amount</span>
			<span class="text-xl font-bold text-gray-900">€{finalTotal.toFixed(2)}</span>
		</div>
	</div>

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
