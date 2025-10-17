<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import { organizationStore } from '$lib/stores/organization.svelte';

	// Get current organization
	let orgContext = $derived($organizationStore);
	let currentOrgId = $derived(orgContext.currentOrganization?._id || null);

	// Get organizations
	const organizations = useQuery(api.utilities.getOrganizations, {});

	// Get expert CVs
	const expertCVs = useQuery(
		api.expertCVs.getExpertCVs,
		() => currentOrgId ? { organizationId: currentOrgId as any } : null
	);

	// Get expert service assignments
	const expertServiceAssignments = useQuery(
		api.expertServiceAssignments.getExpertServiceAssignmentsByOrg,
		() => currentOrgId ? { organizationId: currentOrgId as any } : null
	);

	// Set organization for testing
	function setTestOrganization(orgId: string) {
		const org = organizations.data?.find((o: any) => o._id === orgId);
		if (org) {
			organizationStore.setCurrentOrganization(org);
		}
	}
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-4">Test Experts Loading</h1>
	
	<!-- Organization Status -->
	<div class="mb-6 p-4 bg-gray-100 rounded">
		<h2 class="text-lg font-semibold mb-2">Organization Status</h2>
		<p><strong>Current Organization ID:</strong> {currentOrgId || 'None'}</p>
		<p><strong>Organization Name:</strong> {orgContext.currentOrganization?.name || 'None'}</p>
		<p><strong>Available Organizations:</strong> {organizations.data?.length || 0}</p>
	</div>

	<!-- Organization Selector -->
	<div class="mb-6 p-4 bg-blue-50 rounded">
		<h2 class="text-lg font-semibold mb-2">Select Organization for Testing</h2>
		{#if organizations.data}
			<div class="flex flex-wrap gap-2">
				{#each organizations.data as org}
					<button
						onclick={() => setTestOrganization(org._id)}
						class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 {currentOrgId === org._id ? 'bg-blue-700' : ''}"
					>
						{org.name}
					</button>
				{/each}
			</div>
		{:else}
			<p>Loading organizations...</p>
		{/if}
	</div>

	<!-- Expert CVs Status -->
	<div class="mb-6 p-4 bg-green-50 rounded">
		<h2 class="text-lg font-semibold mb-2">Expert CVs Status</h2>
		<p><strong>Loading:</strong> {expertCVs?.isLoading ? 'Yes' : 'No'}</p>
		<p><strong>Error:</strong> {expertCVs?.error?.message || 'None'}</p>
		<p><strong>Data Count:</strong> {expertCVs?.data?.length || 0}</p>
		{#if expertCVs?.data}
			<div class="mt-2">
				<h3 class="font-medium">CVs:</h3>
				<ul class="list-disc list-inside">
					{#each expertCVs.data as cv}
						<li>{cv.user?.firstName} {cv.user?.lastName} - Version {cv.version} - {cv.status}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	<!-- Expert Service Assignments Status -->
	<div class="mb-6 p-4 bg-yellow-50 rounded">
		<h2 class="text-lg font-semibold mb-2">Expert Service Assignments Status</h2>
		<p><strong>Loading:</strong> {expertServiceAssignments?.isLoading ? 'Yes' : 'No'}</p>
		<p><strong>Error:</strong> {expertServiceAssignments?.error?.message || 'None'}</p>
		<p><strong>Data Count:</strong> {expertServiceAssignments?.data?.length || 0}</p>
		{#if expertServiceAssignments?.data}
			<div class="mt-2">
				<h3 class="font-medium">Assignments:</h3>
				<ul class="list-disc list-inside">
					{#each expertServiceAssignments.data as assignment}
						<li>{assignment.user?.firstName} {assignment.user?.lastName} - {assignment.serviceVersion?.name} - {assignment.status}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	<!-- Raw Data (for debugging) -->
	<details class="mb-6">
		<summary class="cursor-pointer font-medium">Raw Data (Click to expand)</summary>
		<div class="mt-2 p-4 bg-gray-50 rounded text-xs">
			<h3>Organizations:</h3>
			<pre>{JSON.stringify(organizations.data, null, 2)}</pre>
			
			<h3 class="mt-4">Expert CVs:</h3>
			<pre>{JSON.stringify(expertCVs.data, null, 2)}</pre>
			
			<h3 class="mt-4">Expert Service Assignments:</h3>
			<pre>{JSON.stringify(expertServiceAssignments.data, null, 2)}</pre>
		</div>
	</details>
</div>
