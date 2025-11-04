<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';

	// Get all organizations
	const organizationsData = useQuery(api.utilities.getOrganizations, {});

	let organizations = $derived(organizationsData?.data || []);
	let isLoading = $derived(!organizationsData || organizationsData.isLoading);

	// Format organization type for display
	function formatOrgType(type: string): string {
		if (type === 'solution_provider') return 'Solution Provider';
		if (type === 'zdhc_staff') return 'ZDHC Staff';
		return type;
	}
</script>

<svelte:head>
	<title>Organizations | Admin</title>
</svelte:head>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-2xl font-semibold text-gray-900 mb-1">Organizations</h1>
		<p class="text-sm text-gray-500">Manage organizations</p>
	</div>

	{#if isLoading}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<div class="text-gray-500">Loading organizations...</div>
		</div>
	{:else if organizations.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<div class="text-gray-500">No organizations found</div>
		</div>
	{:else}
		<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Organization ID
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Organization Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Type
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Contact Email
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each organizations as org}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-mono text-gray-500">{org._id}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">{org.name}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-500">{formatOrgType(org.type)}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-500">{org.contactEmail}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {org.status === 'active'
									? 'bg-green-100 text-green-800'
									: org.status === 'suspended'
										? 'bg-red-100 text-red-800'
										: 'bg-gray-100 text-gray-800'}">
									{org.status}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

