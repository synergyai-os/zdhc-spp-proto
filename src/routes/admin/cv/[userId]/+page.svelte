<script lang="ts">
	import { page } from '$app/stores';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import CVDetailView from '$lib/components/admin/CVDetailView.svelte';
	import { goto } from '$app/navigation';

	const client = useConvexClient();

	// Get userId from route params
	let userId = $derived($page.params.userId);

	// Query CV detail data
	const cvData = useQuery((api as any).adminCVReview.getExpertCVDetail, () =>
		userId ? { userId } : { userId: '' }
	);

	// Get all experts for navigation
	const allExpertsData = useQuery((api as any).adminCVReview.getExpertsForCVReview, {
		status: undefined,
		organizationId: undefined,
		searchTerm: undefined
	});

	let allExperts = $derived(allExpertsData?.data || []);
	let currentExpertIndex = $derived(
		allExperts.findIndex((expert: any) => expert.userId === userId)
	);

	let hasPrevious = $derived(currentExpertIndex > 0);
	let hasNext = $derived(currentExpertIndex < allExperts.length - 1);

	let previousUserId = $derived(hasPrevious ? allExperts[currentExpertIndex - 1]?.userId : null);
	let nextUserId = $derived(hasNext ? allExperts[currentExpertIndex + 1]?.userId : null);

	// Handle approval changes (refresh data)
	function handleApprovalChange() {
		// The query will automatically refresh due to Convex reactivity
		console.log('Approval changed, data will refresh automatically');
	}

	function goToPrevious() {
		if (previousUserId) {
			goto(`/admin/cv/${previousUserId}`);
		}
	}

	function goToNext() {
		if (nextUserId) {
			goto(`/admin/cv/${nextUserId}`);
		}
	}

	function goBackToList() {
		goto('/admin');
	}
</script>

<svelte:head>
	<title>
		{cvData?.data?.user
			? `${cvData.data.user.firstName} ${cvData.data.user.lastName} - CV Review | Admin`
			: 'CV Review | Admin'}
	</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen">
	<div class="max-w-7xl mx-auto px-6 py-8">
		<!-- Header with Navigation -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<button
						type="button"
						onclick={goBackToList}
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
						Back to List
					</button>

					<div class="flex items-center space-x-2">
						<button
							type="button"
							onclick={goToPrevious}
							disabled={!hasPrevious}
							class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Previous
						</button>

						<button
							type="button"
							onclick={goToNext}
							disabled={!hasNext}
							class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
							<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</div>
				</div>

				<div class="text-sm text-gray-500">
					{#if allExperts.length > 0}
						{currentExpertIndex + 1} of {allExperts.length} experts
					{/if}
				</div>
			</div>
		</div>

		<!-- Loading State -->
		{#if cvData?.isLoading}
			<div class="text-center py-12">
				<div
					class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"
				></div>
				<p class="text-gray-500">Loading CV details...</p>
			</div>
		{:else if cvData?.error}
			<div class="text-center py-12">
				<svg
					class="w-12 h-12 text-red-300 mx-auto mb-4"
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
				<h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading CV</h3>
				<p class="text-gray-500 mb-4">{cvData.error}</p>
				<button
					type="button"
					onclick={goBackToList}
					class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Back to List
				</button>
			</div>
		{:else if !cvData?.data}
			<div class="text-center py-12">
				<svg
					class="w-12 h-12 text-gray-300 mx-auto mb-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					/>
				</svg>
				<h3 class="text-lg font-medium text-gray-900 mb-2">Expert Not Found</h3>
				<p class="text-gray-500 mb-4">The requested expert could not be found.</p>
				<button
					type="button"
					onclick={goBackToList}
					class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Back to List
				</button>
			</div>
		{:else}
			<!-- CV Detail View -->
			<CVDetailView cvData={cvData.data} onApprovalChange={handleApprovalChange} />
		{/if}

		<!-- Footer Navigation -->
		{#if cvData?.data && allExperts.length > 1}
			<div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div class="text-sm text-gray-600">
						Navigate between experts to review multiple CVs efficiently
					</div>
					<div class="flex items-center space-x-3">
						<button
							type="button"
							onclick={goToPrevious}
							disabled={!hasPrevious}
							class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Previous Expert
						</button>

						<button
							type="button"
							onclick={goToNext}
							disabled={!hasNext}
							class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next Expert
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
