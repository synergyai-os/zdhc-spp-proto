<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import type { Id } from '$lib';
	import { getContext } from 'svelte';
	import { getServiceStatusColor, getServiceStatusDisplayName, isQualified } from '../../convex/model/status';
	import ExpertSection from './ExpertSection.svelte';
	import ServiceSection from './ServiceSection.svelte';

	const orgId = getContext('orgId');

	// Get approved services for the organization
	const approvedServices = useQuery(api.services.getApprovedServices, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Get all service assignments for the organization
	const serviceAssignments = useQuery(api.services.getServiceAssignmentsByOrg, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Helper function to categorize experts by journey status
	const categorizeExpertsByJourney = (assignments: any[]) => {
		const underReview = assignments.filter(a => a.status === 'pending_review');
		const rejected = assignments.filter(a => a.status === 'rejected');
		const approved = assignments.filter(a => a.status === 'approved');
		
		// Categorize approved experts by training status
		const approvedTrainingRequired = approved.filter(a => 
			['required', 'invited', 'in_progress'].includes(a.trainingStatus || '')
		);
		const approvedTrainingFailed = approved.filter(a => a.trainingStatus === 'failed');
		const approvedAlreadyQualified = approved.filter(a => a.trainingStatus === 'not_required');
		const approvedTrainingPassed = approved.filter(a => a.trainingStatus === 'passed');
		
		return {
			underReview,
			rejected,
			approvedTrainingRequired,
			approvedTrainingFailed,
			approvedAlreadyQualified,
			approvedTrainingPassed
		};
	};

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
			
			// Only show truly qualified regular experts (training passed or not required)
			const qualifiedRegularExperts = approvedRegularExperts.filter(a => 
				a.trainingStatus && isQualified(a.trainingStatus)
			);
			
			const isActive = qualifiedLeadExperts.length > 0;

			// Categorize experts by journey for inactive services
			const journeyCategories = categorizeExpertsByJourney(assignments);

			parentGroups.get(parentId).versions.push({
				...service,
				assignments,
				leadExperts,
				regularExperts,
				approvedLeadExperts,
				approvedRegularExperts,
				qualifiedLeadExperts,
				qualifiedRegularExperts,
				pendingExperts,
				rejectedExperts,
				journeyCategories,
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
					<ServiceSection 
						{parentService}
						title="Active Service"
						description="✓ {parentService.versions[0]?.qualifiedLeadExperts?.length || 0} qualified lead expert{(parentService.versions[0]?.qualifiedLeadExperts?.length || 0) !== 1 ? 's' : ''}"
						icon="✓"
						color="text-green-600"
						borderColor="border-green-200"
						bgColor="bg-green-50"
					/>
				{/each}
			</div>
		{/if}

		<!-- Not Active Services Section -->
		{#if categorizedServices.inactive.length > 0}
			<div>
				<h2 class="text-3xl font-bold text-gray-900 mb-8">Not Active Services</h2>
				<p class="text-gray-600 mb-8">Services without qualified lead experts (no approved lead experts or lead experts haven't passed training)</p>
				
				{#each categorizedServices.inactive as parentService}
					<ServiceSection 
						{parentService}
						title="Not Active Service"
						description="⚠ No qualified lead expert"
						icon="⚠"
						color="text-red-600"
						borderColor="border-gray-200"
						bgColor="bg-gray-50"
						opacity="opacity-75"
					/>
				{/each}
			</div>
		{/if}

	</div>
{/if}
