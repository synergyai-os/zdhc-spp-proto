<script lang="ts">
	import type { ServiceStatus, ExpertRole } from '../../../convex/model/status';
	import { getExpertRoleColor, getExpertRoleDisplayName, getServiceStatusColor, getServiceStatusDisplayName } from '../../../convex/model/status';
	
	interface ServiceAssignment {
		_id: string;
		status: ServiceStatus;
		role: ExpertRole;
		organization: {
			name: string;
		};
		serviceVersion: {
			_id: string;
			name: string;
			version: string;
		};
		serviceParent: {
			name: string;
		};
		createdAt: number;
		reviewedAt?: number;
		approvedAt?: number;
		rejectedAt?: number;
		approvedBy?: string;
		rejectedBy?: string;
		rejectionReason?: string;
		reviewNotes?: string;
	}

	interface Props {
		assignment: ServiceAssignment;
		formatDate: (timestamp: number) => string;
		canToggleStatus: (assignment: ServiceAssignment) => boolean;
		onApprove: (assignment: ServiceAssignment) => void;
		onReject: (assignment: ServiceAssignment) => void;
		getActionButtonFeedback: () => string;
	}

	let { assignment, formatDate, canToggleStatus, onApprove, onReject, getActionButtonFeedback }: Props = $props();
</script>

<div class="border rounded-lg p-4 {assignment.status === 'pending_review' ? 'border-yellow-200 bg-yellow-50' : assignment.status === 'approved' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
	<div class="flex justify-between items-start">
		<div class="flex-1">
			<div class="flex items-center space-x-2 mb-1">
				<h4 class="font-semibold text-gray-900">{assignment.serviceVersion.name}</h4>
				<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getExpertRoleColor(assignment.role)}">
					{getExpertRoleDisplayName(assignment.role)}
				</span>
				<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getServiceStatusColor(assignment.status)}">
					{getServiceStatusDisplayName(assignment.status)}
				</span>
			</div>
			<p class="text-sm text-gray-600">{assignment.serviceParent.name} • {assignment.serviceVersion.version}</p>
			<div class="flex items-center space-x-2 mt-2">
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
			
			<!-- Action Buttons (only show if CV is not locked) -->
			{#if canToggleStatus(assignment)}
				{#if assignment.status === 'pending_review'}
					<button
						type="button"
						onclick={() => onApprove(assignment)}
						class="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
					>
						Approve
					</button>
					<button
						type="button"
						onclick={() => onReject(assignment)}
						class="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
					>
						Reject
					</button>
				{:else if assignment.status === 'approved'}
					<button
						type="button"
						onclick={() => onReject(assignment)}
						class="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
					>
						Change to Reject
					</button>
				{:else if assignment.status === 'rejected'}
					<button
						type="button"
						onclick={() => onApprove(assignment)}
						class="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
					>
						Change to Approve
					</button>
			{/if}
		{:else}
			<span class="text-xs text-gray-500 italic">{getActionButtonFeedback()}</span>
		{/if}
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

