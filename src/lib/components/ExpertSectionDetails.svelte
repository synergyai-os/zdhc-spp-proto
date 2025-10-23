<script lang="ts">
	import { 
		getCVStatusDisplayName,
		type ExpertJourneyType,
		type CVStatus
	} from '../../convex/model/status';
	import type { Id } from '$lib';

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
</div>
