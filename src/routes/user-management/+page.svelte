<script lang="ts">
	import UserCard from '$lib/components/UserCard.svelte';
	import ServiceBox from '$lib/components/ServiceBox.svelte';
	import ExpertSection from '$lib/components/experts/ExpertSection.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import { organizationStore } from '$lib/stores/organization.svelte';

	// Organization context
	let currentOrgId = $state<string | null>(null);
	let orgContext = $derived($organizationStore);

	// Toggle state for switching between sections
	let activeSection = $state<'staff' | 'experts' | 'services'>('staff');

	// Update currentOrgId when organization changes
	$effect(() => {
		currentOrgId = orgContext.currentOrganization?._id || null;
	});

	// Get data from Convex
	const users = useQuery(api.expertAssignments.getUsers, () => ({}));
	const organizations = useQuery(api.expertAssignments.getOrganizations, () => ({}));

	// Get expert assignments for services section
	const expertAssignments = useQuery(
		api.expertAssignments.getExpertAssignmentsByOrganizationWithDetails,
		() => ({ organizationId: (currentOrgId || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any })
	);

	// Get organization approvals (same as approved-services page)
	const organizationApprovals = useQuery(
		(api as any).serviceVersions.getOrganizationApprovals,
		() => (currentOrgId ? { organizationId: currentOrgId } : { organizationId: '' })
	);

	// Get service versions and parents for display
	const serviceVersions = useQuery((api as any).serviceVersions.getServiceVersions, {});
	const serviceParents = useQuery((api as any).serviceVersions.getServiceParents, {});

	// Staff data
	const staffMembers = [
		{
			name: 'Ilaria Pellizzaro',
			role: 'Platform Administrator',
			initials: 'IP',
			status: 'active' as const,
			badge: 'Active',
			badgeColor: 'green' as const
		},
		{
			name: 'John Doe',
			role: 'System Manager',
			initials: 'JD',
			status: 'active' as const,
			badge: 'Active',
			badgeColor: 'green' as const
		},
		{
			name: 'Sarah Miller',
			role: 'Support Specialist',
			initials: 'SM',
			status: 'active' as const,
			badge: 'Active',
			badgeColor: 'green' as const
		}
	];

	// Create approved services for display (same logic as approved-services page)
	let approvedServicesForDisplay = $derived.by(() => {
		if (!organizationApprovals?.data || !serviceVersions?.data || !serviceParents?.data) return [];

		// Get approved service version IDs (get most recent approval for each service)
		const serviceVersionApprovals = new Map();

		// Group approvals by service version ID
		organizationApprovals.data.forEach((approval: any) => {
			const existing = serviceVersionApprovals.get(approval.serviceVersionId);
			if (!existing || approval.updatedAt > existing.updatedAt) {
				serviceVersionApprovals.set(approval.serviceVersionId, approval);
			}
		});

		// Get approved service version IDs (only most recent approvals with approved status)
		const approvedVersionIds = Array.from(serviceVersionApprovals.values())
			.filter((approval: any) => approval.status === 'approved')
			.map((approval: any) => approval.serviceVersionId);

		// Get approved service versions with their parent info
		const approvedVersions = serviceVersions.data.filter((version: any) =>
			approvedVersionIds.includes(version._id)
		);

		// Group by service parent
		const groupedByParent = serviceParents.data
			.map((parent: any) => {
				const parentVersions = approvedVersions.filter(
					(version: any) => version.parentId === parent._id
				);
				return {
					...parent,
					versions: parentVersions.map((version: any) => ({
						...version,
						// Add experts for this service version (from expert assignments)
						experts:
							expertAssignments.data
								?.filter((assignment: any) => assignment.serviceVersionId === version._id)
								.map((assignment: any) => ({
									name: `${assignment.user?.firstName || ''} ${assignment.user?.lastName || ''}`.trim(),
									role: assignment.role === 'lead' ? 'Lead Expert' : 'Expert',
									initials: `${assignment.user?.firstName?.[0] || ''}${assignment.user?.lastName?.[0] || ''}`,
									isLead: assignment.role === 'lead',
									status: assignment.status
								})) || []
					}))
				};
			})
			.filter((parent: any) => parent.versions.length > 0);

		return groupedByParent;
	});

	function handleAddStaff() {
		console.log('Add new staff member');
	}

	function handleAddExpert() {
		// Navigate to add expert page
		window.location.href = '/user-management/add-expert';
	}

	function handleContinueToPayment() {
		// Navigate to checkout page
		window.location.href = '/checkout';
	}

	function handleChatExpert(expertId: string) {
		console.log('Chat with expert:', expertId);
		// TODO: Implement chat functionality
	}

	function handleSendReminder(expertId: string) {
		console.log('Send verification reminder to expert:', expertId);
		// TODO: Implement reminder functionality
	}

	function handleViewDetails(expertId: string) {
		console.log('View details for expert:', expertId);
		// TODO: Implement view details functionality
	}

	function handleEditExpert(expertId: string) {
		window.location.href = `/user-management/experts/${expertId}/edit`;
	}

	function handleCompleteProfile(expertId: string) {
		window.location.href = `/user-management/experts/${expertId}/edit`;
	}
</script>

<!-- User Management Page -->
<div class="bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-6">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-4">User Management</h1>
			<p class="text-gray-600">
				Manage your staff and Solution Provider experts across different services.
			</p>
		</div>

		<!-- Section Toggle -->
		<div class="mb-8">
			<div class="bg-white border border-gray-200 rounded-lg p-1 inline-flex">
				<button
					type="button"
					onclick={() => (activeSection = 'staff')}
					class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 {activeSection ===
					'staff'
						? 'bg-blue-500 text-white shadow-sm'
						: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
				>
					Staff Members
				</button>
				<button
					type="button"
					onclick={() => (activeSection = 'experts')}
					class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 {activeSection ===
					'experts'
						? 'bg-blue-500 text-white shadow-sm'
						: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
				>
					Experts
				</button>
				<button
					type="button"
					onclick={() => (activeSection = 'services')}
					class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 {activeSection ===
					'services'
						? 'bg-blue-500 text-white shadow-sm'
						: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
				>
					Services
				</button>
			</div>
		</div>

		<!-- Staff Users Section -->
		{#if activeSection === 'staff'}
			<div class="mb-8">
				<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-xl font-bold text-gray-800">Staff members</h2>
						<button
							onclick={handleAddStaff}
							class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
						>
							Add Staff Member
						</button>
					</div>

					<!-- Staff Users Grid -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each staffMembers as staff (staff.name)}
							<UserCard user={staff} size="lg" />
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Saved Experts Section -->
		{#if activeSection === 'experts'}
			<ExpertSection
				organizationId={currentOrgId}
				onAddExpert={handleAddExpert}
				onContinueToPayment={handleContinueToPayment}
				onChatExpert={handleChatExpert}
				onSendReminder={handleSendReminder}
				onViewDetails={handleViewDetails}
				onEditExpert={handleEditExpert}
				onCompleteProfile={handleCompleteProfile}
			/>
		{/if}

		<!-- Service Expert Lists -->
		{#if activeSection === 'services'}
			<div class="space-y-6">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-bold text-gray-800">Your Services</h2>
					<div class="flex items-center space-x-3">
						<button
							onclick={handleAddExpert}
							class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
						>
							Add Expert
						</button>
					</div>
				</div>

				{#if !currentOrgId}
					<div class="text-center py-8 text-gray-500">
						<svg
							class="w-12 h-12 mx-auto mb-4 text-gray-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
						<p class="text-lg font-medium mb-2">No Organization Selected</p>
						<p class="text-sm">Select an organization to view approved services</p>
					</div>
				{:else if organizationApprovals?.isLoading || serviceVersions?.isLoading || serviceParents?.isLoading}
					<div class="text-center py-8 text-gray-500">
						<div
							class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"
						></div>
						<p>Loading approved services...</p>
					</div>
				{:else if organizationApprovals?.error || serviceVersions?.error || serviceParents?.error}
					<div class="text-center py-8 text-red-500">
						<p class="text-lg font-medium mb-2">Error loading services</p>
						<p class="text-sm">
							{organizationApprovals?.error || serviceVersions?.error || serviceParents?.error}
						</p>
					</div>
				{:else if !organizationApprovals?.data || !serviceVersions?.data || !serviceParents?.data}
					<div class="text-center py-8 text-gray-500">
						<div
							class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"
						></div>
						<p>Loading approved services...</p>
					</div>
				{:else if approvedServicesForDisplay.length === 0}
					<div class="text-center py-8 text-gray-500">
						<svg
							class="w-12 h-12 mx-auto mb-4 text-gray-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<p class="text-lg font-medium mb-2">No Approved Services</p>
						<p class="text-sm">
							This organization has no approved services yet. Go to <a
								href="/approved-services"
								class="text-blue-600 hover:underline">Approved Services</a
							> to manage service approvals.
						</p>
					</div>
				{:else}
					{#each approvedServicesForDisplay as serviceParent (serviceParent._id)}
						<div class="bg-white border border-gray-200 rounded-lg shadow-sm">
							<!-- Service Parent Header -->
							<div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
								<div class="flex items-center justify-between">
									<div>
										<h3 class="text-lg font-semibold text-gray-900">{serviceParent.name}</h3>
										<p class="text-sm text-gray-600 mt-1">{serviceParent.description}</p>
									</div>
									<div class="flex items-center space-x-2">
										<span
											class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
										>
											{serviceParent.versions.length} approved version{serviceParent.versions
												.length !== 1
												? 's'
												: ''}
										</span>
									</div>
								</div>
							</div>

							<!-- Service Versions -->
							<div class="divide-y divide-gray-200">
								{#each serviceParent.versions as version (version._id)}
									<div class="px-6 py-4">
										<div class="flex items-center justify-between mb-4">
											<div class="flex-1 min-w-0">
												<div class="flex items-center space-x-3">
													<h4 class="text-sm font-medium text-gray-900 truncate">
														{version.name}
													</h4>
													<span
														class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
													>
														{version.version}
													</span>
												</div>
												<p class="text-sm text-gray-600 mt-1">{version.description}</p>
											</div>
										</div>

										<!-- Experts for this service version -->
										<div>
											<div class="flex items-center justify-between mb-3">
												<span class="text-sm font-medium text-gray-700"
													>Experts ({version.experts.length})</span
												>
											</div>

											{#if version.experts.length === 0}
												<div class="text-center py-4 text-gray-500">
													<svg
														class="w-8 h-8 mx-auto mb-2 text-gray-300"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
														/>
													</svg>
													<p class="text-sm">No experts assigned to this service version</p>
												</div>
											{:else}
												<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
													{#each version.experts as expert (expert.name + version._id)}
														<div
															class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg {expert.isLead
																? 'bg-yellow-50 border border-yellow-200'
																: ''}"
														>
															<div
																class="w-8 h-8 {expert.isLead
																	? 'bg-yellow-500'
																	: 'bg-blue-500'} text-white rounded-full flex items-center justify-center font-semibold text-xs"
															>
																{expert.isLead ? 'L' : expert.initials}
															</div>
															<div class="flex-1 min-w-0">
																<p class="text-sm font-medium text-gray-900 truncate">
																	{expert.name}
																</p>
																<p class="text-xs text-gray-500">{expert.role}</p>
															</div>
															<div class="flex flex-col items-end space-y-1">
																{#if expert.isLead}
																	<span
																		class="text-xs px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 font-semibold"
																	>
																		LEAD
																	</span>
																{/if}
																<span
																	class="text-xs px-2 py-1 rounded-full {expert.status ===
																	'approved'
																		? 'bg-green-100 text-green-800'
																		: expert.status === 'draft'
																			? 'bg-gray-100 text-gray-800'
																			: expert.status === 'paid'
																				? 'bg-blue-100 text-blue-800'
																				: expert.status === 'ready_for_training'
																					? 'bg-yellow-100 text-yellow-800'
																					: expert.status === 'training_started'
																						? 'bg-orange-100 text-orange-800'
																						: expert.status === 'training_completed'
																							? 'bg-purple-100 text-purple-800'
																							: expert.status === 'rejected'
																								? 'bg-red-100 text-red-800'
																								: expert.status === 'inactive'
																									? 'bg-gray-100 text-gray-800'
																									: 'bg-gray-100 text-gray-800'}"
																>
																	{expert.status.replace('_', ' ')}
																</span>
															</div>
														</div>
													{/each}
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>
