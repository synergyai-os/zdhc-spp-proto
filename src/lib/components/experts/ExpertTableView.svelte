/// file: src/lib/components/experts/ExpertTableView.svelte
<script lang="ts">
	import type { ExpertTableRow } from '$lib/stores/experts.svelte';
	import { getStatusColor, getPaymentStatusColor } from '$lib/stores/experts.svelte';
	
	interface Props {
		experts: ExpertTableRow[];
		isLoading?: boolean;
		error?: string | null;
		onEditExpert?: (expertId: string) => void;
	}
	
	let { experts, isLoading = false, error = null, onEditExpert }: Props = $props();
	
	function handleEditExpert(expertId: string) {
		onEditExpert?.(expertId);
	}
</script>

<div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
	{#if isLoading}
		<div class="p-8 text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p class="text-gray-600">Loading experts...</p>
		</div>
	{:else if error}
		<div class="p-8 text-center text-red-500">
			<p class="text-lg font-medium mb-2">Error loading experts</p>
			<p class="text-sm">{error}</p>
		</div>
	{:else if experts.length === 0}
		<div class="p-8 text-center text-gray-500">
			<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
			</svg>
			<p class="text-lg font-medium mb-2">No experts found</p>
			<p class="text-sm">Add your first expert to get started</p>
		</div>
	{:else}
		<!-- Table Header -->
		<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900">Expert Management</h3>
				<span class="text-sm text-gray-600">{experts.length} expert{experts.length !== 1 ? 's' : ''}</span>
			</div>
		</div>
		
		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Expert
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Services
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Payment
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Next Action
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each experts as expert (expert.id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<!-- Expert Info -->
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div class="flex-shrink-0 h-10 w-10">
										<div class="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
											{expert.avatar}
										</div>
									</div>
									<div class="ml-4">
										<div class="text-sm font-medium text-gray-900">
											{expert.name}
										</div>
										<div class="text-sm text-gray-500">
											{expert.email}
										</div>
									</div>
									{#if expert.hasLeadRole}
										<div class="ml-2">
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
												LEAD
											</span>
										</div>
									{/if}
								</div>
							</td>
							
							<!-- Services -->
							<td class="px-6 py-4">
								<div class="flex flex-wrap gap-1">
									{#each expert.services as service}
										<div class="flex items-center gap-1">
											<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
												{service.name}
											</span>
											{#if service.isLead}
												<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-800">
													L
												</span>
											{/if}
										</div>
									{/each}
								</div>
								<div class="text-xs text-gray-500 mt-1">
									{expert.totalAssignments} assignment{expert.totalAssignments !== 1 ? 's' : ''}
								</div>
							</td>
							
							<!-- Current Status -->
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(expert.currentStatus)}">
									{expert.currentStatus.replace('_', ' ')}
								</span>
							</td>
							
							<!-- Payment Status -->
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getPaymentStatusColor(expert.paymentStatus)}">
									{expert.paymentStatus}
								</span>
							</td>
							
							<!-- Next Action -->
							<td class="px-6 py-4">
								<div class="text-sm text-gray-900">
									{expert.nextAction}
								</div>
							</td>
							
							<!-- Actions -->
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
								<button
									type="button"
									onclick={() => handleEditExpert(expert.id)}
									class="text-gray-400 hover:text-gray-600 transition-colors"
									title="Edit Expert"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
									</svg>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		
		<!-- Table Footer -->
		<div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
			<div class="flex items-center justify-between text-sm text-gray-600">
				<span>Showing {experts.length} expert{experts.length !== 1 ? 's' : ''}</span>
				<div class="flex items-center space-x-4">
					<span>LEAD experts: {experts.filter(e => e.hasLeadRole).length}</span>
					<span>Paid: {experts.filter(e => e.paymentStatus === 'paid').length}</span>
				</div>
			</div>
		</div>
	{/if}
</div>
