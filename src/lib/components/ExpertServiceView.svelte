<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import type { Id } from '$lib';
	import { getContext } from 'svelte';

	const orgId = getContext('orgId');

	// Get approved services for the organization
	const approvedServices = useQuery(api.services.getApprovedServices, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Get all service assignments for the organization
	const serviceAssignments = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Active tab - 'all' or service version ID
	let activeTab = $state<string>('all');

	// Get tabs: 'All Experts' + one per approved service
	const tabs = $derived.by(() => {
		if (!approvedServices?.data) return [];

		const serviceTabs = approvedServices.data.map((service: any) => ({
			id: service._id,
			label: service.name,
			service: service
		}));

		return [
			{ id: 'all', label: 'All Experts', service: null },
			...serviceTabs
		];
	});

	// Calculate service status for an assignment
	function getServiceStatus(assignment: any): {
		type: 'qualified' | 'rejected' | 'pending' | 'training_needed' | 'training_failed' | 'payment_needed' | 'in_review' | 'active';
		icon: string;
		color: string;
		label: string;
	} {
		// Rejected services
		if (assignment.status === 'rejected' && assignment.expertCV?.status === 'locked_final') {
			return {
				type: 'rejected',
				icon: '❌',
				color: 'bg-red-100 text-red-800 border-red-300',
				label: 'Rejected'
			};
		}

		// Training failed
		if (assignment.trainingStatus === 'failed' && assignment.status === 'approved') {
			return {
				type: 'training_failed',
				icon: '❌',
				color: 'bg-red-100 text-red-800 border-red-300',
				label: 'Training Failed'
			};
		}

		// Qualified/Active - approved + CV locked + training passed/not_required
		const isCVLocked = assignment.expertCV?.status === 'locked_final';
		const isTrainingQualified = ['passed', 'not_required'].includes(assignment.trainingStatus || '');
		if (assignment.status === 'approved' && isCVLocked && isTrainingQualified) {
			return {
				type: 'active',
				icon: '✅',
				color: 'bg-green-100 text-green-800 border-green-300',
				label: 'Active'
			};
		}

		// Training needed - approved but needs training
		if (assignment.status === 'approved' && ['required', 'invited', 'in_progress'].includes(assignment.trainingStatus || '')) {
			return {
				type: 'training_needed',
				icon: '🎓',
				color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
				label: 'Training Needed'
			};
		}

		// Payment needed - approved but CV not paid
		if (assignment.status === 'approved' && !isCVLocked && assignment.expertCV?.status === 'completed') {
			return {
				type: 'payment_needed',
				icon: '💳',
				color: 'bg-amber-100 text-amber-800 border-amber-300',
				label: 'Payment Needed'
			};
		}

		// In review - CV locked for review
		if (assignment.status === 'approved' && ['locked_for_review', 'unlocked_for_edits'].includes(assignment.expertCV?.status || '')) {
			return {
				type: 'in_review',
				icon: '👀',
				color: 'bg-blue-100 text-blue-800 border-blue-300',
				label: 'In Review'
			};
		}

		// Pending review
		if (assignment.status === 'pending_review') {
			return {
				type: 'pending',
				icon: '⏳',
				color: 'bg-gray-100 text-gray-800 border-gray-300',
				label: 'Pending Review'
			};
		}

		// Default
		return {
			type: 'pending',
			icon: '⏳',
			color: 'bg-gray-100 text-gray-800 border-gray-300',
			label: 'Pending'
		};
	}

	// Filter experts based on active tab
	const filteredExperts = $derived.by(() => {
		if (!serviceAssignments?.data) return [];

		// Get unique experts from assignments (group by userId)
		const expertMap = new Map<string, any>();

		for (const assignment of serviceAssignments.data) {
			// Skip rejected experts (status === 'rejected' && expertCV.status === 'locked_final')
			if (assignment.status === 'rejected' && assignment.expertCV?.status === 'locked_final') {
				continue;
			}

			// Filter by service if not 'all'
			if (activeTab !== 'all' && assignment.serviceVersionId !== activeTab) {
				continue;
			}

			const userId = assignment.userId;

			if (!expertMap.has(userId)) {
				expertMap.set(userId, {
					user: assignment.user,
					services: [],
					assignment: null // Store assignment for service-specific tabs
				});
			}

			const expert = expertMap.get(userId);
			if (assignment.serviceVersion) {
				expert.services.push(assignment.serviceVersion);
			}

			// For service-specific tabs, store the assignment for status display
			if (activeTab !== 'all' && assignment.serviceVersionId === activeTab) {
				expert.assignment = assignment;
			}
		}

		return Array.from(expertMap.values()).sort((a, b) => {
			const nameA = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim();
			const nameB = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim();
			return nameA.localeCompare(nameB);
		});
	});

	function setTab(tabId: string) {
		activeTab = tabId;
	}

	// Split experts into active and inactive for "All Experts" view
	const activeExperts = $derived(
		activeTab === 'all' ? filteredExperts.filter((expert: any) => expert.user?.isActive) : []
	);
	const inactiveExperts = $derived(
		activeTab === 'all' ? filteredExperts.filter((expert: any) => !expert.user?.isActive) : []
	);
</script>

{#if approvedServices?.isLoading || serviceAssignments?.isLoading}
	<div class="flex justify-center items-center py-12">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
	</div>
{:else if approvedServices?.error || serviceAssignments?.error}
	<div class="bg-red-50 border border-red-200 rounded-md p-4">
		<p class="text-red-800">
			Error loading data: {approvedServices?.error?.message || serviceAssignments?.error?.message}
		</p>
	</div>
{:else}
	<!-- Tab Navigation -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="-mb-px flex space-x-8 overflow-x-auto">
			{#each tabs as tab}
				<button
					type="button"
					onclick={() => setTab(tab.id)}
					class="py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap {activeTab === tab.id
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					{tab.label}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Tab Content -->
	<div>
		{#if activeTab === 'all'}
			<!-- All Experts View - Segmented by Active/Inactive -->
			<div class="space-y-8">


				<!-- Inactive Experts Section -->
				<div>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900">
							Inactive Experts
							<span class="ml-2 text-sm font-normal text-gray-500">({inactiveExperts.length})</span>
						</h2>
					</div>
					{#if inactiveExperts.length > 0}
						<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Name
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Email
										</th>
										<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each inactiveExperts as expert}
										<tr class="hover:bg-gray-50">
											<td class="px-6 py-4">
												<div class="flex items-center">
													<div class="flex-shrink-0 h-10 w-10">
														<div
															class="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center"
														>
															<span class="text-white font-medium text-sm">
																{expert.user?.firstName?.[0]}{expert.user?.lastName?.[0]}
															</span>
														</div>
													</div>
													<div class="ml-4">
														<div class="text-sm font-medium text-gray-900">
															{expert.user?.firstName} {expert.user?.lastName}
														</div>
													</div>
												</div>
											</td>
											<td class="px-6 py-4 text-sm text-gray-500">{expert.user?.email}</td>
											<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<a
													href="/experts/{expert.user?._id}"
													class="text-blue-600 hover:text-blue-900"
												>
													View Profile
												</a>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
							<p class="text-gray-500">No inactive experts found</p>
						</div>
					{/if}
				</div>

				<!-- Active Experts Section -->
				<div>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900">
							Active Experts
							<span class="ml-2 text-sm font-normal text-gray-500">({activeExperts.length})</span>
						</h2>
					</div>
					{#if activeExperts.length > 0}
						<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Name
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Email
										</th>
										<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each activeExperts as expert}
										<tr class="hover:bg-gray-50">
											<td class="px-6 py-4">
												<div class="flex items-center">
													<div class="flex-shrink-0 h-10 w-10">
														<div
															class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center"
														>
															<span class="text-white font-medium text-sm">
																{expert.user?.firstName?.[0]}{expert.user?.lastName?.[0]}
															</span>
														</div>
													</div>
													<div class="ml-4">
														<div class="text-sm font-medium text-gray-900">
															{expert.user?.firstName} {expert.user?.lastName}
														</div>
													</div>
												</div>
											</td>
											<td class="px-6 py-4 text-sm text-gray-500">{expert.user?.email}</td>
											<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<a
													href="/experts/{expert.user?._id}"
													class="text-blue-600 hover:text-blue-900"
												>
													View Profile
												</a>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
							<p class="text-gray-500">No active experts found</p>
						</div>
					{/if}
				</div>

			</div>
		{:else if filteredExperts.length === 0}
			<!-- Service-specific view with no experts -->
			<div class="text-center py-12">
				<p class="text-gray-500 text-lg">No experts found for this service.</p>
			</div>
		{:else}
			<!-- Service-specific view with experts -->
			<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Name
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Email
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredExperts as expert}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4">
									<div class="flex items-center">
										<div class="flex-shrink-0 h-10 w-10">
											<div
												class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center"
											>
												<span class="text-white font-medium text-sm">
													{expert.user?.firstName?.[0]}{expert.user?.lastName?.[0]}
												</span>
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">
												{expert.user?.firstName} {expert.user?.lastName}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">{expert.user?.email}</td>
								<td class="px-6 py-4">
									{#if expert.assignment}
										{@const status = getServiceStatus(expert.assignment)}
										<span
											class="inline-flex items-center px-2 py-1 rounded border text-xs font-medium {status.color}"
										>
											<span class="mr-1">{status.icon}</span>
											{status.label}
										</span>
									{:else}
										<span class="text-sm text-gray-400">No assignment</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<a
										href="/experts/{expert.user?._id}"
										class="text-blue-600 hover:text-blue-900"
									>
										View Profile
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}

