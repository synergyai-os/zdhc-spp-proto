<script lang="ts">
	import { onMount } from 'svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api, type Id, CV_STATUS_VALUES, type CVStatus } from '$lib';
	import { checkoutStore } from '$lib/stores/checkout.svelte';
	import PaymentSummary from '$lib/components/PaymentSummary.svelte';
	import PaymentMethodSelector from '$lib/components/PaymentMethodSelector.svelte';

	// Get Convex client
	const client = useConvexClient();

	// Reset any stuck loading state when page loads
	onMount(() => {
		if (storeState.isLoading) {
			checkoutStore.resetLoadingState();
		}
	});

	// Force reset loading state immediately on page load (more aggressive)
	checkoutStore.resetLoadingState();

	// Store state
	let storeState = $derived($checkoutStore);
	let selectedExperts = $derived(
		storeState.experts.filter((expert) =>
			storeState.selectedExpertIds.includes(expert.expertServiceAssignmentId)
		)
	);
	let paymentMethod = $derived(storeState.paymentMethod);
	let isLoading = $derived(storeState.isLoading);
	let error = $derived(storeState.error);


	// Form state
	let cardNumber = $state('');
	let expiryMonth = $state('');
	let expiryYear = $state('');
	let cvv = $state('');
	let cardholderName = $state('');
	let bankReference = $state('');

	// Generate bank reference
	$effect(() => {
		if (paymentMethod === 'bank_transfer' && !bankReference) {
			const timestamp = Date.now().toString().slice(-6);
			const orgId = storeState.experts[0]?.assignmentId?.slice(-4) || '0000';
			bankReference = `ZDHC-${orgId}-${timestamp}`;
		}
	});

	// Form validation
	let isFormValid = $derived(() => {
		if (paymentMethod === 'credit_card') {
			return (
				cardNumber.length >= 13 &&
				expiryMonth &&
				expiryYear &&
				cvv.length >= 3 &&
				cardholderName.trim().length > 0
			);
		} else {
			return true; // Bank transfer doesn't need form validation
		}
	});

	// Handle payment submission
	async function handlePayment() {
		if (!isFormValid || selectedExperts.length === 0) return;

		try {
			checkoutStore.setLoading(true);
			checkoutStore.setError(null);

			// Update payment details in store
			checkoutStore.updatePaymentDetails({
				cardNumber: paymentMethod === 'credit_card' ? cardNumber : undefined,
				expiryMonth: paymentMethod === 'credit_card' ? expiryMonth : undefined,
				expiryYear: paymentMethod === 'credit_card' ? expiryYear : undefined,
				cvv: paymentMethod === 'credit_card' ? cvv : undefined,
				cardholderName: paymentMethod === 'credit_card' ? cardholderName : undefined,
				bankReference: paymentMethod === 'bank_transfer' ? bankReference : undefined
			});

			// Update CV status based on payment method
			const cvIds = [...new Set(selectedExperts.map(expert => expert.expertCVId))];
			const cvStatus: CVStatus = paymentMethod === 'credit_card' 
				? CV_STATUS_VALUES[3] // 'paid'
				: CV_STATUS_VALUES[2]; // 'payment_pending'
			
			for (const cvId of cvIds) {
				await client.mutation(api.expert.updateCVStatus, {
					cvId: cvId as Id<'expertCVs'>,
					newStatus: cvStatus
				});
			}

			// Service assignment statuses remain 'pending_review' until admin review
			// No need to update service assignment statuses here - they stay pending_review

			console.log('Payment processed successfully - CV status updated to:', cvStatus);

			// Redirect to confirmation page
			window.location.href = '/checkout/confirmation';
		} catch (err: any) {
			console.error('Payment processing error:', err);
			checkoutStore.setError(err.message || 'Payment processing failed');
		} finally {
			checkoutStore.setLoading(false);
		}
	}

	// Navigation functions
	function goBack() {
		window.location.href = '/checkout';
	}

	function cancelPayment() {
		if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
			checkoutStore.clearCheckout();
			window.location.href = '/checkout';
		}
	}
</script>

<div class="bg-gray-50 min-h-screen py-8">
	<div class="max-w-4xl mx-auto px-6">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">Payment Details</h1>
					<p class="text-gray-600">Complete your payment to activate expert service assignments</p>
				</div>
				<button
					type="button"
					onclick={goBack}
					class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
				>
					← Back to Checkout
				</button>
			</div>
		</div>

		{#if selectedExperts.length === 0}
			<!-- No Experts Selected -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<svg
					class="w-12 h-12 mx-auto mb-4 text-gray-300"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
					/>
				</svg>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">No Experts Selected</h2>
				<p class="text-gray-600 mb-4">Please go back and select experts for payment</p>
				<button
					type="button"
					onclick={goBack}
					class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
				>
					Back to Checkout
				</button>
			</div>
		{:else}
			<!-- Main Payment Content -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Left Column: Payment Form -->
				<div class="lg:col-span-2 space-y-6">
					<!-- Payment Method Selection -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<PaymentMethodSelector />
					</div>

					<!-- Payment Form -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						{#if paymentMethod === 'credit_card'}
							<!-- Credit Card Form -->
							<h3 class="text-lg font-semibold text-gray-900 mb-6">Credit Card Information</h3>

							<div class="space-y-4">
								<!-- Card Number -->
								<div>
									<label for="cardNumber" class="block text-sm font-medium text-gray-700 mb-2">
										Card Number *
									</label>
									<input
										id="cardNumber"
										type="text"
										bind:value={cardNumber}
										placeholder="1234 5678 9012 3456"
										maxlength="19"
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>

								<!-- Expiry and CVV -->
								<div class="grid grid-cols-2 gap-4">
									<div>
										<label for="expiryMonth" class="block text-sm font-medium text-gray-700 mb-2">
											Expiry Month *
										</label>
										<select
											id="expiryMonth"
											bind:value={expiryMonth}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="">Month</option>
											{#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
												<option value={month.toString().padStart(2, '0')}>
													{month.toString().padStart(2, '0')}
												</option>
											{/each}
										</select>
									</div>
									<div>
										<label for="expiryYear" class="block text-sm font-medium text-gray-700 mb-2">
											Expiry Year *
										</label>
										<select
											id="expiryYear"
											bind:value={expiryYear}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="">Year</option>
											{#each Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i) as year}
												<option value={year.toString().slice(-2)}>{year}</option>
											{/each}
										</select>
									</div>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div>
										<label for="cvv" class="block text-sm font-medium text-gray-700 mb-2">
											CVV *
										</label>
										<input
											id="cvv"
											type="text"
											bind:value={cvv}
											placeholder="123"
											maxlength="4"
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div>
										<label
											for="cardholderName"
											class="block text-sm font-medium text-gray-700 mb-2"
										>
											Cardholder Name *
										</label>
										<input
											id="cardholderName"
											type="text"
											bind:value={cardholderName}
											placeholder="John Doe"
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
								</div>
							</div>
						{:else if paymentMethod === 'bank_transfer'}
							<!-- Bank Transfer Information -->
							<h3 class="text-lg font-semibold text-gray-900 mb-6">Bank Transfer Details</h3>

							<div class="space-y-4">
								<!-- Bank Details -->
								<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
									<h4 class="text-sm font-medium text-gray-900 mb-3">Transfer to:</h4>
									<div class="space-y-2 text-sm">
										<div class="flex justify-between">
											<span class="text-gray-600">Account Name:</span>
											<span class="font-medium text-gray-900">ZDHC Foundation</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">IBAN:</span>
											<span class="font-medium text-gray-900">NL00BANK0123456789</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">BIC:</span>
											<span class="font-medium text-gray-900">BANKXXX</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">Reference:</span>
											<span class="font-medium text-gray-900">{bankReference}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">Amount:</span>
											<span class="font-bold text-gray-900"
												>€{storeState.totalAmount.toFixed(2)}</span
											>
										</div>
									</div>
								</div>

								<!-- Instructions -->
								<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<h4 class="text-sm font-medium text-blue-800 mb-2">Transfer Instructions:</h4>
									<ul class="text-sm text-blue-700 space-y-1">
										<li>• Use the exact reference number: <strong>{bankReference}</strong></li>
										<li>
											• Transfer the exact amount: <strong
												>€{storeState.totalAmount.toFixed(2)}</strong
											>
										</li>
										<li>• Payment status will be updated once confirmed by our bank</li>
										<li>• You'll receive email confirmation when payment is processed</li>
									</ul>
								</div>

								<!-- Optional: Upload Proof -->
								<div>
									<label for="proofUpload" class="block text-sm font-medium text-gray-700 mb-2">
										Upload Transfer Proof (Optional)
									</label>
									<input
										id="proofUpload"
										type="file"
										accept="image/*,.pdf"
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
									<p class="text-xs text-gray-500 mt-1">
										Upload screenshot or PDF of your bank transfer confirmation
									</p>
								</div>
							</div>
						{/if}
					</div>

					<!-- Error Display -->
					{#if error}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4">
							<div class="flex items-center">
								<svg class="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 10.586l2.707-2.707a1 1 0 001.414 1.414L11.414 12l2.707 2.707a1 1 0 01-1.414 1.414L10 13.414l-2.707 2.707a1 1 0 01-1.414-1.414L8.586 12 5.879 9.293a1 1 0 011.414-1.414L10 10.586z"
										clip-rule="evenodd"
									/>
								</svg>
								<span class="text-red-700">{error}</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Right Column: Payment Summary -->
				<div class="space-y-6">
					<!-- Payment Summary -->
					<PaymentSummary />

					<!-- Payment Actions -->
					<div class="space-y-3">
						<button
							type="button"
							onclick={handlePayment}
							disabled={!isFormValid || isLoading}
							class="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
						>
							{isLoading
								? 'Processing Payment...'
								: paymentMethod === 'credit_card'
									? 'Pay Now'
									: 'Confirm Bank Transfer'}
						</button>

						<button
							type="button"
							onclick={cancelPayment}
							disabled={isLoading}
							class="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Cancel Payment
						</button>
					</div>

					<!-- Security Notice -->
					<div class="bg-green-50 border border-green-200 rounded-lg p-4">
						<div class="flex items-start">
							<svg
								class="w-5 h-5 text-green-600 mt-0.5 mr-3"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<h3 class="text-sm font-medium text-green-800">Secure Payment</h3>
								<p class="text-sm text-green-700 mt-1">
									{paymentMethod === 'credit_card'
										? 'Your payment information is encrypted and secure.'
										: 'Bank transfers are processed through secure banking channels.'}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
