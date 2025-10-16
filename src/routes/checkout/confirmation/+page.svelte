<script lang="ts">
	import { checkoutStore } from '$lib/stores/checkout.svelte';
	import PaymentSummary from '$lib/components/PaymentSummary.svelte';
	
	// Store state
	let storeState = $derived($checkoutStore);
	let selectedExperts = $derived(storeState.experts.filter(expert => 
		storeState.selectedExpertIds.includes(expert.assignmentId)
	));
	let paymentMethod = $derived(storeState.paymentMethod);
	let totalAmount = $derived(storeState.totalAmount);
	
	// Determine if this was a successful payment or pending
	let isSuccessful = $derived(paymentMethod === 'credit_card');
	let statusText = $derived(isSuccessful ? 'Payment Successful' : 'Payment Submitted');
	let statusDescription = $derived(
		isSuccessful 
			? 'Your payment has been processed successfully. Expert statuses have been updated to "paid".'
			: 'Your bank transfer has been submitted. Expert statuses have been updated to "pending payment" until bank confirmation.'
	);
	
	// Navigation functions
	function goToUserManagement() {
		// Clear checkout data
		checkoutStore.clearCheckout();
		window.location.href = '/user-management';
	}
	
	function goToCheckout() {
		// Clear checkout data
		checkoutStore.clearCheckout();
		window.location.href = '/checkout';
	}
	
	// Get payment reference
	let paymentReference = $derived(
		storeState.paymentDetails.bankReference || 
		`CC-${Date.now().toString().slice(-6)}`
	);
</script>

<div class="bg-gray-50 min-h-screen py-8">
	<div class="max-w-4xl mx-auto px-6">
		
		<!-- Success Header -->
		<div class="text-center mb-8">
			<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full {
				isSuccessful ? 'bg-green-100' : 'bg-yellow-100'
			} mb-4">
				{#if isSuccessful}
					<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
				{:else}
					<svg class="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				{/if}
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">{statusText}</h1>
			<p class="text-lg text-gray-600">{statusDescription}</p>
		</div>

		{#if selectedExperts.length === 0}
			<!-- No Payment Data -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">No Payment Information</h2>
				<p class="text-gray-600 mb-4">Unable to display payment confirmation details</p>
				<button
					type="button"
					onclick={goToUserManagement}
					class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
				>
					Go to User Management
				</button>
			</div>
		{:else}
			<!-- Main Confirmation Content -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				
				<!-- Left Column: Payment Details -->
				<div class="lg:col-span-2 space-y-6">
					
					<!-- Payment Summary -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
						
						<div class="space-y-3">
							<div class="flex justify-between">
								<span class="text-sm text-gray-600">Payment Method:</span>
								<span class="text-sm font-medium text-gray-900">
									{paymentMethod === 'credit_card' ? 'Credit Card' : 'Bank Transfer'}
								</span>
							</div>
							
							<div class="flex justify-between">
								<span class="text-sm text-gray-600">Reference Number:</span>
								<span class="text-sm font-medium text-gray-900">{paymentReference}</span>
							</div>
							
							<div class="flex justify-between">
								<span class="text-sm text-gray-600">Amount:</span>
								<span class="text-sm font-bold text-gray-900">€{totalAmount.toFixed(2)}</span>
							</div>
							
							<div class="flex justify-between">
								<span class="text-sm text-gray-600">Date:</span>
								<span class="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
							</div>
							
							<div class="flex justify-between">
								<span class="text-sm text-gray-600">Time:</span>
								<span class="text-sm font-medium text-gray-900">{new Date().toLocaleTimeString()}</span>
							</div>
							
							<div class="flex justify-between">
								<span class="text-sm text-gray-600">Status:</span>
								<span class="text-sm font-medium {
									isSuccessful ? 'text-green-600' : 'text-yellow-600'
								}">
									{isSuccessful ? 'Paid' : 'Pending Payment'}
								</span>
							</div>
						</div>
					</div>
					
					<!-- Expert Status Updates -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Expert Status Updates</h3>
						
						<div class="space-y-3">
							{#each selectedExperts as expert}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center space-x-3">
										<div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-xs">
											{expert.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
										</div>
										<div>
											<p class="text-sm font-medium text-gray-900">{expert.userName}</p>
											<p class="text-xs text-gray-600">{expert.serviceVersionName}</p>
										</div>
									</div>
									<div class="flex items-center space-x-2">
										<span class="px-2 py-1 text-xs rounded-full {
											isSuccessful ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
										}">
											{isSuccessful ? 'Paid' : 'Pending'}
										</span>
										{#if expert.role === 'lead'}
											<span class="px-1.5 py-0.5 text-xs rounded-full bg-yellow-200 text-yellow-800 font-semibold">
												LEAD
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
					
					<!-- Next Steps -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">What Happens Next?</h3>
						
						{#if isSuccessful}
							<!-- Credit Card Success Steps -->
							<div class="space-y-3 text-sm text-gray-600">
								<div class="flex items-start space-x-3">
									<div class="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-semibold">1</div>
									<p><strong>Payment Confirmed:</strong> Your payment has been processed and expert statuses updated to "paid".</p>
								</div>
								<div class="flex items-start space-x-3">
									<div class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</div>
									<p><strong>Training Invitation:</strong> Experts will be invited to complete their training within 24-48 hours.</p>
								</div>
								<div class="flex items-start space-x-3">
									<div class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</div>
									<p><strong>Certification:</strong> After training completion, experts will be certified and ready for service delivery.</p>
								</div>
							</div>
						{:else}
							<!-- Bank Transfer Pending Steps -->
							<div class="space-y-3 text-sm text-gray-600">
								<div class="flex items-start space-x-3">
									<div class="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-semibold">1</div>
									<p><strong>Transfer Submitted:</strong> Your bank transfer has been submitted with reference <strong>{paymentReference}</strong>.</p>
								</div>
								<div class="flex items-start space-x-3">
									<div class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</div>
									<p><strong>Bank Processing:</strong> We'll confirm receipt of your payment within 1-3 business days.</p>
								</div>
								<div class="flex items-start space-x-3">
									<div class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</div>
									<p><strong>Status Update:</strong> Expert statuses will be updated to "paid" once payment is confirmed.</p>
								</div>
								<div class="flex items-start space-x-3">
									<div class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</div>
									<p><strong>Training Invitation:</strong> Training invitations will be sent after payment confirmation.</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
				
				<!-- Right Column: Summary & Actions -->
				<div class="space-y-6">
					
					<!-- Payment Summary -->
					<PaymentSummary compact={true} />
					
					<!-- Action Buttons -->
					<div class="space-y-3">
						<button
							type="button"
							onclick={goToUserManagement}
							class="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
						>
							View Expert Status
						</button>
						
						<button
							type="button"
							onclick={goToCheckout}
							class="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Process Another Payment
						</button>
					</div>
					
					<!-- Contact Information -->
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h3 class="text-sm font-medium text-blue-800 mb-2">Need Help?</h3>
						<p class="text-sm text-blue-700 mb-2">
							If you have any questions about your payment or expert status, please contact us:
						</p>
						<div class="text-sm text-blue-700 space-y-1">
							<p><strong>Email:</strong> support@zdhc.org</p>
							<p><strong>Phone:</strong> +31 20 123 4567</p>
							<p><strong>Reference:</strong> {paymentReference}</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
