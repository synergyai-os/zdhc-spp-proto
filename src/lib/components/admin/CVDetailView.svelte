<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { ServiceStatus, CVStatus } from '../../../convex/model/status';
	import { getServiceStatusDisplayName, getServiceStatusColor, SERVICE_STATUS_VALUES, getCVStatusColor, getCVStatusDisplayName } from '../../../convex/model/status';

	interface User {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
		country: string;
		phone?: string;
	}

	interface Experience {
		title: string;
		company: string;
		location: string;
		startDate: string;
		endDate: string;
		current: boolean;
		description: string;
	}

	interface Education {
		school: string;
		degree: string;
		field: string;
		startDate: string;
		endDate: string;
		description: string;
	}

	interface ExpertCV {
		_id: string;
		version: number;
		status: CVStatus;
		experience: Experience[];
		education: Education[];
		createdAt: number;
		submittedAt?: number;
		lockedAt?: number;
		assignments: ServiceAssignment[];
		pendingAssignments: ServiceAssignment[];
		approvedAssignments: ServiceAssignment[];
		rejectedAssignments: ServiceAssignment[];
	}

	interface ServiceAssignment {
		_id: string;
		status: ServiceStatus;
		role: 'lead' | 'regular';
		serviceVersion: {
			_id: string;
			name: string;
			version: string;
		};
		serviceParent: {
			name: string;
		};
		organization: {
			name: string;
		};
		createdAt: number;
		approvedAt?: number;
		approvedBy?: string;
		rejectedAt?: number;
		rejectedBy?: string;
		rejectionReason?: string;
		reviewedAt?: number;
		reviewedBy?: string;
		reviewNotes?: string;
	}

	interface CVDetailData {
		user: User;
		organizationGroups: Array<{
			organization: { name: string };
			cvs: ExpertCV[];
		}>;
		totalCVs: number;
		totalAssignments: number;
		pendingAssignments: number;
		submittedCVs: number;
		lockedCVs: number;
	}

	interface Props {
		cvData: CVDetailData;
		onApprovalChange: () => void;
	}

	let { cvData, onApprovalChange }: Props = $props();

	const client = useConvexClient();

	// Hardcoded example data for layout demonstration
	const exampleCVStatus = 'locked_for_review'; // Current CV status
	
	// Hardcoded CV switching data - all CVs for this user
	const allUserCVs = [
		{
			id: 'k570rpgsnm7c9j8wtnxb574mh57stw33',
			version: 1,
			status: 'locked_for_review',
			organization: 'ZDHC Foundation',
			createdAt: Date.now() - 259200000,
			isCurrent: true
		},
		{
			id: 'k5785zczcqja5bx4spzmfeec9d7sxmsb',
			version: 2,
			status: 'locked_final',
			organization: 'ZDHC Foundation',
			createdAt: Date.now() - 518400000,
			isCurrent: false
		},
		{
			id: 'k57etq9271vkp3cwss2bn62se57sw0cn',
			version: 3,
			status: 'paid',
			organization: 'ZDHC Foundation',
			createdAt: Date.now() - 777600000,
			isCurrent: false
		}
	];
	
	const exampleAuditTrail = [
		{ action: 'CV Status Changed', from: 'paid', to: 'locked_for_review', by: 'System', timestamp: Date.now() - 86400000 },
		{ action: 'Payment Completed', from: 'payment_pending', to: 'paid', by: 'Payment Gateway', timestamp: Date.now() - 172800000 },
		{ action: 'CV Submitted', from: 'completed', to: 'payment_pending', by: 'John Doe', timestamp: Date.now() - 259200000 }
	];
	const exampleInternalNotes = [
		{ author: 'Sarah Johnson', note: 'CV looks good overall, but need to verify experience in chemical engineering.', timestamp: Date.now() - 3600000 },
		{ author: 'Mike Chen', note: 'Waiting for additional documentation from the expert.', timestamp: Date.now() - 7200000 }
	];

	// State for approval/rejection actions
	let activeAssignment = $state<ServiceAssignment | null>(null);
	let showApprovalModal = $state(false);
	let showRejectionModal = $state(false);
	let approvalNotes = $state('');
	let rejectionReason = $state('');
	let rejectionNotes = $state('');
	let isProcessing = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// State for CV switching
	let selectedCVId = $state('k570rpgsnm7c9j8wtnxb574mh57stw33'); // Current CV by default
	let showCVComparison = $state(false);

	const formatDate = (timestamp: number): string => {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const canApprove = (assignment: ServiceAssignment): boolean => {
		return assignment.status === SERVICE_STATUS_VALUES[0]; // 'pending_review'
	};

	const canReject = (assignment: ServiceAssignment): boolean => {
		return assignment.status === SERVICE_STATUS_VALUES[0]; // 'pending_review'
	};

	// CV switching functions
	const switchToCV = (cvId: string) => {
		selectedCVId = cvId;
		// In real implementation, this would trigger a new query for the selected CV
		console.log('Switching to CV:', cvId);
	};

	const toggleCVComparison = () => {
		showCVComparison = !showCVComparison;
	};

	const getCurrentCV = () => {
		return allUserCVs.find(cv => cv.id === selectedCVId) || allUserCVs[0];
	};

	const handleApprove = (assignment: ServiceAssignment) => {
		activeAssignment = assignment;
		approvalNotes = '';
		showApprovalModal = true;
	};

	const handleReject = (assignment: ServiceAssignment) => {
		activeAssignment = assignment;
		rejectionReason = '';
		rejectionNotes = '';
		showRejectionModal = true;
	};

	const confirmApproval = async () => {
		if (!activeAssignment) return;

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).adminCVReview.approveServiceAssignment, {
				assignmentId: activeAssignment._id,
				reviewNotes: approvalNotes || undefined,
				reviewedBy: 'admin-user' // TODO: Get actual admin user ID
			});

			successMessage = `Approved ${activeAssignment.serviceVersion.name} for ${cvData.user.firstName} ${cvData.user.lastName}`;
			showApprovalModal = false;
			activeAssignment = null;
			onApprovalChange();
		} catch (error) {
			errorMessage = `Failed to approve: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const confirmRejection = async () => {
		if (!activeAssignment || !rejectionReason) return;

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).adminCVReview.rejectServiceAssignment, {
				assignmentId: activeAssignment._id,
				rejectionReason,
				reviewNotes: rejectionNotes || undefined,
				reviewedBy: 'admin-user' // TODO: Get actual admin user ID
			});

			successMessage = `Rejected ${activeAssignment.serviceVersion.name} for ${cvData.user.firstName} ${cvData.user.lastName}`;
			showRejectionModal = false;
			activeAssignment = null;
			onApprovalChange();
		} catch (error) {
			errorMessage = `Failed to reject: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const closeModals = () => {
		showApprovalModal = false;
		showRejectionModal = false;
		activeAssignment = null;
		approvalNotes = '';
		rejectionReason = '';
		rejectionNotes = '';
		errorMessage = '';
		successMessage = '';
	};

	// Clear messages after 5 seconds
	$effect(() => {
		if (successMessage || errorMessage) {
			const timer = setTimeout(() => {
				successMessage = '';
				errorMessage = '';
			}, 5000);
			return () => clearTimeout(timer);
		}
	});
</script>

<div class="flex gap-6">
	<!-- LEFT SIDEBAR: User Details & CV History -->
	<div class="w-80 flex-shrink-0 space-y-4">
		<!-- User Details Box -->
		<div class="bg-white border border-gray-200 rounded-lg p-4">
			<div class="flex items-center space-x-3 mb-3">
				<div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
					<span class="text-lg font-medium text-gray-700">
						{cvData.user.firstName[0]}{cvData.user.lastName[0]}
					</span>
				</div>
				<div>
					<h1 class="text-lg font-bold text-gray-900">
						{cvData.user.firstName} {cvData.user.lastName}
					</h1>
					<p class="text-sm text-gray-600">{cvData.user.email}</p>
				</div>
			</div>
			<div class="space-y-1 text-sm text-gray-600">
				<p>{cvData.user.country}</p>
				{#if cvData.user.phone}<p>{cvData.user.phone}</p>{/if}
			</div>
			
			<!-- Quick Stats -->
			<div class="mt-4 pt-4 border-t border-gray-200">
				<div class="grid grid-cols-3 gap-2 text-center">
					<div>
						<div class="text-lg font-bold text-yellow-600">{cvData.pendingAssignments}</div>
						<div class="text-xs text-gray-500">Pending</div>
					</div>
					<div>
						<div class="text-lg font-bold text-green-600">{cvData.totalAssignments - cvData.pendingAssignments}</div>
						<div class="text-xs text-gray-500">Decided</div>
					</div>
					<div>
						<div class="text-lg font-bold text-gray-600">{cvData.totalAssignments}</div>
						<div class="text-xs text-gray-500">Total</div>
					</div>
				</div>
			</div>
		</div>

		<!-- CV History Box -->
		<div class="bg-white border border-gray-200 rounded-lg p-4">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-sm font-semibold text-gray-900">CV History</h3>
				<button 
					type="button"
					onclick={toggleCVComparison}
					class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					{showCVComparison ? 'Hide' : 'Compare'}
				</button>
			</div>
			<div class="space-y-2">
				{#each allUserCVs as cv}
					<div class="p-2 rounded-lg cursor-pointer transition-colors {cv.id === selectedCVId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}" onclick={() => switchToCV(cv.id)}>
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-2">
								<span class="text-xs font-medium text-gray-900">v{cv.version}</span>
								{#if cv.isCurrent}
									<span class="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">Current</span>
								{/if}
							</div>
							<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium {getCVStatusColor(cv.status)}">
								{getCVStatusDisplayName(cv.status)}
							</span>
						</div>
						<div class="text-xs text-gray-500 mt-1">
							{cv.organization} • {formatDate(cv.createdAt)}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- MAIN CONTENT AREA -->
	<div class="flex-1 space-y-6">
		<!-- Messages -->
		{#if successMessage}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<div class="flex items-center space-x-3">
					<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
					<p class="text-green-700 font-medium">{successMessage}</p>
				</div>
			</div>
		{/if}

		{#if errorMessage}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex items-center space-x-3">
					<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
					<p class="text-red-700 font-medium">{errorMessage}</p>
				</div>
			</div>
		{/if}

		<!-- CV COMPARISON SECTION: Side-by-side CV comparison -->
		{#if showCVComparison}
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
					<svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
					</svg>
					CV Comparison
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#each allUserCVs as cv}
						<div class="border border-gray-200 rounded-lg p-4 {cv.id === selectedCVId ? 'ring-2 ring-blue-500' : ''}">
							<div class="flex items-center justify-between mb-3">
								<h3 class="font-semibold text-gray-900">
									v{cv.version}
									{#if cv.isCurrent}
										<span class="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded ml-2">Current</span>
									{/if}
								</h3>
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getCVStatusColor(cv.status)}">
									{getCVStatusDisplayName(cv.status)}
								</span>
							</div>
							<div class="space-y-2 text-sm">
								<p><strong>Created:</strong> {formatDate(cv.createdAt)}</p>
								<p><strong>Organization:</strong> {cv.organization}</p>
							</div>
							<div class="mt-3">
								{#if cv.id !== selectedCVId}
									<button 
										type="button"
										onclick={() => switchToCV(cv.id)}
										class="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
									>
										Switch to this CV
									</button>
								{:else}
									<div class="w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md text-center">
										Currently Viewing
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- SERVICE ASSIGNMENTS SECTION: Prioritized by Status -->
		<div class="space-y-6">
			{#each cvData.organizationGroups as orgGroup}
				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-bold text-gray-900">
							Service Applications for {orgGroup.organization.name}
						</h2>
						<!-- Unlock CV Button (when all services decided) -->
						{#if cvData.pendingAssignments === 0}
							<button 
								type="button"
								class="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
							>
								Unlock CV for Edits
							</button>
						{/if}
					</div>

					<!-- PENDING REVIEW SERVICES (Priority) -->
					{#if orgGroup.cvs.some(cv => cv.pendingAssignments.length > 0)}
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
								<svg class="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
								</svg>
								Pending Review ({orgGroup.cvs.reduce((total, cv) => total + cv.pendingAssignments.length, 0)})
							</h3>
							<div class="space-y-3">
								{#each orgGroup.cvs as cv}
									{#each cv.pendingAssignments as assignment}
										<div class="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
											<div class="flex justify-between items-start">
												<div class="flex-1">
													<h4 class="font-semibold text-gray-900">{assignment.serviceVersion.name}</h4>
													<p class="text-sm text-gray-600">{assignment.serviceParent.name} • {assignment.serviceVersion.version}</p>
													<div class="flex items-center space-x-2 mt-2">
														<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
															{assignment.role === 'lead' ? 'Lead Expert' : 'Regular Expert'}
														</span>
														<span class="text-xs text-gray-500">Applied: {formatDate(assignment.createdAt)}</span>
													</div>
												</div>
												<div class="flex items-center space-x-2">
													<!-- Communication Icon -->
													<button class="p-2 text-gray-400 hover:text-gray-600" title="Communication">
														<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
														</svg>
													</button>
													<!-- Action Buttons -->
													<button
														type="button"
														onclick={() => handleApprove(assignment)}
														class="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
													>
														Approve
													</button>
													<button
														type="button"
														onclick={() => handleReject(assignment)}
														class="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
													>
														Reject
													</button>
												</div>
											</div>
										</div>
									{/each}
								{/each}
							</div>
						</div>
					{/if}

					<!-- DECIDED SERVICES (Approved/Rejected) -->
					{#if orgGroup.cvs.some(cv => cv.approvedAssignments.length > 0 || cv.rejectedAssignments.length > 0)}
						<div>
							<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
								<svg class="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
								Decided Services
							</h3>
							<div class="space-y-3">
								{#each orgGroup.cvs as cv}
									{#each [...cv.approvedAssignments, ...cv.rejectedAssignments] as assignment}
										<div class="border border-gray-200 rounded-lg p-4">
											<div class="flex justify-between items-start">
												<div class="flex-1">
													<h4 class="font-semibold text-gray-900">{assignment.serviceVersion.name}</h4>
													<p class="text-sm text-gray-600">{assignment.serviceParent.name} • {assignment.serviceVersion.version}</p>
													<div class="flex items-center space-x-2 mt-2">
														<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getServiceStatusColor(assignment.status)}">
															{getServiceStatusDisplayName(assignment.status)}
														</span>
														<span class="text-xs text-gray-500">Applied: {formatDate(assignment.createdAt)}</span>
														{#if assignment.reviewedAt}
															<span class="text-xs text-gray-500">Reviewed: {formatDate(assignment.reviewedAt)}</span>
														{/if}
													</div>
												</div>
												<div class="flex items-center space-x-2">
													<!-- Communication Icon -->
													<button class="p-2 text-gray-400 hover:text-gray-600" title="Communication">
														<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
														</svg>
													</button>
												</div>
											</div>
											
											<!-- Review History -->
											{#if assignment.approvedAt || assignment.rejectedAt}
												<div class="bg-gray-50 rounded-lg p-3 mt-3">
													<div class="text-sm">
														{#if assignment.approvedAt}
															<p class="text-green-700">
																<strong>Approved</strong> on {formatDate(assignment.approvedAt)}
																{#if assignment.approvedBy} by {assignment.approvedBy}{/if}
															</p>
														{/if}
														{#if assignment.rejectedAt}
															<p class="text-red-700">
																<strong>Rejected</strong> on {formatDate(assignment.rejectedAt)}
																{#if assignment.rejectedBy} by {assignment.rejectedBy}{/if}
															</p>
															{#if assignment.rejectionReason}
																<p class="text-red-600 mt-1">
																	<strong>Reason:</strong> {assignment.rejectionReason}
																</p>
															{/if}
														{/if}
														{#if assignment.reviewNotes}
															<p class="text-gray-700 mt-2">
																<strong>Notes:</strong> {assignment.reviewNotes}
															</p>
														{/if}
													</div>
												</div>
											{/if}
										</div>
									{/each}
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- CV CONTENT SECTION: Experience & Education -->
		{#if cvData.organizationGroups.length > 0}
			{@const allCVs = cvData.organizationGroups.flatMap(org => org.cvs)}
			{@const cvWithExperience = allCVs.find(cv => cv.experience && cv.experience.length > 0)}
			{@const cvWithEducation = allCVs.find(cv => cv.education && cv.education.length > 0)}
			
			{#if cvWithExperience?.experience && cvWithExperience.experience.length > 0}
				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h2 class="text-xl font-bold text-gray-900 mb-4">Professional Experience</h2>
					<div class="space-y-4">
						{#each cvWithExperience.experience as exp}
							<div class="border-l-4 border-blue-500 pl-4 py-2">
								<div class="flex justify-between items-start">
									<div>
										<h3 class="font-semibold text-gray-900">{exp.title}</h3>
										<p class="text-gray-600">{exp.company} • {exp.location}</p>
										<p class="text-sm text-gray-500">
											{exp.startDate} - {exp.current ? 'Present' : exp.endDate}
										</p>
									</div>
									{#if exp.current}
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
											Current
										</span>
									{/if}
								</div>
								{#if exp.description}
									<p class="text-gray-700 mt-2">{exp.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if cvWithEducation?.education && cvWithEducation.education.length > 0}
				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h2 class="text-xl font-bold text-gray-900 mb-4">Education</h2>
					<div class="space-y-4">
						{#each cvWithEducation.education as edu}
							<div class="border-l-4 border-green-500 pl-4 py-2">
								<h3 class="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
								<p class="text-gray-600">{edu.school}</p>
								<p class="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</p>
								{#if edu.description}
									<p class="text-gray-700 mt-2">{edu.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<!-- AUDIT TRAIL SECTION: History of Changes -->
		<div class="bg-white border border-gray-200 rounded-lg p-6">
			<h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
				<svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				Audit Trail
			</h2>
			<div class="space-y-3">
				{#each exampleAuditTrail as entry}
					<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
						<div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">{entry.action}</p>
							<p class="text-xs text-gray-600">
								{#if entry.from && entry.to}
									{entry.from} → {entry.to}
								{/if}
								by {entry.by} • {formatDate(entry.timestamp)}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- INTERNAL NOTES SECTION: Team Communication -->
		<div class="bg-white border border-gray-200 rounded-lg p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-bold text-gray-900 flex items-center">
					<svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
					</svg>
					Internal Notes
				</h2>
				<button class="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
					Add Note
				</button>
			</div>
			<div class="space-y-3">
				{#each exampleInternalNotes as note}
					<div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<p class="text-sm text-gray-900">{note.note}</p>
								<p class="text-xs text-gray-600 mt-1">
									by {note.author} • {formatDate(note.timestamp)}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- Approval Modal -->
{#if showApprovalModal && activeAssignment}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					Approve {activeAssignment.serviceVersion.name}
				</h3>
				<p class="text-sm text-gray-600 mb-4">
					This will approve {cvData.user.firstName}
					{cvData.user.lastName} for the {activeAssignment.serviceVersion.name} service.
				</p>

				<div class="mb-4">
					<label for="approval-notes" class="block text-sm font-medium text-gray-700 mb-2">
						Review Notes (Optional)
					</label>
					<textarea
						id="approval-notes"
						bind:value={approvalNotes}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						placeholder="Add any notes about this approval..."
					></textarea>
				</div>

				<div class="flex justify-end space-x-3">
					<button
						type="button"
						onclick={closeModals}
						disabled={isProcessing}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmApproval}
						disabled={isProcessing}
						class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
					>
						{#if isProcessing}
							Processing...
						{:else}
							Approve
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Rejection Modal -->
{#if showRejectionModal && activeAssignment}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					Reject {activeAssignment.serviceVersion.name}
				</h3>
				<p class="text-sm text-gray-600 mb-4">
					This will reject {cvData.user.firstName}
					{cvData.user.lastName} for the {activeAssignment.serviceVersion.name} service.
				</p>

				<div class="mb-4">
					<label for="rejection-reason" class="block text-sm font-medium text-gray-700 mb-2">
						Rejection Reason *
					</label>
					<select
						id="rejection-reason"
						bind:value={rejectionReason}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
					>
						<option value="">Select a reason...</option>
						<option value="Insufficient Experience">Insufficient Experience</option>
						<option value="Missing Qualifications">Missing Qualifications</option>
						<option value="Incomplete CV">Incomplete CV</option>
						<option value="Does Not Meet Standards">Does Not Meet Standards</option>
						<option value="Other">Other</option>
					</select>
				</div>

				<div class="mb-4">
					<label for="rejection-notes" class="block text-sm font-medium text-gray-700 mb-2">
						Additional Notes (Optional)
					</label>
					<textarea
						id="rejection-notes"
						bind:value={rejectionNotes}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						placeholder="Provide additional details about the rejection..."
					></textarea>
				</div>

				<div class="flex justify-end space-x-3">
					<button
						type="button"
						onclick={closeModals}
						disabled={isProcessing}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmRejection}
						disabled={isProcessing || !rejectionReason}
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
					>
						{#if isProcessing}
							Processing...
						{:else}
							Reject
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
