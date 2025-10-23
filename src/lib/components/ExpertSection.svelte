<script lang="ts">
	import { getServiceStatusColor, getServiceStatusDisplayName } from '../../convex/model/status';
	import type { Id } from '$lib';

	interface ServiceAssignment {
		_id: Id<'expertServiceAssignments'>;
		role: 'lead' | 'regular';
		status: 'pending_review' | 'approved' | 'rejected' | 'inactive';
		user?: {
			firstName?: string;
			lastName?: string;
		};
	}

	interface Props {
		assignments: ServiceAssignment[];
		type: 'qualified-lead' | 'regular' | 'pending' | 'inactive';
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
					avatarSize: 'h-8 w-8'
				};
			case 'regular':
				return {
					headerColor: 'text-blue-800',
					dotColor: 'bg-blue-500',
					cardBg: 'bg-blue-50',
					avatarBg: 'bg-blue-500',
					avatarSize: 'h-8 w-8'
				};
			case 'pending':
				return {
					headerColor: 'text-gray-600',
					dotColor: 'bg-gray-400',
					cardBg: 'bg-gray-50',
					avatarBg: 'bg-gray-400',
					avatarSize: 'h-6 w-6'
				};
			case 'inactive':
				return {
					headerColor: 'text-gray-600',
					dotColor: 'bg-gray-400',
					cardBg: 'bg-gray-50',
					avatarBg: 'bg-gray-400',
					avatarSize: 'h-8 w-8'
				};
			default:
				return {
					headerColor: 'text-gray-600',
					dotColor: 'bg-gray-400',
					cardBg: 'bg-gray-50',
					avatarBg: 'bg-gray-400',
					avatarSize: 'h-8 w-8'
				};
		}
	};

	const styling = getStyling(type);
	const displayTitle = showCount ? `${title} (${assignments.length})` : title;
	const isCompact = type === 'pending';
</script>

{#if assignments.length > 0}
<div class="mb-4">
	<h5 class="text-sm font-semibold {styling.headerColor} mb-3 flex items-center">
		<span class="w-2 h-2 {styling.dotColor} rounded-full mr-2"></span>
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
						{/if}
					</div>
				</div>
				<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getServiceStatusColor(assignment.status)}">
					{getServiceStatusDisplayName(assignment.status)}
				</span>
			</div>
		{/each}
	</div>
</div>
{/if}
