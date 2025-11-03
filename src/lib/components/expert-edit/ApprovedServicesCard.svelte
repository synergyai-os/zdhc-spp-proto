<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { goto } from '$app/navigation';
	import { getExpertRoleDisplayName, getExpertRoleColor } from '../../../convex/model/status';

	interface Props {
		userId: Id<'users'>;
		organizationId: Id<'organizations'>;
		expertCV: any;
		allUserAssignments: any;
	}

	let { userId, organizationId, expertCV, allUserAssignments }: Props = $props();

	const client = useConvexClient();

	// Get all service assignments for the organization to check for existing leads
	const orgAssignments = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => ({
		organizationId
	}));

	// Get approved service assignments (with full data)
	const approvedAssignments = $derived.by(() => {
		if (!allUserAssignments?.data) return [];
		return allUserAssignments.data.filter(
			(a: any) => a.status === 'approved' && a.expertCV?.status === 'locked_final'
		);
	});

	// Deduplicate by service (keep latest CV version for each service)
	const uniqueApprovedServices = $derived.by(() => {
		const serviceMap = new Map<string, any>();
		
		approvedAssignments.forEach((assignment: any) => {
			const serviceId = assignment.serviceVersionId;
			const existing = serviceMap.get(serviceId);
			
			// Keep the assignment from the latest CV version
			if (!existing || (assignment.expertCV?.version || 0) > (existing.expertCV?.version || 0)) {
				serviceMap.set(serviceId, assignment);
			}
		});
		
		return Array.from(serviceMap.values());
	});

	// Check if there's already a lead expert for a service in the organization
	function hasLeadExpert(serviceId: string): boolean {
		if (!orgAssignments?.data) return false;
		
		const activeLeadAssignments = orgAssignments.data.filter(
			(assignment: any) => 
				assignment.serviceVersionId === serviceId &&
				assignment.status !== 'inactive' &&
				assignment.status !== 'rejected' &&
				assignment.role === 'lead'
		);
		
		return activeLeadAssignments.length > 0;
	}

	// State for dropdown menus
	let openDropdowns = $state<Set<string>>(new Set());

	function toggleDropdown(serviceId: string) {
		const newSet = new Set(openDropdowns);
		if (newSet.has(serviceId)) {
			newSet.delete(serviceId);
		} else {
			newSet.clear(); // Close others
			newSet.add(serviceId);
		}
		openDropdowns = newSet;
	}

	// Close dropdowns when clicking outside
	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (!target.closest('.dropdown-container')) {
				openDropdowns = new Set();
			}
		}
		
		if (openDropdowns.size > 0) {
			window.addEventListener('click', handleClickOutside);
			return () => window.removeEventListener('click', handleClickOutside);
		}
	});

	// Handle upgrade to lead
	async function handleUpgradeToLead(assignment: any) {
		if (!assignment._id || !expertCV?.data) return;
		
		try {
			await client.mutation(api.expert.updateServiceRole, {
				assignmentId: assignment._id as Id<'expertServiceAssignments'>,
				newRole: 'lead'
			});
			console.log('✅ Upgraded to lead expert');
			openDropdowns = new Set();
		} catch (error: any) {
			console.error('❌ Failed to upgrade to lead:', error);
			alert('Failed to upgrade to lead expert: ' + error.message);
		}
	}

	// Handle remove service
	async function handleRemoveService(assignment: any) {
		if (!assignment.serviceVersionId || !expertCV?.data) return;
		
		if (!confirm(`Are you sure you want to remove "${assignment.serviceVersion?.name || 'this service'}"?`)) {
			return;
		}
		
		try {
			await client.mutation(api.expert.removeService, {
				cvId: expertCV.data._id as Id<'expertCVs'>,
				userId,
				organizationId,
				serviceVersionId: assignment.serviceVersionId as Id<'serviceVersions'>
			});
			console.log('✅ Service removed');
			openDropdowns = new Set();
		} catch (error: any) {
			console.error('❌ Failed to remove service:', error);
			alert('Failed to remove service: ' + error.message);
		}
	}

	function handleAddService() {
		// Navigate to CV edit page with services tab
		if (expertCV?.data?._id) {
			goto(`/experts/${userId}/cv?tab=services`);
		}
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-lg font-semibold text-gray-900">Approved Services</h2>
		<button
			onclick={handleAddService}
			class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
		>
			<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
			</svg>
			Add Service
		</button>
	</div>

	{#if allUserAssignments?.isLoading}
		<div class="text-center py-4">
			<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
		</div>
	{:else if uniqueApprovedServices.length === 0}
		<p class="text-sm text-gray-600">No approved services yet. Add services to your CV to get started.</p>
	{:else}
		<div class="flex flex-wrap gap-2">
			{#each uniqueApprovedServices as assignment}
				{@const serviceName = assignment.serviceVersion?.name || 'Unknown Service'}
				{@const isLead = assignment.role === 'lead'}
				{@const canUpgradeToLead = !isLead && !hasLeadExpert(assignment.serviceVersionId)}
				<div class="relative inline-flex items-center group dropdown-container">
					<div class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
						<span>{serviceName}</span>
						{#if isLead}
							<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium {getExpertRoleColor('lead')}">
								Lead
							</span>
						{/if}
					</div>
					
					<!-- Dropdown menu button -->
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							toggleDropdown(assignment.serviceVersionId);
						}}
						class="ml-1 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
						title="Manage service"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
						</svg>
					</button>

					<!-- Dropdown menu -->
					{#if openDropdowns.has(assignment.serviceVersionId)}
						<div class="absolute right-0 top-full mt-1 z-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
							{#if canUpgradeToLead}
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										handleUpgradeToLead(assignment);
									}}
									class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
									</svg>
									<span>Upgrade to Lead Expert</span>
								</button>
							{/if}
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									handleRemoveService(assignment);
								}}
								class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
								</svg>
								<span>Remove Service</span>
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

