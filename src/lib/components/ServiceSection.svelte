<script lang="ts">
	import ExpertSection from './ExpertSection.svelte';
	import type { Id } from '$lib';

	interface ServiceVersion {
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
		approvedRegularExperts?: any[];
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
</script>

<div class="mb-12">
	<h3 class="text-2xl font-semibold text-gray-800 mb-6">{parentService.parent?.name || 'Unknown Service'}</h3>
	
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each parentService.versions as version}
			<div class="bg-white border {borderColor} rounded-lg shadow-sm {opacity}">
				<div class="p-4 border-b {borderColor} {bgColor}">
					<h4 class="text-lg font-medium text-gray-900">{version.name}</h4>
					<p class="text-sm {color} mt-1">
						{@html description}
					</p>
				</div>
				
				<div class="p-4">
					{#if version.assignments.length > 0}
						<!-- For Active Services: Show qualified leads and regular experts first -->
						{#if version.qualifiedLeadExperts && version.qualifiedLeadExperts.length > 0}
							<ExpertSection 
								assignments={version.qualifiedLeadExperts} 
								type="qualified-lead" 
								title="Qualified Lead Experts" 
							/>
						{/if}

						{#if version.approvedRegularExperts && version.approvedRegularExperts.length > 0}
							<ExpertSection 
								assignments={version.approvedRegularExperts} 
								type="regular" 
								title="Regular Experts" 
							/>
						{/if}

						<!-- Separate all other assignments by payment status -->
						{@const otherAssignments = [
							...version.journeyCategories.underReview,
							...version.journeyCategories.rejected,
							...version.journeyCategories.approvedTrainingRequired,
							...version.journeyCategories.approvedTrainingFailed,
							...version.journeyCategories.approvedAlreadyQualified,
							...version.journeyCategories.approvedTrainingPassed
						]}
						
						{@const paymentGroups = separateByPaymentStatus(otherAssignments)}

						<!-- Paid CVs - In Review Process -->
						{#if paymentGroups.paid.length > 0}
							<div class="mt-4 pt-3 border-t border-gray-200">
								<h5 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
									<span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
									💰 Paid CVs - In Review Process
								</h5>
								
								<!-- Under Review -->
								{#if version.journeyCategories.underReview.filter(a => isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.underReview.filter(a => isCVPaid(a))} 
										type="under-review" 
										title="Under Review" 
									/>
								{/if}
								
								<!-- Rejected -->
								{#if version.journeyCategories.rejected.filter(a => isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.rejected.filter(a => isCVPaid(a))} 
										type="rejected" 
										title="Rejected" 
									/>
								{/if}
								
								<!-- Approved - Training Required -->
								{#if version.journeyCategories.approvedTrainingRequired.filter(a => isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.approvedTrainingRequired.filter(a => isCVPaid(a))} 
										type="approved-training-required" 
										title="Approved - Training Required" 
									/>
								{/if}
								
								<!-- Approved - Training Failed -->
								{#if version.journeyCategories.approvedTrainingFailed.filter(a => isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.approvedTrainingFailed.filter(a => isCVPaid(a))} 
										type="approved-training-failed" 
										title="Approved - Training Failed" 
									/>
								{/if}
								
								<!-- Approved - Already Qualified -->
								{#if version.journeyCategories.approvedAlreadyQualified.filter(a => isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.approvedAlreadyQualified.filter(a => isCVPaid(a))} 
										type="approved-already-qualified" 
										title="Approved - Already Qualified" 
									/>
								{/if}
								
								<!-- Approved - Training Passed -->
								{#if version.journeyCategories.approvedTrainingPassed.filter(a => isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.approvedTrainingPassed.filter(a => isCVPaid(a))} 
										type="approved-training-passed" 
										title="Approved - Training Passed" 
									/>
								{/if}
							</div>
						{/if}

						<!-- Unpaid CVs - Payment Required -->
						{#if paymentGroups.unpaid.length > 0}
							<div class="mt-4 pt-3 border-t border-gray-200">
								<h5 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
									<span class="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
									💳 Unpaid CVs - Payment Required
								</h5>
								
								<!-- Under Review -->
								{#if version.journeyCategories.underReview.filter(a => !isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.underReview.filter(a => !isCVPaid(a))} 
										type="under-review" 
										title="Under Review" 
									/>
								{/if}
								
								<!-- Rejected -->
								{#if version.journeyCategories.rejected.filter(a => !isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.rejected.filter(a => !isCVPaid(a))} 
										type="rejected" 
										title="Rejected" 
									/>
								{/if}
								
								<!-- Approved - Training Required -->
								{#if version.journeyCategories.approvedTrainingRequired.filter(a => !isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.approvedTrainingRequired.filter(a => !isCVPaid(a))} 
										type="approved-training-required" 
										title="Approved - Training Required" 
									/>
								{/if}
								
								<!-- Approved - Training Failed -->
								{#if version.journeyCategories.approvedTrainingFailed.filter(a => !isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.approvedTrainingFailed.filter(a => !isCVPaid(a))} 
										type="approved-training-failed" 
										title="Approved - Training Failed" 
									/>
								{/if}
								
								<!-- Approved - Already Qualified -->
								{#if version.journeyCategories.approvedAlreadyQualified.filter(a => !isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.approvedAlreadyQualified.filter(a => !isCVPaid(a))} 
										type="approved-already-qualified" 
										title="Approved - Already Qualified" 
									/>
								{/if}
								
								<!-- Approved - Training Passed -->
								{#if version.journeyCategories.approvedTrainingPassed.filter(a => !isCVPaid(a)).length > 0}
									<ExpertSection 
										assignments={version.journeyCategories.approvedTrainingPassed.filter(a => !isCVPaid(a))} 
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
