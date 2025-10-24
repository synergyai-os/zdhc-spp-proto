<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '$lib';

	interface Props {
		organizationId?: Id<'organizations'>;
		serviceVersionId?: Id<'serviceVersions'>;
		onPaymentCompleted?: () => void;
	}

	let { organizationId, serviceVersionId, onPaymentCompleted }: Props = $props();

	const client = useConvexClient();

	let isProcessing = $state(false);
	let errorMessage = $state('');
	let showModal = $state(false);

	const handlePayment = async () => {
		if (isProcessing || !organizationId) return;
		
		isProcessing = true;
		errorMessage = '';

		try {
			if (!serviceVersionId) {
				// For prototype: get the first approved service for this organization
				const approvedServices = await client.query(api.services.getApprovedServices, {
					organizationId
				});
				
				if (!approvedServices || approvedServices.length === 0) {
					throw new Error('No approved services found for this organization');
				}
				
				// Use the first approved service
				const firstService = approvedServices[0];
				serviceVersionId = firstService._id;
			}

			// Generate a mock payment reference for prototype
			const paymentReference = `PROTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const paymentAmount = 2500; // €2,500 annual fee
			
			// Call the real business logic function
			await client.mutation(api.serviceApproval.payAnnualFee, {
				organizationId,
				serviceVersionId,
				paymentReference,
				paymentAmount,
				triggeredBy: 'prototype_admin'
			});
			
			console.log('✅ Annual fee payment processed successfully');
			
			if (onPaymentCompleted) {
				onPaymentCompleted();
			}
			
			// Close modal after successful payment
			showModal = false;
		} catch (error) {
			console.error('Payment processing error:', error);
			errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
		} finally {
			isProcessing = false;
		}
	};
</script>

<!-- Payment Icon Button -->
<button
	onclick={() => showModal = true}
	class="p-1 {(organizationId && serviceVersionId) ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-gray-400 cursor-not-allowed'} rounded transition-colors"
	title={organizationId ? (serviceVersionId ? "Pay organization annual service fee" : "No approved services available for payment") : "No organization context available"}
	disabled={!organizationId || !serviceVersionId}
>
	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l3 3" />
	</svg>
</button>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
		 onclick={() => showModal = false}
		 onkeydown={(e) => e.key === 'Escape' && (showModal = false)}
		 role="dialog"
		 aria-modal="true"
		 aria-labelledby="payment-modal-title"
		 tabindex="-1">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<!-- Modal Header -->
			<div class="flex items-center justify-between mb-4">
				<h3 id="payment-modal-title" class="text-lg font-semibold text-gray-900 flex items-center">
					<svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l3 3" />
					</svg>
					Pay Annual Fee
				</h3>
				<button 
					onclick={() => showModal = false}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Close modal"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Payment Information -->
			<div class="mb-4 p-3 bg-gray-50 rounded-lg">
				<div class="space-y-2">
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium text-gray-700">Service:</span>
						<span class="text-sm text-gray-600">
							{serviceVersionId ? `Service Version ${serviceVersionId}` : 'First approved service'}
						</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium text-gray-700">Organization:</span>
						<span class="text-sm text-gray-600">Organization {organizationId}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium text-gray-700">Annual Fee:</span>
						<span class="text-sm font-semibold text-green-600">€2,500</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium text-gray-700">Payment Reference:</span>
						<span class="text-sm text-gray-600 font-mono">PROTO_[generated]</span>
					</div>
				</div>
			</div>

			<!-- Payment Action -->
			<div class="space-y-3">
				<button
					onclick={handlePayment}
					disabled={isProcessing}
					class="w-full px-4 py-2 text-sm font-medium rounded border transition-colors
						bg-green-50 text-green-700 border-green-200 hover:bg-green-100
						disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isProcessing ? 'Processing Payment...' : 'Pay Annual Fee'}
				</button>
				
				<div class="text-xs text-gray-500 text-center">
					This will update the database with payment information and activate the service.
				</div>
			</div>

			<!-- Error Message -->
			{#if errorMessage}
				<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
					{errorMessage}
				</div>
			{/if}

			<!-- Processing Indicator -->
			{#if isProcessing}
				<div class="mt-4 flex items-center justify-center">
					<svg class="animate-spin w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span class="ml-2 text-sm text-gray-600">Processing payment...</span>
				</div>
			{/if}

			<!-- Modal Footer -->
			<div class="mt-6 flex justify-end">
				<button 
					onclick={() => showModal = false}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
