<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$lib';
	import type { Id } from '$lib';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';

	const orgId = getContext('orgId');
	const client = useConvexClient();

	// Get expert CVs for the current organization
	const expertCVs = useQuery(api.expert.getCVs, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Get all service assignments for the organization
	const serviceAssignments = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Get available services for filtering
	const availableServices = useQuery(api.services.getApprovedServices, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Filter state
	let selectedServiceFilter = $state<string>('all');
	let showInactive = $state(true);

	// Track expanded rows (expert userId -> expanded state)
	let expandedRows = $state<Set<string>>(new Set());

	// Calculate per-service status
	function getServiceStatus(assignment: any): {
		type: 'qualified' | 'rejected' | 'pending' | 'training_needed' | 'training_failed' | 'payment_needed' | 'in_review';
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

		// Qualified - approved + CV locked + training passed/not_required
		const isCVLocked = assignment.expertCV?.status === 'locked_final';
		const isTrainingQualified = ['passed', 'not_required'].includes(assignment.trainingStatus || '');
		if (assignment.status === 'approved' && isCVLocked && isTrainingQualified) {
			return {
				type: 'qualified',
				icon: '✅',
				color: 'bg-green-100 text-green-800 border-green-300',
				label: 'Qualified'
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
				label: 'Pending'
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

	// Process experts with enriched data
	const processedExperts = $derived.by(() => {
		if (!expertCVs?.data || !serviceAssignments?.data) return [];

		// Group CVs by user and get the latest CV for each user
		const userMap = new Map<string, any>();

		expertCVs.data.forEach((cv: any) => {
			if (!userMap.has(cv.userId) || cv.version > userMap.get(cv.userId).version) {
				userMap.set(cv.userId, cv);
			}
		});

		// Enrich each expert with service assignments and calculate status
		return Array.from(userMap.values()).map((expert: any) => {
			const userId = expert.userId;
			const latestCV = expert;

			// Get all assignments for this expert
			const expertAssignments = serviceAssignments.data.filter(
				(a: any) => a.userId === userId
			);

			// Get services assigned to this expert with detailed status
			const services = expertAssignments
				.filter((a: any) => a.status !== 'inactive')
				.map((a: any) => {
					const serviceStatus = getServiceStatus(a);
					return {
						name: a.serviceVersion?.name || 'Unknown',
						assignmentStatus: a.status, // pending_review, approved, rejected
						trainingStatus: a.trainingStatus,
						role: a.role,
						cvStatus: a.expertCV?.status,
						serviceStatus // qualified, rejected, pending, training_needed, etc.
					};
				});

			// Calculate actionable status
			const status = calculateActionableStatus(latestCV, expertAssignments);

			return {
				...expert,
				services,
				status,
				assignments: expertAssignments
			};
		});
	});

	// Filter experts
	const filteredExperts = $derived.by(() => {
		let filtered = processedExperts;

		// Filter by active/inactive
		if (!showInactive) {
			filtered = filtered.filter((expert: any) => expert.user?.isActive);
		}

		// Filter by service
		if (selectedServiceFilter !== 'all' && availableServices?.data) {
			const serviceId = selectedServiceFilter;
			filtered = filtered.filter((expert: any) => {
				return expert.assignments.some(
					(a: any) => a.serviceVersionId === serviceId && a.status !== 'inactive'
				);
			});
		}

		return filtered;
	});

	// Separate active and inactive
	const activeExperts = $derived(
		filteredExperts.filter((expert: any) => expert.user?.isActive)
	);
	const inactiveExperts = $derived(
		filteredExperts.filter((expert: any) => !expert.user?.isActive)
	);

	// Calculate actionable status for an expert
	function calculateActionableStatus(cv: any, assignments: any[]): {
		type: 'ready' | 'payment_pending' | 'training_failed' | 'in_review' | 'draft' | 'no_status';
		message: string;
		priority: number;
	} {
		// Check for training failures
		const failedTraining = assignments.find(
			(a: any) => a.trainingStatus === 'failed' && a.status === 'approved'
		);
		if (failedTraining) {
			return {
				type: 'training_failed',
				message: 'Training Failed',
				priority: 1
			};
		}

		// Check for payment pending
		if (cv.status === 'completed' || cv.status === 'payment_pending') {
			return {
				type: 'payment_pending',
				message: 'Payment Pending',
				priority: 2
			};
		}

		// Check if in review
		if (cv.status === 'locked_for_review' || cv.status === 'unlocked_for_edits') {
			return {
				type: 'in_review',
				message: 'In Review',
				priority: 3
			};
		}

		// Check if draft
		if (cv.status === 'draft') {
			return {
				type: 'draft',
				message: 'Draft',
				priority: 4
			};
		}

		// Check if qualified and ready
		const hasQualifiedServices = assignments.some(
			(a: any) =>
				a.status === 'approved' &&
				a.expertCV?.status === 'locked_final' &&
				['passed', 'not_required'].includes(a.trainingStatus || '')
		);

		if (hasQualifiedServices && cv.status === 'locked_final') {
			return {
				type: 'ready',
				message: 'Ready',
				priority: 5
			};
		}

		return {
			type: 'no_status',
			message: cv.status || 'Unknown',
			priority: 6
		};
	}

	function getStatusBadgeClass(status: any) {
		const classes: Record<string, string> = {
			ready: 'bg-green-100 text-green-800',
			payment_pending: 'bg-amber-100 text-amber-800',
			training_failed: 'bg-red-100 text-red-800',
			in_review: 'bg-blue-100 text-blue-800',
			draft: 'bg-gray-100 text-gray-800',
			no_status: 'bg-gray-100 text-gray-800'
		};
		return classes[status.type] || classes.no_status;
	}

	function handleAddService(expert: any) {
		// Navigate to CV page where they can add services
		goto(`/experts/${expert.userId}/cv?tab=services`);
	}

	function toggleRow(expertId: string) {
		if (expandedRows.has(expertId)) {
			expandedRows.delete(expertId);
		} else {
			expandedRows.add(expertId);
		}
		expandedRows = new Set(expandedRows);
	}

	// Calculate service summary for display
	function getServiceSummary(services: any[]) {
		if (services.length === 0) return { text: 'No services', counts: {} };

		const qualifiedCount = services.filter((s: any) => s.serviceStatus.type === 'qualified').length;
		const rejectedCount = services.filter((s: any) => s.serviceStatus.type === 'rejected').length;
		const trainingCount = services.filter((s: any) => ['training_needed', 'training_failed'].includes(s.serviceStatus.type)).length;
		const pendingCount = services.filter((s: any) => s.serviceStatus.type === 'pending').length;
		const inReviewCount = services.filter((s: any) => s.serviceStatus.type === 'in_review').length;
		const paymentCount = services.filter((s: any) => s.serviceStatus.type === 'payment_needed').length;

		const parts = [];
		if (qualifiedCount > 0) parts.push(`${qualifiedCount} ✅`);
		if (rejectedCount > 0) parts.push(`${rejectedCount} ❌`);
		if (trainingCount > 0) parts.push(`${trainingCount} 🎓`);
		if (paymentCount > 0) parts.push(`${paymentCount} 💳`);
		if (inReviewCount > 0) parts.push(`${inReviewCount} 👀`);
		if (pendingCount > 0) parts.push(`${pendingCount} ⏳`);

		const summaryText = parts.length > 0 ? parts.join(', ') : `${services.length} services`;

		return {
			text: `${services.length} service${services.length !== 1 ? 's' : ''}: ${summaryText}`,
			counts: { qualifiedCount, rejectedCount, trainingCount, pendingCount, inReviewCount, paymentCount }
		};
	}
</script>

{#if expertCVs?.isLoading || serviceAssignments?.isLoading}
	<div class="flex justify-center items-center py-12">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
		<span class="ml-3 text-gray-600">Loading experts...</span>
	</div>
{:else if expertCVs?.error || serviceAssignments?.error}
	<div class="bg-red-50 border border-red-200 rounded-md p-4">
		<p class="text-red-800">
			Error loading experts: {expertCVs?.error?.message || serviceAssignments?.error?.message}
		</p>
	</div>
{:else if filteredExperts.length === 0}
	<div class="text-center py-12">
		<p class="text-gray-500 text-lg">
			{selectedServiceFilter !== 'all'
				? 'No experts found for the selected service.'
				: 'No experts found for this organization.'}
		</p>
	</div>
{:else}
	<div class="bg-white shadow-sm rounded-lg overflow-hidden">
		<!-- Header with filters -->
		<div class="px-6 py-4 border-b border-gray-200">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-medium text-gray-900">
					Experts ({filteredExperts.length})
				</h2>
				<div class="flex items-center space-x-4">
					<!-- Service Filter -->
					<select
						bind:value={selectedServiceFilter}
						class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">All Services</option>
						{#if availableServices?.data}
							{#each availableServices.data as service}
								<option value={service._id}>{service.name}</option>
							{/each}
						{/if}
					</select>

					<!-- Show Inactive Toggle -->
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={showInactive}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<span class="ml-2 text-sm text-gray-700">Show Inactive</span>
					</label>
				</div>
			</div>
		</div>


		<!-- Inactive Experts Section (collapsed by default) -->
		{#if showInactive && inactiveExperts.length > 0}
			<div class="overflow-x-auto border-t border-gray-200">
				<div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
					<h3 class="text-sm font-semibold text-gray-700">
						Inactive Experts ({inactiveExperts.length})
					</h3>
				</div>
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Expert
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Services
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each inactiveExperts as expert}
							<tr class="hover:bg-gray-50 opacity-60">
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
											<div class="text-sm font-medium text-gray-500">
												{expert.user?.firstName} {expert.user?.lastName}
											</div>
											<div class="text-sm text-gray-400">{expert.user?.email}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4">
									{#if expert.services.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each expert.services.slice(0, 2) as service}
												<span
													class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600"
												>
													{service.name}
												</span>
											{/each}
											{#if expert.services.length > 2}
												<span class="text-xs text-gray-400">
													+{expert.services.length - 2} more
												</span>
											{/if}
										</div>
									{:else}
										<span class="text-sm text-gray-400">No services</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600"
									>
										Inactive
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<a
										href="/experts/{expert.userId}"
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

		<!-- Active Experts Section -->
		{#if activeExperts.length > 0}
			<div class="overflow-x-auto">
				<div class="px-6 py-3 bg-green-50 border-b border-green-200">
					<h3 class="text-sm font-semibold text-green-900">
						Active Experts ({activeExperts.length})
					</h3>
				</div>
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Expert
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Services
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each activeExperts as expert}
							{@const isExpanded = expandedRows.has(expert.userId)}
							{@const serviceSummary = getServiceSummary(expert.services)}
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
											<div class="text-sm text-gray-500">{expert.user?.email}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4">
									{#if expert.services.length > 0}
										<div class="flex items-center space-x-2">
											<button
												onclick={() => toggleRow(expert.userId)}
												class="text-gray-400 hover:text-gray-600 transition-transform {isExpanded ? 'rotate-90' : ''}"
												title={isExpanded ? 'Collapse services' : 'Expand services'}
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
												</svg>
											</button>
											<span class="text-sm text-gray-700">{serviceSummary.text}</span>
										</div>
									{:else}
										<span class="text-sm text-gray-400">No services assigned</span>
									{/if}
								</td>
								<td class="px-6 py-4">
									<!-- Show summary status - highest priority issue -->
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold {getStatusBadgeClass(
											expert.status
										)}"
									>
										{#if expert.status.type === 'ready'}
											✅
										{:else if expert.status.type === 'payment_pending'}
											⚠️
										{:else if expert.status.type === 'training_failed'}
											❌
										{:else if expert.status.type === 'in_review'}
											👀
										{/if}
										<span class="ml-1">{expert.status.message}</span>
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div class="flex items-center space-x-3">
										<button
											onclick={() => handleAddService(expert)}
											class="text-blue-600 hover:text-blue-900"
											title="Add Service"
										>
											+ Service
										</button>
										<a
											href="/experts/{expert.userId}"
											class="text-blue-600 hover:text-blue-900"
										>
											View Profile
										</a>
									</div>
								</td>
							</tr>
							<!-- Expanded Services Detail Row -->
							{#if isExpanded && expert.services.length > 0}
								<tr class="bg-gray-50">
									<td colspan="4" class="px-6 py-4">
										<div class="space-y-2">
											<div class="text-xs font-semibold text-gray-700 mb-2">Services:</div>
											<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
												{#each expert.services as service}
													<div class="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
														<span class="text-sm">{service.serviceStatus.icon}</span>
														<span class="text-sm font-medium text-gray-900 flex-1">{service.name}</span>
														{#if service.role === 'lead'}
															<span class="text-xs font-semibold text-blue-700">Lead</span>
														{/if}
														<span class="text-xs px-2 py-0.5 rounded {service.serviceStatus.color}">
															{service.serviceStatus.label}
														</span>
													</div>
												{/each}
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

	</div>
{/if}
