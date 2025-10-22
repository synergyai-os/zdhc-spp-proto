<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import { getContext } from 'svelte';
	import { getServiceStatusColor, getServiceStatusDisplayName } from '../../convex/model/status';

	const orgId = getContext('orgId');

	// Get approved services for the organization
	const approvedServices = useQuery(api.services.getApprovedServices, () => ({
		organizationId: orgId
	}));

	// Get all service assignments for the organization
	const serviceAssignments = useQuery(api.services.getServiceAssignmentsByOrg, () => ({
		organizationId: orgId
	}));

	// Group by parent services, then by service versions
	const parentServicesWithVersions = $derived.by(() => {
		if (!approvedServices?.data || !serviceAssignments?.data) return [];

		// Group services by parent
		const parentGroups = new Map();
		
		approvedServices.data.forEach(service => {
			const parentId = service.parentId;
			if (!parentGroups.has(parentId)) {
				parentGroups.set(parentId, {
					parent: service.serviceParent,
					versions: []
				});
			}
			
			// Get assignments for this service version
			const assignments = serviceAssignments.data.filter(
				assignment => assignment.serviceVersion?._id === service._id
			);

			parentGroups.get(parentId).versions.push({
				...service,
				assignments
			});
		});

		return Array.from(parentGroups.values());
	});
</script>

{#if approvedServices?.isLoading || serviceAssignments?.isLoading}
	<div class="flex justify-center items-center py-12">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
		<span class="ml-3 text-gray-600">Loading services...</span>
	</div>
{:else if approvedServices?.error || serviceAssignments?.error}
	<div class="bg-red-50 border border-red-200 rounded-md p-4">
		<p class="text-red-800">Error loading services: {approvedServices?.error || serviceAssignments?.error}</p>
	</div>
{:else if parentServicesWithVersions.length === 0}
	<div class="text-center py-12">
		<p class="text-gray-500 text-lg">No approved services found for this organization.</p>
	</div>
{:else}
	<div class="space-y-8">
		{#each parentServicesWithVersions as parentService}
			<div>
				<h2 class="text-2xl font-bold text-gray-900 mb-6">{parentService.parent?.name || 'Unknown Service'}</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each parentService.versions as version}
						<div class="bg-white border border-gray-200 rounded-lg shadow-sm">
							<div class="p-4 border-b border-gray-200">
								<h3 class="text-lg font-medium text-gray-900">Version {version.version}</h3>
								<p class="text-sm text-gray-500 mt-1">{version.assignments.length} expert{version.assignments.length !== 1 ? 's' : ''}</p>
							</div>
							
							<div class="p-4">
								{#if version.assignments.length > 0}
									<div class="space-y-3">
										{#each version.assignments as assignment}
											<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
												<div class="flex items-center space-x-3">
													<div class="flex-shrink-0 h-8 w-8">
														<div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
															<span class="text-white font-medium text-xs">
																{assignment.user?.firstName?.[0]}{assignment.user?.lastName?.[0]}
															</span>
														</div>
													</div>
													<div>
														<div class="text-sm font-medium text-gray-900">
															{assignment.user?.firstName} {assignment.user?.lastName}
														</div>
														<div class="text-xs text-gray-500">
															{assignment.role === 'lead' ? 'Lead Expert' : 'Regular Expert'}
														</div>
													</div>
												</div>
												<div class="flex items-center space-x-2">
													<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getServiceStatusColor(assignment.status)}">
														{getServiceStatusDisplayName(assignment.status)}
													</span>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-center py-6">
										<p class="text-gray-500 text-sm">No experts assigned</p>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
