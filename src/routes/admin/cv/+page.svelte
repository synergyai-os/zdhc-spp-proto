<script lang="ts">
	import { goto } from '$app/navigation';
	import CVReviewTable from '$lib/components/admin/CVReviewTable.svelte';

	function handleViewCV(userId: string) {
		goto(`/admin/cv/${userId}`);
	}
</script>

<svelte:head>
	<title>Admin - CV Review | Solution Provider Platform</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900 mb-1">CV Review Dashboard</h1>
				<p class="text-sm text-gray-500">
					Review and approve expert CVs for different service versions. Each expert can be
					approved or rejected per service.
				</p>
			</div>
			<div class="flex items-center space-x-3">
				<a
					href="/admin/cv"
					class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Refresh
				</a>
			</div>
		</div>
	</div>

	<!-- CV Review Table -->
	<CVReviewTable onViewCV={handleViewCV} />

	<!-- Footer Info -->
	<div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
		<div class="text-center">
			<h3 class="text-lg font-medium text-gray-900 mb-4">CV Review Process</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
				<div>
					<div
						class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2"
					>
						<span class="text-xs font-bold">1</span>
					</div>
					<h4 class="font-medium text-gray-900 mb-1">Expert Pays</h4>
					<p>Expert completes profile and pays for CV review</p>
				</div>
				<div>
					<div
						class="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2"
					>
						<span class="text-xs font-bold">2</span>
					</div>
					<h4 class="font-medium text-gray-900 mb-1">Training Complete</h4>
					<p>Expert completes required training (if applicable)</p>
				</div>
				<div>
					<div
						class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2"
					>
						<span class="text-xs font-bold">3</span>
					</div>
					<h4 class="font-medium text-gray-900 mb-1">Admin Review</h4>
					<p>ZDHC admin reviews CV and approves/rejects per service</p>
				</div>
			</div>
		</div>
	</div>
</div>

