<script lang="ts">
	import { 
		getCVStatusDisplayName,
		type ExpertJourneyType,
		type CVStatus,
		type TrainingStatus
	} from '../../convex/model/status';
	import type { Id } from '$lib';
	import CVStatusTracker from './CVStatusTracker.svelte';
	import ServiceTrainingTracker from './ServiceTrainingTracker.svelte';
	import DevelopmentToolBar from './admin/DevelopmentToolBar.svelte';

	interface ServiceAssignment {
		_id: Id<'expertServiceAssignments'>;
		role: 'lead' | 'regular';
		status: string;
		trainingStatus?: string;
		rejectionReason?: string;
		user?: {
			firstName?: string;
			lastName?: string;
		};
		expertCV?: {
			_id: Id<'expertCVs'>;
			status: CVStatus;
			version: number;
		};
	}

	interface Props {
		assignment: ServiceAssignment;
		journeyType: ExpertJourneyType;
		statusMessage: string;
		statusColor: string;
	}

	let { assignment, journeyType, statusMessage, statusColor }: Props = $props();

	// Check if CV is paid
	const isCVPaid = (assignment: ServiceAssignment) => {
		if (!assignment.expertCV) return false;
		const paidStatuses = ['paid', 'locked_for_review', 'unlocked_for_edits', 'locked_final'];
		return paidStatuses.includes(assignment.expertCV.status);
	};

	// Determine which tracker to show
	const shouldShowCVTracker = () => {
		// Show CV tracker for pending review OR approved assignments whose CVs are not locked
		return assignment.status === 'pending_review' || 
		       (assignment.status === 'approved' && (!assignment.expertCV || assignment.expertCV.status !== 'locked_final'));
	};

	const shouldShowTrainingTracker = () => {
		// Only show training tracker for approved assignments whose CVs are locked
		return assignment.status === 'approved' && 
		       assignment.expertCV && 
		       assignment.expertCV.status === 'locked_final';
	};

	// Map CV status to tracker status
	const getCVTrackerStatus = (): 'paid' | 'in_review' | 'approved' | 'denied' | 'waiting_for_response' => {
		if (!assignment.expertCV) return 'paid';
		
		const cvStatus = assignment.expertCV.status;
		
		// Map CV statuses to tracker statuses
		if (cvStatus === 'paid') return 'paid';
		if (cvStatus === 'locked_for_review') return 'in_review';
		if (cvStatus === 'unlocked_for_edits') return 'waiting_for_response';
		if (cvStatus === 'locked_final') return 'approved';
		
		// For approved assignments whose CVs are not locked, show as in_review
		if (assignment.status === 'approved' && (cvStatus as string) !== 'locked_final') {
			return 'in_review';
		}
		
		// Default to paid for other statuses
		return 'paid';
	};

	// Map training status to tracker status
	const getTrainingTrackerStatus = (): 'invited' | 'in_progress' | 'qualified' | 'failed' => {
		if (!assignment.trainingStatus) return 'invited';
		
		const trainingStatus = assignment.trainingStatus;
		
		// Map training statuses to tracker statuses
		if (trainingStatus === 'invited') return 'invited';
		if (trainingStatus === 'in_progress') return 'in_progress';
		if (trainingStatus === 'passed') return 'qualified';
		if (trainingStatus === 'failed') return 'failed';
		
		// Default to invited for other statuses
		return 'invited';
	};
</script>

<div class="px-2 pb-2 border-t border-gray-200 bg-gray-50">
	<div class="pt-2 text-xs text-gray-600 space-y-1">
		<div class="flex justify-between items-center">
			<span class="font-medium">Status:</span>
			<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {statusColor}">
				{statusMessage}
			</span>
		</div>
		
		{#if assignment.expertCV}
			<div class="flex justify-between items-center">
				<span class="font-medium">CV Status:</span>
				<span class="text-gray-700">{getCVStatusDisplayName(assignment.expertCV.status as CVStatus)}</span>
			</div>
			
			<div class="flex justify-between items-center">
				<span class="font-medium">CV Version:</span>
				<span class="text-gray-700">v{assignment.expertCV.version}</span>
			</div>
			
			<div class="flex justify-between items-center">
				<span class="font-medium">Payment:</span>
				<span class="flex items-center text-gray-700">
					{#if isCVPaid(assignment)}
						💰 Paid CV
					{:else}
						💳 Unpaid CV
					{/if}
				</span>
			</div>
		{/if}
		
		{#if assignment.rejectionReason}
			<div class="flex justify-between items-start">
				<span class="font-medium">Rejection Reason:</span>
				<span class="text-gray-700 text-right max-w-48">{assignment.rejectionReason}</span>
			</div>
		{/if}
		
		{#if assignment.trainingStatus}
			<div class="flex justify-between items-center">
				<span class="font-medium">Training:</span>
				<span class="text-gray-700">{assignment.trainingStatus}</span>
			</div>
		{/if}
	</div>
	
	<!-- Status Trackers -->
	<div class="mt-4 px-2">
		{#if shouldShowCVTracker()}
			<CVStatusTracker 
				status={getCVTrackerStatus()} 
				title="CV Approval Progress" 
			/>
		{:else if shouldShowTrainingTracker()}
			<ServiceTrainingTracker 
				status={getTrainingTrackerStatus()} 
				title="Service Readiness" 
			/>
		{/if}
	</div>
	
	<!-- Development Tools -->
	{#if assignment.expertCV}
		<div class="mt-4 px-2">
			<DevelopmentToolBar 
				cvStatus={assignment.expertCV.status}
				cvId={assignment.expertCV._id}
				assignmentId={assignment._id}
				trainingStatus={assignment.trainingStatus as TrainingStatus}
			/>
		</div>
	{/if}
</div>
