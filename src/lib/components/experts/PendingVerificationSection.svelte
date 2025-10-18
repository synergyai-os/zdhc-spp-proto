<script lang="ts">
	import type { ExpertTableRow } from '$lib/stores/experts.svelte';

	interface Props {
		experts: ExpertTableRow[];
		isLoading?: boolean;
		onSendReminder?: (expertId: string) => void;
		onViewDetails?: (expertId: string) => void;
		onCompleteProfile?: (expertId: string) => void;
	}

	let {
		experts,
		isLoading = false,
		onSendReminder,
		onViewDetails,
		onCompleteProfile
	}: Props = $props();

	function handleSendReminder(expertId: string) {
		onSendReminder?.(expertId);
	}

	function handleViewDetails(expertId: string) {
		onViewDetails?.(expertId);
	}

	function handleCompleteProfile(expertId: string) {
		onCompleteProfile?.(expertId);
	}

	function getProfileCompletionPercentage(step?: number): number {
		if (!step) return 0;
		return Math.min((step / 5) * 100, 100);
	}

	function getProfileStatusText(expert: ExpertTableRow): string {
		if (expert.isProfileComplete) return 'Complete';
		if (expert.profileCompletionStep) {
			return `Step ${expert.profileCompletionStep}/5`;
		}
		return 'Not Started';
	}
</script>

{#if experts.length > 0}
	<div class="bg-white border border-amber-200 rounded-lg shadow-sm overflow-hidden mb-6">
		<!-- Header -->
		<div class="px-6 py-4 bg-amber-50 border-b border-amber-200">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<div class="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full mr-3">
						<svg
							class="w-5 h-5 text-amber-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-amber-800">Pending Account Verification</h3>
						<p class="text-sm text-amber-700">
							These experts need to verify their PDC account before proceeding
						</p>
					</div>
				</div>
				<div class="flex items-center">
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
					>
						{experts.length} pending
					</span>
				</div>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Expert
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Services
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Profile Status
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Verification
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
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
										<div
											class="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-semibold text-sm"
										>
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
											<span
												class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
											>
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
											{#if service.name === 'Awaiting service selection'}
												<span
													class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
												>
													Awaiting service selection
												</span>
											{:else}
												<span
													class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
												>
													{service.name}
												</span>
											{/if}
											{#if service.isLead}
												<span
													class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-800"
												>
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

							<!-- Profile Status -->
							<td class="px-6 py-4 whitespace-nowrap">
								{#if expert.isProfileComplete}
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
									>
										Complete
									</span>
								{:else if expert.profileCompletionStep}
									<div class="space-y-1">
										<span
											class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
										>
											Draft
										</span>
										<div class="text-xs text-gray-500">
											{getProfileStatusText(expert)}
										</div>
									</div>
								{:else}
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
									>
										Not Started
									</span>
								{/if}
							</td>

							<!-- Verification Status -->
							<td class="px-6 py-4 whitespace-nowrap">
								{#if expert.isActive}
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
									>
										Verified
									</span>
								{:else}
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
									>
										Not Verified
									</span>
								{/if}
							</td>

							<!-- Actions -->
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
								<div class="flex items-center justify-end space-x-2">
									{#if !expert.isProfileComplete}
										<button
											type="button"
											onclick={() => handleCompleteProfile(expert.id)}
											class="text-blue-600 hover:text-blue-800 text-xs font-medium"
											title="Complete Profile"
										>
											Complete Profile
										</button>
									{/if}

									{#if !expert.isActive}
										<button
											type="button"
											onclick={() => handleSendReminder(expert.id)}
											class="text-amber-600 hover:text-amber-800 text-xs font-medium"
											title="Send Verification Reminder"
										>
											Send Reminder
										</button>
									{/if}

									<button
										type="button"
										onclick={() => handleViewDetails(expert.id)}
										class="text-gray-400 hover:text-gray-600 transition-colors"
										title="View Details"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Table Footer -->
		<div class="px-6 py-3 bg-amber-50 border-t border-amber-200">
			<div class="flex items-center justify-between text-sm text-amber-800">
				<span
					>Showing {experts.length} expert{experts.length !== 1 ? 's' : ''} pending verification</span
				>
				<div class="flex items-center space-x-4">
					<span>Draft profiles: {experts.filter((e) => !e.isProfileComplete).length}</span>
					<span>Complete profiles: {experts.filter((e) => e.isProfileComplete).length}</span>
				</div>
			</div>
		</div>
	</div>
{/if}
