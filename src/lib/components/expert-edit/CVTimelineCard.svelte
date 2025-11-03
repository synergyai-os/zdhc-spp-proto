<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { formatDate } from '$lib/utils/date';
	import { getCVStatusDisplayName, getCVStatusColor, type CVStatus } from '../../../convex/model/status';

	// Helper function to calculate and format duration between timestamps
	function formatDurationDays(earlierTimestamp: number, laterTimestamp: number): string {
		const diffMs = laterTimestamp - earlierTimestamp;
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) {
			const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
			if (diffHours === 0) {
				const diffMinutes = Math.floor(diffMs / (1000 * 60));
				return diffMinutes <= 1 ? 'less than a minute' : `${diffMinutes} minutes`;
			}
			return diffHours === 1 ? '1 hour' : `${diffHours} hours`;
		}
		
		return diffDays === 1 ? '1 day' : `${diffDays} days`;
	}

	interface Props {
		userId: Id<'users'>;
		organizationId: Id<'organizations'>;
	}

	let { userId, organizationId }: Props = $props();

	// Query CV history
	const cvHistory = useQuery(api.expertCVs.getExpertCVHistory, () => ({
		userId,
		organizationId
	}));

	// Query all service assignments for this user and organization
	const serviceAssignments = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => ({
		userId,
		organizationId
	}));

	// Build timeline events from CV history and service assignments
	type TimelineEvent = {
		timestamp: number;
		event: string;
		description: string;
		cvVersion?: number;
		eventType: 'cv_created' | 'cv_submitted' | 'payment' | 'cv_locked' | 'service_approved' | 'service_rejected';
		status?: CVStatus;
		serviceName?: string;
	};

	type TimelineGroup = {
		cvVersion: number;
		status: CVStatus;
		events: TimelineEvent[];
		startTimestamp: number;
	};

	const timelineGroups = $derived.by(() => {
		try {
			if (!cvHistory?.data || !Array.isArray(cvHistory.data)) return [];

			const events: TimelineEvent[] = [];

		// Process each CV to extract timeline events
		cvHistory.data.forEach((cv: any) => {
			if (!cv || !cv.version || !cv.createdAt) return; // Skip invalid CVs

			const cvVersion = cv.version;

			// CV creation event
			if (cv.createdAt) {
				const status = (cv.status as CVStatus) || 'draft';
				events.push({
					timestamp: cv.createdAt,
					event: 'CV Created',
					description: `CV version ${cvVersion} created with status: ${getCVStatusDisplayName(status)}`,
					cvVersion: cvVersion,
					eventType: 'cv_created',
					status: status
				});
			}

			// Submission event
			if (cv.submittedAt && cv.submittedAt !== cv.createdAt) {
				events.push({
					timestamp: cv.submittedAt,
					event: 'CV Submitted',
					description: `CV version ${cvVersion} submitted for review`,
					cvVersion: cvVersion,
					eventType: 'cv_submitted'
				});
			}

			// Payment event
			if (cv.paidAt) {
				events.push({
					timestamp: cv.paidAt,
					event: 'Payment Completed',
					description: `Payment confirmed for CV version ${cvVersion}`,
					cvVersion: cvVersion,
					eventType: 'payment'
				});
			}

			// Locked/finalized event
			if (cv.lockedAt) {
				const status = (cv.status as CVStatus) || 'draft';
				const isFinal = status === 'locked_final';
				events.push({
					timestamp: cv.lockedAt,
					event: isFinal ? 'CV Finalized' : 'CV Locked',
					description: `CV version ${cvVersion} ${isFinal ? 'finalized and approved' : 'locked for review'}`,
					cvVersion: cvVersion,
					eventType: 'cv_locked',
					status: status
				});
			}
		});

		// Add service approval/rejection events from assignments
		if (serviceAssignments?.data) {
			serviceAssignments.data.forEach((assignment: any) => {
				const cv = assignment.expertCV;
				const serviceName = assignment.serviceVersion?.name || 'Unknown Service';

				// Service approved event
				if (assignment.approvedAt) {
					events.push({
						timestamp: assignment.approvedAt,
						event: 'Service Approved',
						description: `${serviceName} approved`,
						cvVersion: cv?.version,
						eventType: 'service_approved',
						serviceName: serviceName
					});
				}

				// Service rejected event
				if (assignment.rejectedAt) {
					events.push({
						timestamp: assignment.rejectedAt,
						event: 'Service Rejected',
						description: `${serviceName} rejected`,
						cvVersion: cv?.version,
						eventType: 'service_rejected',
						serviceName: serviceName
					});
				}
			});
		}

		// Sort all events by timestamp descending (latest first)
		const sortedEvents = events.sort((a, b) => b.timestamp - a.timestamp);

		// Group events by CV version
		const groups = new Map<number, TimelineGroup>();

		cvHistory.data.forEach((cv: any) => {
			if (!cv || !cv.version) return; // Skip invalid CVs
			
			const versionEvents = sortedEvents.filter(e => e.cvVersion === cv.version);
			if (versionEvents.length > 0) {
				const status = (cv.status as CVStatus) || 'draft';
				groups.set(cv.version, {
					cvVersion: cv.version,
					status: status,
					events: versionEvents.sort((a, b) => b.timestamp - a.timestamp),
					startTimestamp: Math.max(...versionEvents.map(e => e.timestamp))
				});
			}
		});

		// Convert to array and sort by most recent first
		return Array.from(groups.values()).sort((a, b) => b.startTimestamp - a.startTimestamp);
		} catch (error) {
			console.error('Error building timeline:', error);
			return [];
		}
	});
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
		<svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
		</svg>
		CV History Timeline
	</h2>

	{#if cvHistory?.isLoading || serviceAssignments?.isLoading}
		<div class="text-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p class="text-sm text-gray-600">Loading CV history...</p>
		</div>
	{:else if cvHistory?.error || serviceAssignments?.error}
		<div class="text-center py-8">
			<p class="text-sm text-red-600">Error loading CV history</p>
		</div>
	{:else if timelineGroups.length === 0}
		<div class="text-center py-8">
			<p class="text-sm text-gray-600">No CV history available</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each timelineGroups as group, groupIndex}
				<div class="space-y-4">
					<!-- CV Version Header -->
					<div class="flex items-center space-x-3 pb-2 border-b border-gray-200">
						<div class="flex items-center space-x-2">
							<span class="text-sm font-semibold text-gray-900">CV Version {group.cvVersion}</span>
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getCVStatusColor(group.status)}">
								{getCVStatusDisplayName(group.status)}
							</span>
						</div>
					</div>

					<!-- Events for this CV version -->
					<div class="relative pl-4 border-l-2 {groupIndex === 0 ? 'border-blue-300' : 'border-gray-200'}">
						{#each group.events as event, eventIndex}
							{@const dotColor = event.eventType === 'cv_created' || event.eventType === 'cv_locked' 
								? 'bg-blue-600' 
								: event.eventType === 'service_approved' 
								? 'bg-green-600'
								: event.eventType === 'service_rejected'
								? 'bg-red-600'
								: event.eventType === 'payment'
								? 'bg-purple-600'
								: 'bg-gray-400'}
							{@const icon = event.eventType === 'cv_created' 
								? '📝'
								: event.eventType === 'service_approved'
								? '✅'
								: event.eventType === 'service_rejected'
								? '❌'
								: event.eventType === 'payment'
								? '💳'
								: event.eventType === 'cv_locked'
								? '🔒'
								: '📤'}
							{@const nextEvent = eventIndex < group.events.length - 1 ? group.events[eventIndex + 1] : null}
							{@const durationText = nextEvent ? formatDurationDays(nextEvent.timestamp, event.timestamp) : null}
							<div class="relative pb-4 last:pb-0">
								<!-- Timeline dot with color coding -->
								<div class="absolute -left-[9px] top-1 w-3 h-3 rounded-full border-2 border-white {dotColor}"></div>
								
								<!-- Event content -->
								<div class="pl-4">
									<div class="flex items-start justify-between mb-1">
										<div class="flex-1">
											<div class="flex items-center space-x-2">
												<span class="text-sm">{icon}</span>
												<p class="text-sm font-medium text-gray-900">{event.event}</p>
											</div>
											<p class="text-xs text-gray-600 mt-1">{event.description}</p>
										</div>
									</div>
									<p class="text-xs text-gray-500 mt-1">
										{formatDate(event.timestamp)}
									</p>
									{#if durationText}
										<p class="text-[10px] text-gray-400 mt-1 italic">
											{durationText} later
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

