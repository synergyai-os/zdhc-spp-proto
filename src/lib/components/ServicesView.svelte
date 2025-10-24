<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import type { Id } from '$lib';
	import { getContext } from 'svelte';
	import { getServiceStatusColor, getServiceStatusDisplayName, isQualified, isPaymentExpired } from '../../convex/model/status';
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
		// First, separate by actual database status
		const pendingReview = assignments.filter(a => a.status === 'pending_review');
		const rejected = assignments.filter(a => a.status === 'rejected');
		const approved = assignments.filter(a => a.status === 'approved');
		
		// For approved assignments, check if CV is locked to determine true status
		const trulyApproved = approved.filter(a => {
			// Only consider truly approved if CV is locked_final
			return a.expertCV && a.expertCV.status === 'locked_final';
		});
		
		// Approved assignments whose CVs are not locked should be treated as "under review"
		const underReview = [
			...pendingReview,
			...approved.filter(a => !a.expertCV || a.expertCV.status !== 'locked_final')
		];
		
		// Categorize truly approved experts by training status
		// Only consider training status if it's been set (CV is locked)
		const approvedTrainingRequired = trulyApproved.filter(a => 
			a.trainingStatus && ['required', 'invited', 'in_progress'].includes(a.trainingStatus)
		);
		const approvedTrainingFailed = trulyApproved.filter(a => a.trainingStatus === 'failed');
		const approvedAlreadyQualified = trulyApproved.filter(a => a.trainingStatus === 'not_required');
		const approvedTrainingPassed = trulyApproved.filter(a => a.trainingStatus === 'passed');
		
		return {
			underReview,
			rejected,
			approvedTrainingRequired,
			approvedTrainingFailed,
			approvedAlreadyQualified,
			approvedTrainingPassed
		};
	};

	// Helper function to check if CV is paid and not expired
	const isCVPaidAndValid = (assignment: any) => {
		if (!assignment.expertCV) return false;
		const paidStatuses = ['paid', 'locked_for_review', 'unlocked_for_edits', 'locked_final'];
		const isPaid = paidStatuses.includes(assignment.expertCV.status);
		const isNotExpired = !isPaymentExpired(assignment.expertCV.paidAt);
		return isPaid && isNotExpired;
	};

	// Categorize services into Active/Pending Payment/Not Active
	const categorizedServices = $derived.by(() => {
		if (!approvedServices?.data) {
			return { active: [], pendingPayment: [], inactive: [] };
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
			
			// Only consider assignments as "approved" if their CV is locked_final
			const approvedLeadExperts = leadExperts.filter(a => 
				a.status === 'approved' && a.expertCV && a.expertCV.status === 'locked_final'
			);
			const approvedRegularExperts = regularExperts.filter(a => 
				a.status === 'approved' && a.expertCV && a.expertCV.status === 'locked_final'
			);
			
			// All other assignments (including approved but not locked) are considered pending
			const pendingExperts = assignments.filter(a => 
				a.status === 'pending_review' || 
				(a.status === 'approved' && (!a.expertCV || a.expertCV.status !== 'locked_final'))
			);
			const rejectedExperts = assignments.filter(a => a.status === 'rejected');

			// Service is active if it has at least one approved lead expert who is qualified AND paid
			// Only consider experts whose CV has been locked (trainingStatus is set)
			const qualifiedLeadExperts = approvedLeadExperts.filter(a => 
				a.trainingStatus && isQualified(a.trainingStatus) && isCVPaidAndValid(a)
			);
			
			// Service is pending payment if it has qualified leads but they're unpaid or expired
			const qualifiedLeadExpertsPendingPayment = approvedLeadExperts.filter(a => 
				a.trainingStatus && isQualified(a.trainingStatus) && !isCVPaidAndValid(a)
			);
			
			// Only show truly qualified regular experts (training passed or not required)
			const qualifiedRegularExperts = approvedRegularExperts.filter(a => 
				a.trainingStatus && isQualified(a.trainingStatus)
			);
			
			// Experts currently in training (truly approved but training required/invited/in_progress)
			const inTrainingExperts = [...approvedLeadExperts, ...approvedRegularExperts].filter(a => 
				a.trainingStatus && ['required', 'invited', 'in_progress'].includes(a.trainingStatus)
			);
			
			// Determine service status
			const isActive = qualifiedLeadExperts.length > 0;
			const isPendingPayment = qualifiedLeadExpertsPendingPayment.length > 0 && !isActive;
			const isInactive = !isActive && !isPendingPayment;

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
				qualifiedLeadExpertsPendingPayment,
				qualifiedRegularExperts,
				inTrainingExperts,
				pendingExperts,
				rejectedExperts,
				journeyCategories,
				isActive,
				isPendingPayment,
				isInactive
			});
		});

		// Separate into three categories
		const allParentServices = Array.from(parentGroups.values());
		
		const activeParentServices = allParentServices
			.filter(parentService => parentService.versions.some((v: any) => v.isActive))
			.map(parentService => ({
				...parentService,
				versions: parentService.versions.filter((v: any) => v.isActive)
			}));

		const pendingPaymentParentServices = allParentServices
			.filter(parentService => parentService.versions.some((v: any) => v.isPendingPayment))
			.map(parentService => ({
				...parentService,
				versions: parentService.versions.filter((v: any) => v.isPendingPayment)
			}));

		const inactiveParentServices = allParentServices
			.filter(parentService => parentService.versions.some((v: any) => v.isInactive))
			.map(parentService => ({
				...parentService,
				versions: parentService.versions.filter((v: any) => v.isInactive)
			}));

		return {
			active: activeParentServices,
			pendingPayment: pendingPaymentParentServices,
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
{:else if categorizedServices.active.length === 0 && categorizedServices.pendingPayment.length === 0 && categorizedServices.inactive.length === 0}
	<div class="text-center py-12">
		<p class="text-gray-500 text-lg">No approved services found for this organization.</p>
	</div>
{:else}
	<div class="space-y-12">
		<!-- Active Services Section -->
		{#if categorizedServices.active.length > 0}
			<div>
				<h2 class="text-3xl font-bold text-gray-900 mb-8">Active Services</h2>
				<p class="text-gray-600 mb-8">Services with qualified lead experts who are paid and not expired (officially active!)</p>
				
				{#each categorizedServices.active as parentService}
					<ServiceSection 
						{parentService}
						title="Active Service"
						description="✓ {parentService.versions[0]?.qualifiedLeadExperts?.length || 0} qualified lead expert{(parentService.versions[0]?.qualifiedLeadExperts?.length || 0) !== 1 ? 's' : ''} (paid & valid)"
						icon="✓"
						color="text-green-600"
						borderColor="border-green-200"
						bgColor="bg-green-50"
					/>
				{/each}
			</div>
		{/if}

		<!-- Pending Payment Services Section -->
		{#if categorizedServices.pendingPayment.length > 0}
			<div>
				<h2 class="text-3xl font-bold text-gray-900 mb-8">Pending Payment Services</h2>
				<p class="text-gray-600 mb-8">Services with qualified lead experts but payment is required or expired</p>
				
				{#each categorizedServices.pendingPayment as parentService}
					<ServiceSection 
						{parentService}
						title="Pending Payment Service"
						description="⚠ {parentService.versions[0]?.qualifiedLeadExpertsPendingPayment?.length || 0} qualified lead expert{(parentService.versions[0]?.qualifiedLeadExpertsPendingPayment?.length || 0) !== 1 ? 's' : ''} (payment required)"
						icon="⚠"
						color="text-yellow-600"
						borderColor="border-yellow-200"
						bgColor="bg-yellow-50"
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
