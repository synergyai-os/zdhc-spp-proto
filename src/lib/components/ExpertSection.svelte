<script lang="ts">
	import { 
		getServiceStatusColor, 
		getServiceStatusDisplayName, 
		getTrainingStatusColor,
		getTrainingStatusDisplayName,
		getCVStatusColor,
		getCVStatusDisplayName,
		isQualified,
		isActiveForService,
		getJourneyStatusMessage,
		getJourneyStatusColor,
		type ServiceStatus,
		type TrainingStatus,
		type CVStatus,
		type ExpertJourneyType
	} from '../../convex/model/status';
	import type { Id } from '$lib';

	interface ServiceAssignment {
		_id: Id<'expertServiceAssignments'>;
		role: 'lead' | 'regular';
		status: ServiceStatus;
		trainingStatus?: TrainingStatus;
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
		assignments: ServiceAssignment[];
		type: ExpertJourneyType;
		title: string;
		showCount?: boolean;
	}

	let { assignments, type, title, showCount = true }: Props = $props();

	// Get styling based on type
	const getStyling = (type: string) => {
		switch (type) {
			case 'qualified-lead':
				return {
					headerColor: 'text-purple-800',
					dotColor: 'bg-purple-500',
					cardBg: 'bg-purple-50',
					avatarBg: 'bg-purple-500',
					avatarSize: 'h-8 w-8',
					icon: '✓'
				};
			case 'regular':
				return {
					headerColor: 'text-blue-800',
					dotColor: 'bg-blue-500',
					cardBg: 'bg-blue-50',
					avatarBg: 'bg-blue-500',
					avatarSize: 'h-8 w-8',
					icon: '✓'
				};
			case 'under-review':
				return {
					headerColor: 'text-yellow-800',
					dotColor: 'bg-yellow-500',
					cardBg: 'bg-yellow-50',
					avatarBg: 'bg-yellow-500',
					avatarSize: 'h-8 w-8',
					icon: '🔄'
				};
			case 'rejected':
				return {
					headerColor: 'text-red-800',
					dotColor: 'bg-red-500',
					cardBg: 'bg-red-50',
					avatarBg: 'bg-red-500',
					avatarSize: 'h-8 w-8',
					icon: '❌'
				};
			case 'approved-training-required':
				return {
					headerColor: 'text-orange-800',
					dotColor: 'bg-orange-500',
					cardBg: 'bg-orange-50',
					avatarBg: 'bg-orange-500',
					avatarSize: 'h-8 w-8',
					icon: '📚'
				};
			case 'approved-training-failed':
				return {
					headerColor: 'text-red-800',
					dotColor: 'bg-red-500',
					cardBg: 'bg-red-50',
					avatarBg: 'bg-red-500',
					avatarSize: 'h-8 w-8',
					icon: '⚠️'
				};
			case 'approved-already-qualified':
				return {
					headerColor: 'text-green-800',
					dotColor: 'bg-green-500',
					cardBg: 'bg-green-50',
					avatarBg: 'bg-green-500',
					avatarSize: 'h-8 w-8',
					icon: '✅'
				};
			case 'approved-training-passed':
				return {
					headerColor: 'text-green-800',
					dotColor: 'bg-green-500',
					cardBg: 'bg-green-50',
					avatarBg: 'bg-green-500',
					avatarSize: 'h-8 w-8',
					icon: '🎓'
				};
			case 'pending':
				return {
					headerColor: 'text-gray-600',
					dotColor: 'bg-gray-400',
					cardBg: 'bg-gray-50',
					avatarBg: 'bg-gray-400',
					avatarSize: 'h-6 w-6',
					icon: '⏳'
				};
			case 'inactive':
				return {
					headerColor: 'text-gray-600',
					dotColor: 'bg-gray-400',
					cardBg: 'bg-gray-50',
					avatarBg: 'bg-gray-400',
					avatarSize: 'h-8 w-8',
					icon: '⏸️'
				};
			default:
				return {
					headerColor: 'text-gray-600',
					dotColor: 'bg-gray-400',
					cardBg: 'bg-gray-50',
					avatarBg: 'bg-gray-400',
					avatarSize: 'h-8 w-8',
					icon: '❓'
				};
		}
	};

	const styling = getStyling(type);
	const displayTitle = showCount ? `${title} (${assignments.length})` : title;
	const isCompact = type === 'pending';

	// Check if expert is ready for service delivery
	const isExpertReady = (assignment: ServiceAssignment) => {
		if (!assignment.trainingStatus) return false;
		return isActiveForService({ 
			status: assignment.status, 
			trainingStatus: assignment.trainingStatus 
		});
	};

	// Check if CV is paid (past payment stage)
	const isCVPaid = (assignment: ServiceAssignment) => {
		if (!assignment.expertCV) return false;
		const paidStatuses: CVStatus[] = ['paid', 'locked_for_review', 'unlocked_for_edits', 'locked_final'];
		return paidStatuses.includes(assignment.expertCV.status);
	};

	// Get integrated status message that combines CV and service assignment status
	const getIntegratedStatusMessage = (assignment: ServiceAssignment, journeyType: ExpertJourneyType) => {
		const serviceMessage = getJourneyStatusMessage(assignment, journeyType);
		const cvStatus = assignment.expertCV?.status;
		const isPaid = isCVPaid(assignment);
		
		// If CV is not paid, that's the primary blocker
		if (!isPaid) {
			const cvMessage = cvStatus ? getCVStatusDisplayName(cvStatus) : 'No CV';
			return `${cvMessage} - Payment Required`;
		}
		
		// If CV is paid, show service assignment status
		return serviceMessage;
	};

	// Get integrated status color based on primary blocker
	const getIntegratedStatusColor = (assignment: ServiceAssignment, journeyType: ExpertJourneyType) => {
		const isPaid = isCVPaid(assignment);
		
		// If CV is not paid, use CV status color
		if (!isPaid) {
			return assignment.expertCV ? getCVStatusColor(assignment.expertCV.status) : 'bg-gray-100 text-gray-800';
		}
		
		// If CV is paid, use service assignment color
		return getJourneyStatusColor(assignment, journeyType);
	};
</script>

{#if assignments.length > 0}
<div class="mb-4">
	<h5 class="text-sm font-semibold {styling.headerColor} mb-3 flex items-center">
		<span class="w-2 h-2 {styling.dotColor} rounded-full mr-2"></span>
		<span class="mr-2">{styling.icon}</span>
		{displayTitle}
	</h5>
	<div class="space-y-2">
		{#each assignments as assignment}
			<div class="flex items-center justify-between p-2 {styling.cardBg} rounded-md {isCompact ? 'text-xs' : ''}">
				<div class="flex items-center space-x-3">
					<div class="flex-shrink-0 {styling.avatarSize}">
						<div class="{styling.avatarSize} rounded-full {styling.avatarBg} flex items-center justify-center">
							<span class="text-white font-medium text-xs">
								{assignment.user?.firstName?.[0]}{assignment.user?.lastName?.[0]}
							</span>
						</div>
					</div>
					<div>
						{#if isCompact}
							<span class="text-gray-700">
								{assignment.user?.firstName} {assignment.user?.lastName}
								({assignment.role === 'lead' ? 'Lead' : 'Regular'})
							</span>
						{:else}
							<div class="text-sm font-medium text-gray-900">
								{assignment.user?.firstName} {assignment.user?.lastName}
							</div>
							<div class="text-xs text-gray-500">
								{assignment.role === 'lead' ? 'Lead Expert' : 'Regular Expert'}
							</div>
							{#if assignment.expertCV}
								<div class="text-xs text-gray-500 mt-1">
									CV v{assignment.expertCV.version}
								</div>
							{/if}
						{/if}
					</div>
				</div>
				<div class="flex flex-col items-end space-y-1">
					<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getIntegratedStatusColor(assignment, type)}">
						{getIntegratedStatusMessage(assignment, type)}
					</span>
					{#if assignment.expertCV && isCVPaid(assignment)}
						<span class="text-xs text-gray-500 flex items-center">
							💰 Paid CV
						</span>
					{:else if assignment.expertCV}
						<span class="text-xs text-gray-500 flex items-center">
							💳 Unpaid CV
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
{/if}
