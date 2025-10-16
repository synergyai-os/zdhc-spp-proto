<script lang="ts">
	import { checkoutStore } from '$lib/stores/checkout.svelte';

	// Store state
	let storeState = $derived($checkoutStore);
	let paymentMethod = $derived(storeState.paymentMethod);

	// Handle payment method change
	function handleMethodChange(method: 'credit_card' | 'bank_transfer') {
		checkoutStore.setPaymentMethod(method);
	}
</script>

<div class="space-y-4">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>

	<div class="space-y-3">
		<!-- Credit Card Option -->
		<label
			class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 {paymentMethod ===
			'credit_card'
				? 'border-blue-500 bg-blue-50'
				: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
		>
			<input
				type="radio"
				name="paymentMethod"
				value="credit_card"
				checked={paymentMethod === 'credit_card'}
				onchange={() => handleMethodChange('credit_card')}
				class="sr-only"
			/>
			<div class="flex items-center space-x-3">
				<div class="flex-shrink-0">
					<div
						class="w-6 h-6 rounded-full border-2 flex items-center justify-center {paymentMethod ===
						'credit_card'
							? 'border-blue-500 bg-blue-500'
							: 'border-gray-300'}"
					>
						{#if paymentMethod === 'credit_card'}
							<div class="w-2 h-2 bg-white rounded-full"></div>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-3">
					<!-- Credit Card Icon -->
					<svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
						/>
					</svg>
					<div>
						<div class="text-sm font-medium text-gray-900">Credit Card</div>
						<div class="text-xs text-gray-500">Visa, Mastercard, American Express</div>
					</div>
				</div>
			</div>
		</label>

		<!-- Bank Transfer Option -->
		<label
			class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 {paymentMethod ===
			'bank_transfer'
				? 'border-blue-500 bg-blue-50'
				: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
		>
			<input
				type="radio"
				name="paymentMethod"
				value="bank_transfer"
				checked={paymentMethod === 'bank_transfer'}
				onchange={() => handleMethodChange('bank_transfer')}
				class="sr-only"
			/>
			<div class="flex items-center space-x-3">
				<div class="flex-shrink-0">
					<div
						class="w-6 h-6 rounded-full border-2 flex items-center justify-center {paymentMethod ===
						'bank_transfer'
							? 'border-blue-500 bg-blue-500'
							: 'border-gray-300'}"
					>
						{#if paymentMethod === 'bank_transfer'}
							<div class="w-2 h-2 bg-white rounded-full"></div>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-3">
					<!-- Bank Icon -->
					<svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
						/>
					</svg>
					<div>
						<div class="text-sm font-medium text-gray-900">Bank Transfer</div>
						<div class="text-xs text-gray-500">Direct bank transfer (IBAN)</div>
					</div>
				</div>
			</div>
		</label>
	</div>

	<!-- Payment Method Info -->
	{#if paymentMethod === 'credit_card'}
		<div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex items-start space-x-2">
				<svg class="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="text-sm text-blue-700">
					<p class="font-medium">Credit Card Payment</p>
					<p class="mt-1">
						Payment will be processed immediately. You'll receive instant confirmation.
					</p>
				</div>
			</div>
		</div>
	{:else if paymentMethod === 'bank_transfer'}
		<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
			<div class="flex items-start space-x-2">
				<svg class="w-4 h-4 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="text-sm text-yellow-700">
					<p class="font-medium">Bank Transfer Payment</p>
					<p class="mt-1">
						Payment status will be updated to "pending" until bank confirmation is received.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
