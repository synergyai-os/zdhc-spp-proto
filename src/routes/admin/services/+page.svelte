<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';

	// Get all service parents
	const serviceParents = useQuery(api.serviceVersions.getServiceParents, {});

	// Get all service versions
	const allVersions = useQuery(api.serviceVersions.getServiceVersions, {});

	// Combine parents with their versions
	let services = $derived.by(() => {
		if (!serviceParents?.data || !allVersions?.data) return [];

		return serviceParents.data.map((parent) => {
			const versions = allVersions.data.filter((version) => version.parentId === parent._id);
			return {
				parent,
				versions
			};
		});
	});

	let isLoading = $derived(
		!serviceParents || serviceParents.isLoading || !allVersions || allVersions.isLoading
	);
</script>

<svelte:head>
	<title>Services | Admin</title>
</svelte:head>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-2xl font-semibold text-gray-900 mb-1">Services</h1>
		<p class="text-sm text-gray-500">Manage parent services and their versions</p>
	</div>

	{#if isLoading}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<div class="text-gray-500">Loading services...</div>
		</div>
	{:else if services.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<div class="text-gray-500">No services found</div>
		</div>
	{:else}
		<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Service Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Versions
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each services as service}
						<!-- Parent Service Row -->
						<tr class="bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900">{service.parent.name}</div>
								{#if service.parent.description}
									<div class="text-xs text-gray-500 mt-1">{service.parent.description}</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-500">{service.versions?.length || 0} version{service.versions?.length !== 1 ? 's' : ''}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
									Parent Service
								</span>
							</td>
						</tr>
						<!-- Service Versions -->
						{#if service.versions && service.versions.length > 0}
							{#each service.versions as version}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-3 pl-12">
										<div class="flex items-center">
											<div class="w-1 h-1 bg-gray-400 rounded-full mr-3"></div>
											<div>
												<div class="text-sm text-gray-600 font-medium">{version.name || `Version ${version.version}`}</div>
												{#if version.description}
													<div class="text-xs text-gray-500 mt-0.5">{version.description}</div>
												{/if}
											</div>
										</div>
									</td>
									<td class="px-6 py-3">
										<div class="text-sm text-gray-500">{version.version}</div>
									</td>
									<td class="px-6 py-3 whitespace-nowrap">
										<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {version.isActive
											? 'bg-green-100 text-green-800'
											: 'bg-gray-100 text-gray-800'}">
											{version.isActive ? 'active' : 'inactive'}
										</span>
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td class="px-6 py-3 pl-12" colspan="3">
									<div class="text-sm text-gray-400 italic">No versions</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

