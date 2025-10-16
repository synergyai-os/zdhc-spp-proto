<script lang="ts">
	import { checkoutStore, type CheckoutExpert } from '$lib/stores/checkout.svelte';
	
	// Props
	interface Props {
		expert: CheckoutExpert;
	}
	
	let { expert }: Props = $props();
	
	// Store state
	let storeState = $derived($checkoutStore);
	let isSelected = $derived(storeState.selectedExpertIds.includes(expert.assignmentId));
	let canSelect = $derived(expert.isUserVerified);
	
	// Handle selection toggle
	function toggleSelection() {
		if (canSelect) {
			checkoutStore.toggleExpertSelection(expert.assignmentId);
		}
	}
</script>

<div class="border border-gray-200 rounded-lg p-4 transition-all duration-200 {
	!canSelect ? 'bg-gray-50 border-gray-300 opacity-60' : 
	isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300 hover:bg-gray-50'
}">
	<div class="flex items-start space-x-4">
		<!-- Checkbox -->
		<div class="flex-shrink-0 pt-1">
			<input
				type="checkbox"
				checked={isSelected}
				disabled={!canSelect}
				onchange={toggleSelection}
				class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
			/>
		</div>
		
		<!-- Expert Info -->
		<div class="flex-1 min-w-0">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<!-- Expert Name and Email -->
					<div class="mb-2">
						<h3 class="text-lg font-semibold text-gray-900 {
							!canSelect ? 'text-gray-500' : ''
						}">
							{expert.userName}
						</h3>
						<p class="text-sm text-gray-600 {!canSelect ? 'text-gray-400' : ''}">
							{expert.userEmail}
						</p>
					</div>
					
					<!-- Service Information -->
					<div class="mb-3">
						<div class="flex items-center space-x-2 mb-1">
							<span class="text-sm font-medium text-gray-700 {!canSelect ? 'text-gray-500' : ''}">
								Service:
							</span>
							<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium {
								!canSelect ? 'bg-gray-200 text-gray-600' : ''
							}">
								{expert.serviceVersionName}
							</span>
						</div>
						
						<div class="flex items-center space-x-2">
							<span class="text-sm font-medium text-gray-700 {!canSelect ? 'text-gray-500' : ''}">
								Category:
							</span>
							<span class="text-sm text-gray-600 {!canSelect ? 'text-gray-400' : ''}">
								{expert.serviceParentName}
							</span>
						</div>
					</div>
					
					<!-- Role Badge -->
					<div class="mb-3">
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
							expert.role === 'lead' 
								? 'bg-yellow-100 text-yellow-800' 
								: 'bg-gray-100 text-gray-800'
						} {
							!canSelect ? 'opacity-50' : ''
						}">
							{#if expert.role === 'lead'}
								<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3 3a1 1 0 000 2v11a1 1 0 102 0V5a1 1 0 011-1h7a1 1 0 100 2H6v10a1 1 0 102 0V6h7a1 1 0 100-2H6a3 3 0 00-3 3z" clip-rule="evenodd"/>
								</svg>
								LEAD Expert
							{:else}
								Regular Expert
							{/if}
						</span>
					</div>
					
					<!-- Verification Status -->
					{#if !canSelect}
						<div class="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
							<svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
							</svg>
							<span class="text-sm font-medium text-yellow-800">
								Expert account not verified
							</span>
						</div>
					{/if}
				</div>
				
				<!-- Price -->
				<div class="flex-shrink-0 text-right">
					<div class="text-lg font-bold text-gray-900 {
						!canSelect ? 'text-gray-500' : ''
					}">
						€{expert.price.toFixed(2)}
					</div>
					<div class="text-xs text-gray-500 {!canSelect ? 'text-gray-400' : ''}">
						per service
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
