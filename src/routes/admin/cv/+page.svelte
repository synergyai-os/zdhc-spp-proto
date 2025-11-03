<script lang="ts">
	import { goto } from '$app/navigation';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import CVReviewTabTable from '$lib/components/admin/CVReviewTabTable.svelte';

	function handleViewCV(userId: string) {
		goto(`/admin/cv/${userId}`);
	}

	let activeTab = $state<'in-progress' | 'ready' | 'all'>('in-progress');

	function setTab(tab: 'in-progress' | 'ready' | 'all') {
		activeTab = tab;
	}

	// Get stats for tab counts
	const adminStats = useQuery(api.adminCVReview.getAdminStats, {});
	const stats = $derived(adminStats?.data || {
		paidCVs: 0,
		lockedForReviewCVs: 0,
		unlockedForEditsCVs: 0,
		totalCVs: 0
	});

	// Calculate tab counts
	const inProgressCount = $derived(stats.lockedForReviewCVs + stats.unlockedForEditsCVs);
	const readyCount = $derived(stats.paidCVs);
	const allCount = $derived(stats.totalCVs);
</script>

<svelte:head>
	<title>Admin - CV Review | Solution Provider Platform</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-semibold text-gray-900 mb-1">CV Review</h1>
		<p class="text-sm text-gray-500">Review and approve expert CVs for different service versions</p>
	</div>

	<!-- Tab Navigation -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="-mb-px flex space-x-8">
			<button
				type="button"
				onclick={() => setTab('in-progress')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'in-progress'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				In Progress
				<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
					{inProgressCount}
				</span>
			</button>
			<button
				type="button"
				onclick={() => setTab('ready')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'ready'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Ready for Review
				<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
					{readyCount}
				</span>
			</button>
			<button
				type="button"
				onclick={() => setTab('all')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'all'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				All CVs
				<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
					{allCount}
				</span>
			</button>
		</nav>
	</div>

	<!-- Tab Content -->
	<div>
		{#if activeTab === 'in-progress'}
			<CVReviewTabTable 
				onViewCV={handleViewCV} 
				statusFilter={['locked_for_review', 'unlocked_for_edits']}
				tabName="In Progress"
			/>
		{:else if activeTab === 'ready'}
			<CVReviewTabTable 
				onViewCV={handleViewCV} 
				statusFilter="paid"
				tabName="Ready for Review"
			/>
		{:else if activeTab === 'all'}
			<CVReviewTabTable 
				onViewCV={handleViewCV}
				tabName="All CVs"
			/>
		{/if}
	</div>
</div>

