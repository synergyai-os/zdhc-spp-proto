<script lang="ts">
	import type { ExpertTableRow } from '$lib/stores/experts.svelte';
	
	interface Props {
		experts: ExpertTableRow[];
		isLoading?: boolean;
		onSendReminder?: (expertId: string) => void;
		onViewDetails?: (expertId: string) => void;
	}
	
	let { experts, isLoading = false, onSendReminder, onViewDetails }: Props = $props();
	
	function handleSendReminder(expertId: string) {
		onSendReminder?.(expertId);
	}
	
	function handleViewDetails(expertId: string) {
		onViewDetails?.(expertId);
	}
</script>

{#if experts.length > 0}
	<div class="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center">
				<div class="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full mr-3">
					<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-amber-800">Pending Account Verification</h3>
					<p class="text-sm text-amber-700">These experts need to verify their PDC account before proceeding</p>
				</div>
			</div>
			<div class="flex items-center">
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
					{experts.length} pending
				</span>
			</div>
		</div>
		
		<!-- Pending Users Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each experts as expert (expert.id)}
				<div class="bg-white border border-amber-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-center">
							<div class="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
								{expert.avatar}
							</div>
							<div class="ml-3">
								<h4 class="font-semibold text-gray-800">
									{expert.name}
								</h4>
								<p class="text-sm text-gray-600">{expert.email}</p>
							</div>
						</div>
						<div class="flex items-center">
							<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
								Not Verified
							</span>
						</div>
					</div>
					
					<div class="space-y-2">
						<div>
							<span class="text-xs font-medium text-gray-500">Services Assigned:</span>
							<div class="mt-1 flex flex-wrap gap-1">
								{#each expert.services as service}
									<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
										{service.name}
									</span>
								{/each}
							</div>
						</div>
						
						<div class="flex items-center justify-between pt-2 border-t border-gray-100">
							<span class="text-xs text-gray-500">
								{expert.totalAssignments} assignment{expert.totalAssignments !== 1 ? 's' : ''}
							</span>
							<div class="flex items-center space-x-2">
								<button
									type="button"
									onclick={() => handleSendReminder(expert.id)}
									class="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
									title="Send Verification Reminder"
								>
									Send Reminder
								</button>
								<button
									type="button"
									onclick={() => handleViewDetails(expert.id)}
									class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
									title="View Details"
								>
									View Details
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Help Text -->
		<div class="mt-4 p-3 bg-amber-100 rounded-lg">
			<div class="flex items-start">
				<svg class="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<div class="text-sm text-amber-800">
					<p class="font-medium mb-1">Next Steps:</p>
					<p>These experts need to verify their PDC account before you can process payments or invite them to training. Use "Send Reminder" to notify them, or "View Details" to see their verification status.</p>
				</div>
			</div>
		</div>
	</div>
{/if}
