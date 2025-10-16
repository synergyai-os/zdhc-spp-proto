/// file: src/lib/components/experts/ExpertCardView.svelte
<script lang="ts">
	import type { ExpertGroup } from '$lib/stores/experts.svelte';
	import { getStatusColor } from '$lib/stores/experts.svelte';
	
	interface Props {
		experts: ExpertGroup[];
		isLoading?: boolean;
		error?: string | null;
		onEditExpert?: (expertId: string) => void;
	}
	
	let { experts, isLoading = false, error = null, onEditExpert }: Props = $props();
	
	function handleEditExpert(expertId: string) {
		onEditExpert?.(expertId);
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	{#if isLoading}
		<div class="text-center py-8 text-gray-500">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p>Loading experts...</p>
		</div>
	{:else if error}
		<div class="text-center py-8 text-red-500">
			<p class="text-lg font-medium mb-2">Error loading experts</p>
			<p class="text-sm">{error}</p>
		</div>
	{:else if experts.length === 0}
		<div class="text-center py-8 text-gray-500">
			<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
			</svg>
			<p class="text-lg font-medium mb-2">No experts for this organization</p>
			<p class="text-sm">Use the "Add Expert" button below to add your first expert</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each experts as expertGroup (expertGroup.user._id)}
				<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-center">
							<div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
								{expertGroup.user.firstName?.[0] || ''}{expertGroup.user.lastName?.[0] || ''}
							</div>
							<div class="ml-3">
								<h3 class="font-semibold text-gray-800">
									{expertGroup.user.firstName && expertGroup.user.lastName 
										? `${expertGroup.user.firstName} ${expertGroup.user.lastName}`.trim()
										: expertGroup.user.email
									}
								</h3>
								<p class="text-sm text-gray-600">{expertGroup.user.email}</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if expertGroup.assignments.some((a: any) => a.role === 'lead')}
								<span class="px-2 py-1 text-xs rounded-full bg-yellow-200 text-yellow-800 font-semibold">
									LEAD EXPERT
								</span>
							{/if}
							<span class="text-xs text-gray-500">
								{expertGroup.serviceCount} service{expertGroup.serviceCount !== 1 ? 's' : ''}
							</span>
						</div>
					</div>
					
					<div class="space-y-2">
						<div>
							<span class="text-xs font-medium text-gray-500">Services & Roles:</span>
							<div class="mt-1 flex flex-wrap gap-1">
								{#each expertGroup.assignments as assignment}
									<div class="flex items-center gap-1">
										<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
											{assignment.serviceVersion?.name || 'Unknown Service'}
										</span>
										{#if assignment.role === 'lead'}
											<span class="px-1.5 py-0.5 text-xs rounded-full bg-yellow-200 text-yellow-800 font-semibold">
												LEAD
											</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
						
						<div class="flex items-center justify-between">
							<span class="text-xs text-gray-500">
								{expertGroup.assignments.length} assignment{expertGroup.assignments.length !== 1 ? 's' : ''}
							</span>
							<div class="flex flex-wrap gap-1">
								{#each expertGroup.assignments as assignment}
									<span class="px-2 py-1 text-xs rounded-full {getStatusColor(assignment.status)}">
										{assignment.status.replace('_', ' ')}
									</span>
								{/each}
							</div>
						</div>
						
						<!-- Actions -->
						<div class="flex items-center justify-end pt-2 border-t border-gray-100">
							<button
								type="button"
								onclick={() => handleEditExpert(expertGroup.user._id)}
								class="text-gray-400 hover:text-gray-600 transition-colors"
								title="Edit Expert"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
