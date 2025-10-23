<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import type { Id } from '$lib';
	import { getContext } from 'svelte';
	import { getServiceStatusColor, getServiceStatusDisplayName, isQualified } from '../../convex/model/status';

	const orgId = getContext('orgId');

	// Get approved services for the organization
	const approvedServices = useQuery(api.services.getApprovedServices, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Get all service assignments for the organization
	const serviceAssignments = useQuery(api.services.getServiceAssignmentsByOrg, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Categorize services into Active/Not Active and separate Lead/Regular experts
	const categorizedServices = $derived.by(() => {
		if (!approvedServices?.data) {
			return { active: [], inactive: [] };
		}

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
			
			// Get assignments for this service version (if any)
			const assignments = serviceAssignments?.data?.filter(
				assignment => assignment.serviceVersion?._id === service._id
			) || [];

			// Separate experts by role and status
			const leadExperts = assignments.filter(a => a.role === 'lead');
			const regularExperts = assignments.filter(a => a.role === 'regular');
			const approvedLeadExperts = leadExperts.filter(a => a.status === 'approved');
			const approvedRegularExperts = regularExperts.filter(a => a.status === 'approved');
			const pendingExperts = assignments.filter(a => a.status === 'pending_review');
			const rejectedExperts = assignments.filter(a => a.status === 'rejected');

			// Service is active if it has at least one approved lead expert who is qualified (passed training)
			const qualifiedLeadExperts = approvedLeadExperts.filter(a => 
				a.trainingStatus && isQualified(a.trainingStatus)
			);
			const isActive = qualifiedLeadExperts.length > 0;

			parentGroups.get(parentId).versions.push({
				...service,
				assignments,
				leadExperts,
				regularExperts,
				approvedLeadExperts,
				approvedRegularExperts,
				qualifiedLeadExperts,
				pendingExperts,
				rejectedExperts,
				isActive
			});
		});

		// Separate into active and inactive parent services
		const allParentServices = Array.from(parentGroups.values());
		
		const activeParentServices = allParentServices
			.filter(parentService => parentService.versions.some((v: any) => v.isActive))
			.map(parentService => ({
				...parentService,
				versions: parentService.versions.filter((v: any) => v.isActive)
			}));

		const inactiveParentServices = allParentServices
			.filter(parentService => !parentService.versions.some((v: any) => v.isActive))
			.map(parentService => ({
				...parentService,
				versions: parentService.versions.filter((v: any) => !v.isActive)
			}));

		return {
			active: activeParentServices,
			inactive: inactiveParentServices
		};
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
{:else if categorizedServices.active.length === 0 && categorizedServices.inactive.length === 0}
	<div class="text-center py-12">
		<p class="text-gray-500 text-lg">No approved services found for this organization.</p>
	</div>
{:else}
	<div class="space-y-12">
		<!-- Active Services Section -->
		{#if categorizedServices.active.length > 0}
			<div>
				<h2 class="text-3xl font-bold text-gray-900 mb-8">Active Services</h2>
				<p class="text-gray-600 mb-8">Services with qualified lead experts (approved and passed training)</p>
				
				{#each categorizedServices.active as parentService}
					<div class="mb-12">
						<h3 class="text-2xl font-semibold text-gray-800 mb-6">{parentService.parent?.name || 'Unknown Service'}</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each parentService.versions as version}
								<div class="bg-white border border-green-200 rounded-lg shadow-sm">
									<div class="p-4 border-b border-green-200 bg-green-50">
										<h4 class="text-lg font-medium text-gray-900">{version.name}</h4>
										<p class="text-sm text-green-600 mt-1">
											✓ {version.qualifiedLeadExperts.length} qualified lead expert{version.qualifiedLeadExperts.length !== 1 ? 's' : ''}
											{#if version.approvedRegularExperts.length > 0}
												, {version.approvedRegularExperts.length} regular expert{version.approvedRegularExperts.length !== 1 ? 's' : ''}
											{/if}
										</p>
									</div>
									
									<div class="p-4">
										<!-- Qualified Lead Experts -->
										{#if version.qualifiedLeadExperts.length > 0}
											<div class="mb-4">
												<h5 class="text-sm font-semibold text-purple-800 mb-3 flex items-center">
													<span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
													Qualified Lead Experts ({version.qualifiedLeadExperts.length})
												</h5>
												<div class="space-y-2">
													{#each version.qualifiedLeadExperts as assignment}
														<div class="flex items-center justify-between p-2 bg-purple-50 rounded-md">
															<div class="flex items-center space-x-3">
																<div class="flex-shrink-0 h-8 w-8">
																	<div class="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
																		<span class="text-white font-medium text-xs">
																			{assignment.user?.firstName?.[0]}{assignment.user?.lastName?.[0]}
																		</span>
																	</div>
																</div>
																<div>
																	<div class="text-sm font-medium text-gray-900">
																		{assignment.user?.firstName} {assignment.user?.lastName}
																	</div>
																	<div class="text-xs text-gray-500">Lead Expert</div>
																</div>
															</div>
															<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getServiceStatusColor(assignment.status)}">
																{getServiceStatusDisplayName(assignment.status)}
															</span>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Regular Experts -->
										{#if version.approvedRegularExperts.length > 0}
											<div class="mb-4">
												<h5 class="text-sm font-semibold text-blue-800 mb-3 flex items-center">
													<span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
													Regular Experts ({version.approvedRegularExperts.length})
												</h5>
												<div class="space-y-2">
													{#each version.approvedRegularExperts as assignment}
														<div class="flex items-center justify-between p-2 bg-blue-50 rounded-md">
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
																	<div class="text-xs text-gray-500">Regular Expert</div>
																</div>
															</div>
															<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getServiceStatusColor(assignment.status)}">
																{getServiceStatusDisplayName(assignment.status)}
															</span>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Pending/Rejected Experts (if any) -->
										{#if version.pendingExperts.length > 0 || version.rejectedExperts.length > 0}
											<div class="pt-3 border-t border-gray-200">
												<h5 class="text-sm font-semibold text-gray-600 mb-2">Other Assignments</h5>
												<div class="space-y-1">
													{#each [...version.pendingExperts, ...version.rejectedExperts] as assignment}
														<div class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
															<div class="flex items-center space-x-2">
																<div class="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center">
																	<span class="text-white font-medium text-xs">
																		{assignment.user?.firstName?.[0]}{assignment.user?.lastName?.[0]}
																	</span>
																</div>
																<span class="text-gray-700">
																	{assignment.user?.firstName} {assignment.user?.lastName}
																	({assignment.role === 'lead' ? 'Lead' : 'Regular'})
																</span>
															</div>
															<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getServiceStatusColor(assignment.status)}">
																{getServiceStatusDisplayName(assignment.status)}
															</span>
														</div>
													{/each}
												</div>
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

		<!-- Not Active Services Section -->
		{#if categorizedServices.inactive.length > 0}
			<div>
				<h2 class="text-3xl font-bold text-gray-900 mb-8">Not Active Services</h2>
				<p class="text-gray-600 mb-8">Services without qualified lead experts (no approved lead experts or lead experts haven't passed training)</p>
				
				{#each categorizedServices.inactive as parentService}
					<div class="mb-12">
						<h3 class="text-2xl font-semibold text-gray-800 mb-6">{parentService.parent?.name || 'Unknown Service'}</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each parentService.versions as version}
								<div class="bg-white border border-gray-200 rounded-lg shadow-sm opacity-75">
									<div class="p-4 border-b border-gray-200 bg-gray-50">
										<h4 class="text-lg font-medium text-gray-900">{version.name}</h4>
										<p class="text-sm text-red-600 mt-1">
											⚠ No qualified lead expert
										</p>
									</div>
									
									<div class="p-4">
										{#if version.assignments.length > 0}
											<div class="space-y-2">
												{#each version.assignments as assignment}
													<div class="flex items-center justify-between p-2 bg-gray-50 rounded-md">
														<div class="flex items-center space-x-3">
															<div class="flex-shrink-0 h-8 w-8">
																<div class="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
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
														<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getServiceStatusColor(assignment.status)}">
															{getServiceStatusDisplayName(assignment.status)}
														</span>
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
	</div>
{/if}
