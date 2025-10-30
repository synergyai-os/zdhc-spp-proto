<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { ServiceStatus, CVStatus, ExpertRole } from '../../../convex/model/status';
	import { getServiceStatusDisplayName, getServiceStatusColor, SERVICE_STATUS_VALUES, getCVStatusColor, getCVStatusDisplayName, getExpertRoleDisplayName, getExpertRoleColor } from '../../../convex/model/status';
	import { formatDate, formatDateShort } from '../../utils/date';
	import DevelopmentToolBar from './DevelopmentToolBar.svelte';
	import AuditTrailSection from './AuditTrailSection.svelte';
	import InternalNotesSection from './InternalNotesSection.svelte';
	import CVContentDisplay from './CVContentDisplay.svelte';
	import ActionBanners from './ActionBanners.svelte';
	import ServiceAssignmentCard from './ServiceAssignmentCard.svelte';
	import UserStatsCard from './UserStatsCard.svelte';
	import type { ExperienceEntry, EducationEntry, TrainingQualificationEntry, OtherApprovalEntry } from '../../../convex/model/types';

	interface User {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
		country: string;
		phone?: string;
	}

	interface ExpertCV {
		_id: string;
		version: number;
		status: CVStatus;
		experience: ExperienceEntry[];
		education: EducationEntry[];
		trainingQualifications?: TrainingQualificationEntry[];
		otherApprovals?: OtherApprovalEntry[];
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
		role: ExpertRole;
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

	// Real CV switching data - extracted from cvData.organizationGroups
	const allUserCVs = $derived.by((): Array<{
		id: string;
		version: number;
		status: CVStatus;
		organization: string;
		createdAt: number;
		isCurrent: boolean;
	}> => {
		const allCVs = cvData.organizationGroups.flatMap(orgGroup => 
			orgGroup.cvs.map(cv => ({
				id: cv._id,
				version: cv.version,
				status: cv.status,
				organization: orgGroup.organization.name,
				createdAt: cv.createdAt,
				isCurrent: false // Will be determined by selectedCVId
			}))
		);
		
		// If no real CVs found, use hardcoded data for testing
		if (allCVs.length === 0) {
			return [
				{
					id: 'k570rpgsnm7c9j8wtnxb574mh57stw33',
					version: 1,
					status: 'locked_for_review',
					organization: 'ZDHC Foundation',
					createdAt: Date.now() - 259200000,
					isCurrent: true
				}
			];
		}
		
		// Mark the first CV as current by default
		if (allCVs.length > 0) {
			allCVs[0].isCurrent = true;
		}
		
		return allCVs;
	});
	

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
	let selectedCVId = $state('');

	// Initialize selectedCVId with first CV when data loads
	$effect(() => {
		if (allUserCVs.length > 0 && !selectedCVId) {
			selectedCVId = allUserCVs[0].id;
		}
	});

	const canToggleStatus = (assignment: ServiceAssignment): boolean => {
		return currentCVData?.status === 'locked_for_review';
	};

	const getActionButtonFeedback = (): string => {
		if (!currentCVData) return '';
		
		switch (currentCVData.status) {
			case 'draft':
				return 'CV Not Ready';
			case 'completed':
				return 'Awaiting Payment';
			case 'payment_pending':
			case 'paid':
				return 'Awaiting Review';
			case 'unlocked_for_edits':
				return 'Awaiting Edits';
			case 'locked_final':
				return 'CV Locked';
			default:
				return '';
		}
	};

	const canLockCV = $derived(() => {
		if (!currentCVData || currentCVData.status !== 'locked_for_review') {
			return false;
		}
		// Check if all assignments are decided (approved or rejected)
		const allAssignments = [
			...currentCVData.pendingAssignments,
			...currentCVData.approvedAssignments,
			...currentCVData.rejectedAssignments
		];
		return allAssignments.every(a => a.status === 'approved' || a.status === 'rejected');
	});

	// CV switching functions
	const switchToCV = (cvId: string) => {
		selectedCVId = cvId;
		// TODO: In real implementation, this would trigger a new query for the selected CV
	};

	// Get the currently selected CV data
	const currentCVData = $derived.by(() => {
		if (!selectedCVId || !cvData.organizationGroups) return null;
		
		// Find the selected CV across all organization groups
		for (const orgGroup of cvData.organizationGroups) {
			const cv = orgGroup.cvs.find(cv => cv._id === selectedCVId);
			if (cv) {
				return {
					...cv,
					organization: orgGroup.organization
				};
			}
		}
		return null;
	});

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
		
		if (rejectionReason === 'Other' && !rejectionNotes.trim()) {
			errorMessage = 'Additional notes are required when "Other" is selected as the rejection reason.';
			return;
		}

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

	const unlockCV = async () => {
		if (!currentCVData) return;

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).expert.updateCVStatus, {
				cvId: currentCVData._id,
				newStatus: 'unlocked_for_edits' as CVStatus
			});

			successMessage = `CV unlocked for edits - The SPP Manager and the Expert ${cvData.user.firstName} ${cvData.user.lastName} can now make changes`;
			onApprovalChange(); // Refresh data
		} catch (error) {
			errorMessage = `Failed to unlock CV: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const lockCV = async () => {
		if (!currentCVData) return;

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			const result = await client.mutation((api as any).adminCVReview.lockCVFinal, {
				cvId: currentCVData._id as any,
				lockedBy: 'admin-user' // TODO: Get actual admin user ID
			});

			successMessage = `CV locked and finalized! ${result.approvedCount} services approved, ${result.rejectedCount} services rejected. Training invitations will be sent for approved services.`;
			onApprovalChange(); // Refresh data
		} catch (error) {
			errorMessage = `Failed to lock CV: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const startReview = async () => {
		if (!currentCVData) return;

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).expert.updateCVStatus, {
				cvId: currentCVData._id,
				newStatus: 'locked_for_review' as CVStatus
			});

			successMessage = `Review started for ${cvData.user.firstName} ${cvData.user.lastName}. You can now approve or reject service applications.`;
			onApprovalChange(); // Refresh data
		} catch (error) {
			errorMessage = `Failed to start review: ${error}`;
		} finally {
			isProcessing = false;
		}
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
		<!-- User Details Box with Stats -->
		{#if cvData?.user}
			<UserStatsCard
				userFirstName={cvData.user.firstName}
				userLastName={cvData.user.lastName}
				userEmail={cvData.user.email}
				userCountry={cvData.user.country}
				userPhone={cvData.user.phone}
				organizationGroups={cvData.organizationGroups}
			/>
		{/if}

		<!-- CV History Box -->
		<div class="bg-white border border-gray-200 rounded-lg p-4">
			<div class="mb-3">
				<h3 class="text-sm font-semibold text-gray-900">CV History</h3>
			</div>
			<div class="space-y-2">
				{#each allUserCVs as cv}
					<button 
						type="button"
						class="w-full p-2 rounded-lg transition-colors text-left {cv.id === selectedCVId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}" 
						onclick={() => switchToCV(cv.id)}
					>
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
							{cv.organization} • {formatDateShort(cv.createdAt)}
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Development Toolbar -->
		{#if currentCVData}
			<DevelopmentToolBar 
				cvStatus={currentCVData.status}
				cvId={currentCVData._id as any}
				serviceVersionId={currentCVData.approvedAssignments?.[0]?.serviceVersion?._id as any}
				onActionCompleted={onApprovalChange}
			/>
		{/if}
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

		<!-- SERVICE ASSIGNMENTS SECTION: Prioritized by Status -->
		<div class="space-y-6">
			{#if currentCVData}
				<!-- Action Banners (Conditional based on CV status and review state) -->
				<ActionBanners
					currentCVStatus={currentCVData.status}
					canLockCV={canLockCV()}
					{isProcessing}
					onStartReview={startReview}
					onLockCV={lockCV}
					onUnlockCV={unlockCV}
				/>

				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-bold text-gray-900">
							Service Applications for {currentCVData.organization.name}
						</h2>
					</div>

					<!-- ALL SERVICE ASSIGNMENTS -->
					{#if currentCVData.assignments && currentCVData.assignments.length > 0}
						<div class="space-y-3">
							{#each currentCVData.assignments as assignment}
								<ServiceAssignmentCard
									{assignment}
									{formatDate}
									{canToggleStatus}
									onApprove={handleApprove}
									onReject={handleReject}
									{getActionButtonFeedback}
								/>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<p>No service assignments found for this CV.</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- CV CONTENT SECTION: Experience & Education -->
		{#if currentCVData}
			<CVContentDisplay 
				cvId={currentCVData._id as any}
				cvStatus={currentCVData.status}
				experience={currentCVData.experience} 
				education={currentCVData.education}
				trainingQualifications={currentCVData.trainingQualifications}
				otherApprovals={currentCVData.otherApprovals}
				onItemsUpdated={onApprovalChange}
			/>
		{/if}

		<!-- AUDIT TRAIL SECTION: History of Changes -->
		<AuditTrailSection />

		<!-- INTERNAL NOTES SECTION: Team Communication -->
		<InternalNotesSection />
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
						Additional Notes {rejectionReason === 'Other' ? '*' : '(Optional)'}
					</label>
					<textarea
						id="rejection-notes"
						bind:value={rejectionNotes}
						rows="3"
						class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 {rejectionReason === 'Other' && !rejectionNotes.trim() ? 'border-red-500' : 'border-gray-300'}"
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
						disabled={isProcessing || !rejectionReason || (rejectionReason === 'Other' && !rejectionNotes.trim())}
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
