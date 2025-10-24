<script lang="ts">
	import ExpertSection from './ExpertSection.svelte';
	import ServiceApprovalTracker from './ServiceApprovalTracker.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import type { Id } from '$lib';
	import { getContext } from 'svelte';
	import { api as convexApi } from '../../convex/_generated/api';

	const orgId = getContext('orgId');

	interface ServiceVersion {
		_id: Id<'serviceVersions'>;
		version: number;
		name: string;
		assignments: any[];
		journeyCategories: {
			underReview: any[];
			rejected: any[];
			approvedTrainingRequired: any[];
			approvedTrainingFailed: any[];
			approvedAlreadyQualified: any[];
			approvedTrainingPassed: any[];
		};
		qualifiedLeadExperts?: any[];
		qualifiedRegularExperts?: any[];
		inTrainingExperts?: any[];
		pendingExperts?: any[];
		rejectedExperts?: any[];
	}

	interface ParentService {
		parent: {
			name: string;
		};
		versions: ServiceVersion[];
	}

	interface Props {
		parentService: ParentService;
		title: string;
		description: string;
		icon: string;
		color: string;
		borderColor: string;
		bgColor: string;
		opacity?: string;
	}

	let { 
		parentService, 
		title, 
		description, 
		icon, 
		color, 
		borderColor, 
		bgColor, 
		opacity = 'opacity-100' 
	}: Props = $props();

	// Get service approval status for each version
	const getServiceApprovalStatus = (serviceVersionId: Id<'serviceVersions'>) => {
		return useQuery((api as any).serviceApproval.getServiceApprovalStatus, () => ({
			organizationId: orgId as Id<'organizations'>,
			serviceVersionId
		}));
	};

	// Helper function to check if CV is paid
	const isCVPaid = (assignment: any) => {
		if (!assignment.expertCV) return false;
		const paidStatuses = ['paid', 'locked_for_review', 'unlocked_for_edits', 'locked_final'];
		return paidStatuses.includes(assignment.expertCV.status);
	};

	// Separate assignments by payment status
	const separateByPaymentStatus = (assignments: any[]) => {
		const paid = assignments.filter(a => isCVPaid(a));
		const unpaid = assignments.filter(a => !isCVPaid(a));
		return { paid, unpaid };
	};

	// Get filtered experts by journey type and payment status
	const getFilteredExperts = (journeyType: string, paymentStatus: 'paid' | 'unpaid', version: ServiceVersion) => {
		const experts = version.journeyCategories[journeyType as keyof typeof version.journeyCategories] || [];
		return experts.filter(a => paymentStatus === 'paid' ? isCVPaid(a) : !isCVPaid(a));
	};

	// Process version data to avoid long variable names in template
	const processVersionData = (version: ServiceVersion) => {
		// Get all other assignments (excluding qualified leads, regular experts, and training experts)
		const otherAssignments = [
			...version.journeyCategories.underReview,
			...version.journeyCategories.rejected,
			...version.journeyCategories.approvedTrainingFailed,
			...version.journeyCategories.approvedAlreadyQualified,
			...version.journeyCategories.approvedTrainingPassed
		];
		
		// Separate by payment status
		const paymentGroups = separateByPaymentStatus(otherAssignments);
		
		// Get filtered experts for each journey type (excluding training experts)
		const getFilteredExperts = (journeyType: string, paymentStatus: 'paid' | 'unpaid') => {
			// Skip training required experts since they have their own section
			if (journeyType === 'approvedTrainingRequired') {
				return [];
			}
			
			const experts = version.journeyCategories[journeyType as keyof typeof version.journeyCategories] || [];
			return experts.filter(a => paymentStatus === 'paid' ? isCVPaid(a) : !isCVPaid(a));
		};
		
		return {
			otherAssignments,
			paymentGroups,
			getFilteredExperts
		};
	};
</script>

<div class="mb-12">
	<h3 class="text-2xl font-semibold text-gray-800 mb-6">{parentService.parent?.name || 'Unknown Service'}</h3>
	
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each parentService.versions as version}
			{@const serviceApprovalStatus = getServiceApprovalStatus(version._id)}
			<div class="bg-white border {borderColor} rounded-lg shadow-sm {opacity}">
				<div class="p-4 border-b {borderColor} {bgColor}">
					<h4 class="text-lg font-medium text-gray-900">{version.name}</h4>
					<p class="text-sm {color} mt-1">
						{@html description}
					</p>
				</div>
				
				<div class="p-4">
					<!-- Service Approval Tracker -->
					{#if serviceApprovalStatus?.data}
						<ServiceApprovalTracker status={serviceApprovalStatus.data.status} title="Service Approval" />
					{:else}
						<ServiceApprovalTracker status="approved" title="Service Approval" />
					{/if}
					
					{#if version.assignments.length > 0}
						{@const versionData = processVersionData(version)}
						
						<!-- For Active Services: Show qualified leads and regular experts first -->
						{#if version.qualifiedLeadExperts && version.qualifiedLeadExperts.length > 0}
							<ExpertSection 
								assignments={version.qualifiedLeadExperts} 
								type="qualified-lead" 
								title="Qualified Lead Experts" 
							/>
						{/if}

						{#if version.qualifiedRegularExperts && version.qualifiedRegularExperts.length > 0}
							<ExpertSection 
								assignments={version.qualifiedRegularExperts} 
								type="regular" 
								title="Regular Experts" 
							/>
						{/if}

						<!-- In Training Section -->
						{#if version.inTrainingExperts && version.inTrainingExperts.length > 0}
							<div class="mt-4 pt-3 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
								<h5 class="text-lg font-semibold text-blue-800 mb-3 flex items-center">
									📚 In Training
								</h5>
								
								<ExpertSection 
									assignments={version.inTrainingExperts} 
									type="approved-training-required" 
									title="Training Required" 
								/>
							</div>
						{/if}

						<!-- Separate all other assignments by payment status -->
						<!-- Paid CVs - In Review Process -->
						{#if versionData.paymentGroups.paid.length > 0}
							<div class="mt-4 pt-3 border-t border-gray-200 bg-green-50 rounded-lg p-4">
								<h5 class="text-lg font-semibold text-green-800 mb-3 flex items-center">
									💰 Paid CVs - In Review Process
								</h5>
								
								<!-- Under Review -->
								{#if versionData.getFilteredExperts('underReview', 'paid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('underReview', 'paid')} 
										type="under-review" 
										title="Under Review" 
									/>
								{/if}
								
								<!-- Rejected -->
								{#if versionData.getFilteredExperts('rejected', 'paid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('rejected', 'paid')} 
										type="rejected" 
										title="Rejected" 
									/>
								{/if}
								
								<!-- Approved - Training Required -->
								{#if versionData.getFilteredExperts('approvedTrainingRequired', 'paid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('approvedTrainingRequired', 'paid')} 
										type="approved-training-required" 
										title="Approved - Training Required" 
									/>
								{/if}
								
								<!-- Approved - Training Failed -->
								{#if versionData.getFilteredExperts('approvedTrainingFailed', 'paid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('approvedTrainingFailed', 'paid')} 
										type="approved-training-failed" 
										title="Approved - Training Failed" 
									/>
								{/if}
								
								<!-- Approved - Already Qualified -->
								{#if versionData.getFilteredExperts('approvedAlreadyQualified', 'paid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('approvedAlreadyQualified', 'paid')} 
										type="approved-already-qualified" 
										title="Approved - Already Qualified" 
									/>
								{/if}
								
								<!-- Approved - Training Passed -->
								{#if versionData.getFilteredExperts('approvedTrainingPassed', 'paid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('approvedTrainingPassed', 'paid')} 
										type="approved-training-passed" 
										title="Approved - Training Passed" 
									/>
								{/if}
							</div>
						{/if}

						<!-- Unpaid CVs - Payment Required -->
						{#if versionData.paymentGroups.unpaid.length > 0}
							<div class="mt-4 pt-3 border-t border-gray-200 bg-yellow-50 rounded-lg p-4">
								<h5 class="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
									💳 Unpaid CVs - Payment Required
								</h5>
								
								<!-- Under Review -->
								{#if versionData.getFilteredExperts('underReview', 'unpaid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('underReview', 'unpaid')} 
										type="under-review" 
										title="Under Review" 
									/>
								{/if}
								
								<!-- Rejected -->
								{#if versionData.getFilteredExperts('rejected', 'unpaid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('rejected', 'unpaid')} 
										type="rejected" 
										title="Rejected" 
									/>
								{/if}
								
								<!-- Approved - Training Required -->
								{#if versionData.getFilteredExperts('approvedTrainingRequired', 'unpaid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('approvedTrainingRequired', 'unpaid')} 
										type="approved-training-required" 
										title="Approved - Training Required" 
									/>
								{/if}
								
								<!-- Approved - Training Failed -->
								{#if versionData.getFilteredExperts('approvedTrainingFailed', 'unpaid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('approvedTrainingFailed', 'unpaid')} 
										type="approved-training-failed" 
										title="Approved - Training Failed" 
									/>
								{/if}
								
								<!-- Approved - Already Qualified -->
								{#if versionData.getFilteredExperts('approvedAlreadyQualified', 'unpaid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('approvedAlreadyQualified', 'unpaid')} 
										type="approved-already-qualified" 
										title="Approved - Already Qualified" 
									/>
								{/if}
								
								<!-- Approved - Training Passed -->
								{#if versionData.getFilteredExperts('approvedTrainingPassed', 'unpaid').length > 0}
									<ExpertSection 
										assignments={versionData.getFilteredExperts('approvedTrainingPassed', 'unpaid')} 
										type="approved-training-passed" 
										title="Approved - Training Passed" 
									/>
								{/if}
							</div>
						{/if}
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
