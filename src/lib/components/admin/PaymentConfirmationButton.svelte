<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { CVStatus } from '../../../convex/model/status';
	import type { Id } from '$lib';

	interface Props {
		cvStatus: CVStatus | undefined;
		cvId: Id<'expertCVs'> | undefined;
		onPaymentConfirmed?: () => void;
	}

	let { cvStatus, cvId, onPaymentConfirmed }: Props = $props();

	const client = useConvexClient();

	// State for popup and loading
	let showConfirmation = $state(false);
	let isProcessing = $state(false);
	let errorMessage = $state('');

	// Check if payment confirmation is available
	let canConfirmPayment = $derived(cvStatus === 'payment_pending' && cvId);

	const handlePaymentClick = (e: Event) => {
		e.stopPropagation(); // Prevent row click from triggering
		if (canConfirmPayment) {
			showConfirmation = true;
		}
	};

	const confirmPayment = async () => {
		if (!cvId) return;

		isProcessing = true;
		errorMessage = '';

		try {
			await client.mutation(api.expert.updateCVStatus, {
				cvId: cvId,
				newStatus: 'paid'
			});

			showConfirmation = false;
			onPaymentConfirmed?.();
		} catch (error) {
			errorMessage = `Failed to confirm payment: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const cancelConfirmation = () => {
		showConfirmation = false;
		errorMessage = '';
	};
</script>

<!-- Payment Confirmation Button -->
<button
	type="button"
	onclick={handlePaymentClick}
	disabled={!canConfirmPayment}
	class="inline-flex items-center p-1 rounded-md transition-colors {canConfirmPayment 
		? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50' 
		: 'text-gray-400 cursor-not-allowed'}"
	title={canConfirmPayment ? 'Confirm expert CV payment received' : 'CV payment already confirmed or not pending'}
>
	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>
</button>

<!-- Confirmation Popup -->
{#if showConfirmation}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4 min-w-0 overflow-hidden">
			<div class="flex items-center mb-4">
				<div class="flex-shrink-0">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-lg font-medium text-gray-900">Confirm Payment</h3>
				</div>
			</div>

			<div class="mb-6 w-full">
				<p class="text-sm text-gray-600 leading-relaxed" style="word-break: break-word; overflow-wrap: break-word; hyphens: auto;">
					Are you sure you want to mark this CV as paid? <br>
					This will change the status from "Payment Pending" to "Paid" <br>
					and start the review process.
				</p>
			</div>

			{#if errorMessage}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
					<p class="text-sm text-red-600">{errorMessage}</p>
				</div>
			{/if}

			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={cancelConfirmation}
					disabled={isProcessing}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmPayment}
					disabled={isProcessing}
					class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
				>
					{isProcessing ? 'Confirming...' : 'Confirm Payment'}
				</button>
			</div>
		</div>
	</div>
{/if}
