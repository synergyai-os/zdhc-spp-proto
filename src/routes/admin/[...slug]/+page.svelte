<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let currentPath = $derived($page.url.pathname);

	function goToDashboard() {
		goto('/admin');
	}
</script>

<svelte:head>
	<title>Page Not Found | Admin</title>
</svelte:head>

<div class="p-8">
	<div class="max-w-2xl mx-auto">
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<h1 class="text-2xl font-semibold text-gray-900 mb-2">This page does not exist yet</h1>
			<p class="text-gray-500 mb-1">The page <code class="text-sm bg-gray-100 px-2 py-1 rounded">{currentPath}</code> has not been implemented.</p>
			<p class="text-sm text-gray-400 mb-8">Please check back later or return to the dashboard.</p>
			<button
				type="button"
				onclick={goToDashboard}
				class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Back to Dashboard
			</button>
		</div>
	</div>
</div>

