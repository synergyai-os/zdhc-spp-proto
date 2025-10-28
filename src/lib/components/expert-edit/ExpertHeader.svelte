<script lang="ts">
	import { getCVStatusColor, getCVStatusDisplayName, canEditCVContent } from '../../../convex/model/status';

	interface Props {
		userDetails: any;
		expertCV: any;
		allUserAssignments?: any; // All service assignments for this user across all CVs
	}

	let { userDetails, expertCV, allUserAssignments }: Props = $props();

	// Get user-friendly guidance message based on CV status
	function getStatusGuidance(status: string): { message: string; icon: string } {
		const guidance: Record<string, { message: string; icon: string }> = {
			draft: { 
				message: 'Complete your CV information below to proceed with service applications.',
				icon: '📝'
			},
			completed: { 
				message: 'Your CV is complete. Review and submit for approval when ready.',
				icon: '✅'
			},
			payment_pending: { 
				message: 'Payment is being processed. Please wait for confirmation.',
				icon: '💳'
			},
			paid: { 
				message: 'Payment received. Your CV is being prepared for review.',
				icon: '⏳'
			},
			locked_for_review: { 
				message: 'Your CV is under review. Changes are restricted at this time.',
				icon: '👀'
			},
			unlocked_for_edits: { 
				message: 'Review completed. Please update your CV based on the feedback provided.',
				icon: '✏️'
			},
			locked_final: { 
				message: 'Your CV is finalized and approved. No further edits are allowed.',
				icon: '🔒'
			}
		};
		return guidance[status] || { message: 'Review your CV status below.', icon: 'ℹ️' };
	}
</script>

<!-- Loading State -->
{#if expertCV?.isLoading}
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
		<p class="text-gray-600">Loading CV data...</p>
	</div>
{:else if expertCV?.error}
	<div class="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
		<h2 class="text-xl font-semibold text-red-800 mb-2">Error Loading CV</h2>
		<p class="text-red-600 mb-4">{expertCV.error}</p>
		<button onclick={() => window.location.reload()} class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
			Try Again
		</button>
	</div>
{:else if !expertCV?.data}
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
		<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
			<span class="text-2xl">👤</span>
		</div>
		<h2 class="text-xl font-semibold text-gray-900 mb-2">No CV Found</h2>
		<p class="text-gray-600 mb-4">This expert doesn't have a CV yet.</p>
		<button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
			Create New CV
		</button>
	</div>
{:else}
	<!-- Expert Header with Status - Compact sidebar version -->
	<div class="space-y-4">
		<!-- User Info Card -->
		{#if userDetails?.data}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div class="flex items-center space-x-3 mb-3">
					<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
						<span class="text-lg font-semibold text-blue-600">
							{userDetails.data.firstName[0]}{userDetails.data.lastName[0]}
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<h1 class="text-lg font-bold text-gray-900 truncate">
							{userDetails.data.firstName} {userDetails.data.lastName}
						</h1>
						<p class="text-xs text-gray-600 truncate">{userDetails.data.email}</p>
					</div>
				</div>
				
				<!-- Status Badge -->
				<div class="pt-3 border-t border-gray-200">
					<div class="flex items-center justify-between mb-2">
						<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {userDetails.data.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
							{userDetails.data.isActive ? '✓ Active' : 'Inactive'}
						</span>
						<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getCVStatusColor(expertCV.data.status)}">
							{getCVStatusDisplayName(expertCV.data.status)}
						</span>
					</div>
					
					<!-- Approved Services Section - Show approved services from ALL locked CVs -->
					{#if allUserAssignments?.data}
						<!-- dedupe: only show each service once -->
						{@const approved = (() => {
							const serviceNames = allUserAssignments.data
								.filter((a: any) => a.status === 'approved' && a.expertCV?.status === 'locked_final')
								.map((a: any) => a.serviceVersion?.name)
								.filter(Boolean);
							return serviceNames.filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index);
						})()}
						{#if approved.length > 0}
							<div class="mt-3">
								<p class="text-xs text-gray-500 mb-2">Approved Services</p>
								<div class="flex flex-wrap gap-1">
									{#each approved.slice(0, 3) as serviceName}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
											{serviceName}
										</span>
									{/each}
									{#if approved.length > 3}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600">
											+{approved.length - 3} more
										</span>
									{/if}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
