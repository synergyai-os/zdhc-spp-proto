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

	// Get organization service approvals to check payment status
	const organizationApprovals = useQuery(api.utilities.getOrganizationApprovals, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Helper function to check if organization has paid annual fee for a service
	const isOrganizationServicePaid = (serviceVersionId: string) => {
		if (!organizationApprovals?.data) return false;
		
		const approval = organizationApprovals.data.find(a => a.serviceVersionId === serviceVersionId);
		if (!approval) return false;
		
		// Check if payment exists and is not expired
		const hasPayment = approval.paidAt !== undefined;
		const isNotExpired = approval.expiresAt ? Date.now() < approval.expiresAt : false;
		return hasPayment && isNotExpired;
	};

	// Helper function to check if service has qualified lead expert
	const hasQualifiedLeadExpert = (service: any) => {
		const assignments = serviceAssignments?.data?.filter(
			assignment => assignment.serviceVersion?._id === service._id
		) || [];
		
		return assignments.some(assignment => 
			assignment.role === 'lead' && 
			assignment.status === 'approved' && 
			assignment.expertCV?.status === 'locked_final' &&
			assignment.trainingStatus && 
			isQualified(assignment.trainingStatus)
		);
	};

	// Helper function to process a service with expert data
	const processServiceWithExperts = (service: any) => {
		// Get assignments for this service version
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

		// Categorize experts by journey
		const journeyCategories = {
			underReview: pendingExperts,
			rejected: rejectedExperts,
			approvedTrainingRequired: approvedLeadExperts.filter(a => 
				a.trainingStatus && ['required', 'invited', 'in_progress'].includes(a.trainingStatus)
			),
			approvedTrainingFailed: approvedLeadExperts.filter(a => a.trainingStatus === 'failed'),
			approvedAlreadyQualified: approvedLeadExperts.filter(a => a.trainingStatus === 'not_required'),
			approvedTrainingPassed: approvedLeadExperts.filter(a => a.trainingStatus === 'passed')
		};

		// Calculate qualified experts
		const qualifiedLeadExperts = approvedLeadExperts.filter(a => 
			a.trainingStatus && isQualified(a.trainingStatus) && isCVPaidAndValid(a)
		);
		const qualifiedLeadExpertsPendingPayment = approvedLeadExperts.filter(a => 
			a.trainingStatus && isQualified(a.trainingStatus) && !isCVPaidAndValid(a)
		);
		const qualifiedRegularExperts = approvedRegularExperts.filter(a => 
			a.trainingStatus && isQualified(a.trainingStatus)
		);
		
		// Experts currently in training
		const inTrainingExperts = [...approvedLeadExperts, ...approvedRegularExperts].filter(a => 
			a.trainingStatus && ['required', 'invited', 'in_progress'].includes(a.trainingStatus)
		);

		return {
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
			journeyCategories
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

	// Simple categorization with rich objects - just 3 filters
	const categorizedServices = $derived.by(() => {
		if (!approvedServices?.data) return { active: [], pendingPayment: [], approved: [] };
		
		// Wait for organization approvals to load, but don't wait forever
		if (organizationApprovals?.isLoading) {
			return { active: [], pendingPayment: [], approved: [] };
		}

		const active = approvedServices.data
			.filter(service => 
				hasQualifiedLeadExpert(service) && isOrganizationServicePaid(service._id)
			)
			.map(service => processServiceWithExperts(service));
		
		const pendingPayment = approvedServices.data
			.filter(service => 
				hasQualifiedLeadExpert(service) && !isOrganizationServicePaid(service._id)
			)
			.map(service => processServiceWithExperts(service));
		
		const approved = approvedServices.data
			.filter(service => 
				!hasQualifiedLeadExpert(service)
			)
			.map(service => processServiceWithExperts(service));

		return { active, pendingPayment, approved };
	});
</script>

{#if approvedServices?.isLoading || serviceAssignments?.isLoading || organizationApprovals?.isLoading}
	<div class="flex justify-center items-center py-12">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
		<span class="ml-3 text-gray-600">Loading services...</span>
	</div>
{:else if approvedServices?.error || serviceAssignments?.error}
	<div class="bg-red-50 border border-red-200 rounded-md p-4">
		<p class="text-red-800">Error loading services: {approvedServices?.error || serviceAssignments?.error}</p>
	</div>
{:else if categorizedServices.active.length === 0 && categorizedServices.pendingPayment.length === 0 && categorizedServices.approved.length === 0}
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
				
				{#each categorizedServices.active as service}
					<ServiceSection 
						parentService={{ parent: service.serviceParent || { name: 'Unknown Service' }, versions: [service] }}
						title="Active Service"
						description="✓ Qualified lead expert (paid & valid)"
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
				
				{#each categorizedServices.pendingPayment as service}
					<ServiceSection 
						parentService={{ parent: service.serviceParent || { name: 'Unknown Service' }, versions: [service] }}
						title="Pending Payment Service"
						description="⚠ Qualified lead expert (payment required)"
						icon="⚠"
						color="text-yellow-600"
						borderColor="border-yellow-200"
						bgColor="bg-yellow-50"
					/>
				{/each}
			</div>
		{/if}

		<!-- Approved Services Section -->
		{#if categorizedServices.approved.length > 0}
			<div>
				<h2 class="text-3xl font-bold text-gray-900 mb-8">Approved Services</h2>
				<p class="text-gray-600 mb-8">Services without qualified lead experts (could have a lead expert but is not yet qualified)</p>
				
				{#each categorizedServices.approved as service}
					<ServiceSection 
						parentService={{ parent: service.serviceParent || { name: 'Unknown Service' }, versions: [service] }}
						title="Approved Service"
						description="⚠ No qualified lead expert"
						icon="⚠"
						color="text-blue-600"
						borderColor="border-blue-200"
						bgColor="bg-blue-50"
					/>
				{/each}
			</div>
		{/if}

	</div>
{/if}
