<script lang="ts">
	import ExpertQueries from '$lib/components/queries/ExpertQueries.svelte';
	import { organizationState } from '$lib/stores/organization.svelte';

	// Test with a known expert ID (user ID, not CV ID)
	const testExpertId = 'jd7c4m622nan13ydnfs8ww2fj97smc6w'; // User ID from expert CV
	const orgId = organizationState.currentOrganizationId || 'j975t878dn66x7br1076wb7ey17skxyg';

	// Debug logging
	console.log('🧪 Test page initialized:', { testExpertId, orgId });
</script>

<svelte:head>
	<title>Test Expert Queries - SPP</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-6 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-8">Test Expert Queries</h1>
	
	<ExpertQueries expertId={testExpertId} orgId={orgId}>
		{#snippet children(queryData)}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-800 mb-4">Query Results</h2>
				
				{#if queryData.isLoading}
					<div class="text-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
						<p class="text-gray-600">Loading expert data...</p>
					</div>
				{:else if queryData.hasError}
					<div class="text-center py-8">
						<div class="text-red-600 mb-4">❌ Error loading data</div>
						<p class="text-gray-600">Check console for details</p>
					</div>
				{:else}
					<div class="space-y-4">
						<div>
							<h3 class="font-semibold text-gray-700">Current CV Data:</h3>
							<pre class="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(queryData.currentCVData, null, 2)}</pre>
						</div>
						
						<div>
							<h3 class="font-semibold text-gray-700">User Data:</h3>
							<pre class="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(queryData.userDataResult, null, 2)}</pre>
						</div>
						
						<div>
							<h3 class="font-semibold text-gray-700">Service Versions ({queryData.serviceVersionsData?.length || 0}):</h3>
							<pre class="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(queryData.serviceVersionsData, null, 2)}</pre>
						</div>
					</div>
				{/if}
			</div>
		{/snippet}
	</ExpertQueries>
</div>
