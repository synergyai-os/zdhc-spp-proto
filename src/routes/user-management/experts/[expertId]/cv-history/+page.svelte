<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../../../convex/_generated/api';
	import { goto } from '$app/navigation';

	// Get expertId from route params
	let expertId = $derived($page.params.expertId);

	// Query CV history data
	const cvHistory = useQuery(api.expertCVs.getExpertCVHistory, () => {
		// For now, we'll need to get the userId and organizationId from the expertId
		// In a real implementation, you might want to create a query that takes expertId directly
		// For now, we'll use placeholder values
		return { 
			userId: expertId as any, 
			organizationId: 'j1j1j1j1j1j1j1j1j1j1j1j1' as any 
		};
	});

	// Get user details
	const userDetails = useQuery(api.utilities.getUsers, () => ({}));

	// Find the user for this expert
	let currentUser = $derived(
		userDetails?.data?.find((user: any) => user._id === expertId)
	);

	// Format date for display
	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get status color
	function getStatusColor(status: string): string {
		switch (status) {
			case 'draft':
				return 'bg-gray-100 text-gray-800';
			case 'submitted':
				return 'bg-blue-100 text-blue-800';
			case 'locked':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Get status display name
	function getStatusDisplayName(status: string): string {
		switch (status) {
			case 'draft':
				return 'Draft';
			case 'submitted':
				return 'Under Review';
			case 'locked':
				return 'Completed';
			default:
				return status;
		}
	}

	// Navigation
	function goBack() {
		goto('/user-management?section=experts');
	}

	function viewCVDetails(cvId: string) {
		// In a real implementation, you might want to show CV details in a modal
		// or navigate to a detailed view
		console.log('View CV details:', cvId);
	}

	function compareCVs(cv1: any, cv2: any) {
		// In a real implementation, you would implement CV comparison
		console.log('Compare CVs:', cv1._id, cv2._id);
	}
</script>

<svelte:head>
	<title>
		CV History - {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Expert'} | User Management
	</title>
</svelte:head>

<div class="bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-6">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<button
						type="button"
						onclick={goBack}
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Back to Experts
					</button>

					<div>
						<h1 class="text-3xl font-bold text-gray-800 mb-2">CV History</h1>
						<p class="text-gray-600">
							{currentUser 
								? `CV versions for ${currentUser.firstName} ${currentUser.lastName}` 
								: 'Loading expert details...'}
						</p>
					</div>
				</div>

				<div class="flex items-center space-x-3">
					<button
						type="button"
						onclick={() => goto(`/user-management/experts/${expertId}/edit`)}
						class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
					>
						Create New CV Version
					</button>
				</div>
			</div>
		</div>

		{#if !cvHistory?.data}
			<!-- Loading State -->
			<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
				<div class="flex items-center justify-center">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span class="ml-3 text-gray-600">Loading CV history...</span>
				</div>
			</div>
		{:else if cvHistory.data.length === 0}
			<!-- Empty State -->
			<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
				<div class="text-center">
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
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No CV History</h3>
					<p class="text-gray-600 mb-4">This expert hasn't created any CVs yet.</p>
					<button
						type="button"
						onclick={() => goto(`/user-management/experts/${expertId}/edit`)}
						class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
					>
						Create First CV
					</button>
				</div>
			</div>
		{:else}
			<!-- CV Timeline -->
			<div class="space-y-6">
				{#each cvHistory.data as cv, index (cv._id)}
					<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<!-- CV Header -->
								<div class="flex items-center space-x-4 mb-4">
									<div class="flex items-center space-x-2">
										<span class="text-2xl font-bold text-gray-800">v{cv.version}</span>
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(cv.status)}">
											{getStatusDisplayName(cv.status)}
										</span>
									</div>
									
									<div class="text-sm text-gray-500">
										Created: {formatDate(cv.createdAt)}
									</div>
									
									{#if cv.submittedAt}
										<div class="text-sm text-gray-500">
											Submitted: {formatDate(cv.submittedAt)}
										</div>
									{/if}
									
									{#if cv.lockedAt}
										<div class="text-sm text-gray-500">
											Completed: {formatDate(cv.lockedAt)}
										</div>
									{/if}
								</div>

								<!-- CV Summary -->
								<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
									<div>
										<h4 class="text-sm font-medium text-gray-900 mb-2">Experience</h4>
										<div class="text-sm text-gray-600">
											{cv.experience?.length || 0} positions
										</div>
									</div>
									<div>
										<h4 class="text-sm font-medium text-gray-900 mb-2">Education</h4>
										<div class="text-sm text-gray-600">
											{cv.education?.length || 0} degrees/certifications
										</div>
									</div>
									<div>
										<h4 class="text-sm font-medium text-gray-900 mb-2">Services</h4>
										<div class="text-sm text-gray-600">
											{cv.assignmentCount || 0} service assignments
											{#if cv.approvedCount > 0}
												<span class="text-green-600 ml-1">({cv.approvedCount} approved)</span>
											{/if}
											{#if cv.pendingCount > 0}
												<span class="text-yellow-600 ml-1">({cv.pendingCount} pending)</span>
											{/if}
										</div>
									</div>
								</div>

								<!-- Notes -->
								{#if cv.notes}
									<div class="mb-4">
										<h4 class="text-sm font-medium text-gray-900 mb-2">Notes</h4>
										<div class="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
											{cv.notes}
										</div>
									</div>
								{/if}
							</div>

							<!-- Actions -->
							<div class="flex items-center space-x-2 ml-6">
								<button
									type="button"
									onclick={() => viewCVDetails(cv._id)}
									class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
									View Details
								</button>

								{#if index > 0}
									<button
										type="button"
										onclick={() => compareCVs(cv, cvHistory.data[index - 1])}
										class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										</svg>
										Compare
									</button>
								{/if}
							</div>
						</div>

						<!-- Timeline Indicator -->
						{#if index < cvHistory.data.length - 1}
							<div class="mt-6 pt-6 border-t border-gray-200">
								<div class="flex items-center">
									<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
									<div class="ml-3 text-sm text-gray-500">
										Next: CV v{cvHistory.data[index + 1].version} created
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Summary Stats -->
			<div class="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">CV History Summary</h3>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div class="text-center">
						<div class="text-2xl font-bold text-blue-600">{cvHistory.data.length}</div>
						<div class="text-sm text-gray-600">Total Versions</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-green-600">
							{cvHistory.data.filter(cv => cv.status === 'locked').length}
						</div>
						<div class="text-sm text-gray-600">Completed</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-yellow-600">
							{cvHistory.data.filter(cv => cv.status === 'submitted').length}
						</div>
						<div class="text-sm text-gray-600">Under Review</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-600">
							{cvHistory.data.filter(cv => cv.status === 'draft').length}
						</div>
						<div class="text-sm text-gray-600">Drafts</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
