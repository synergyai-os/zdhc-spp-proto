<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { CVStatus } from '../../../convex/model/status';
	import { canTransitionStatus } from '$lib/cvValidation';
	import { getCVStatusDisplayName } from '../../../convex/model/status';

	interface Props {
		cvStatus: CVStatus;
		cvId: string;
		onStageAdvanced?: () => void;
	}

	let { cvStatus, cvId, onStageAdvanced }: Props = $props();

	const client = useConvexClient();

	// State for confirmation dialog
	let showConfirmDialog = $state(false);
	let isAdvancing = $state(false);

	// Determine the next stage and if transition is possible
	const nextStage = $derived(() => {
		const transitions: Record<CVStatus, CVStatus | null> = {
			'draft': 'completed',
			'completed': 'payment_pending',
			'payment_pending': 'paid',
			'paid': 'locked_for_review',
			'locked_for_review': 'locked_final',
			'unlocked_for_edits': 'locked_for_review',
			'locked_final': null // Terminal state
		};
		return transitions[cvStatus] || null;
	});

	const canAdvance = $derived(() => {
		return nextStage() !== null && canTransitionStatus(cvStatus, nextStage()!);
	});

	const handleAdvanceClick = (e: Event) => {
		e.stopPropagation();
		e.preventDefault(); // Additional protection against default behavior
		if (canAdvance()) {
			showConfirmDialog = true;
		}
	};

	const confirmAdvance = async () => {
		if (!nextStage() || isAdvancing) return;

		isAdvancing = true;
		try {
			await client.mutation(api.expert.updateCVStatus, {
				cvId: cvId as any,
				newStatus: nextStage()!
			});

			// Call callback if provided
			if (onStageAdvanced) {
				onStageAdvanced();
			}

			showConfirmDialog = false;
		} catch (error) {
			console.error('Error advancing CV stage:', error);
			alert(`Failed to advance CV stage: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			isAdvancing = false;
		}
	};

	const cancelAdvance = () => {
		showConfirmDialog = false;
	};
</script>

{#if canAdvance()}
	<button
		type="button"
		onclick={(e) => handleAdvanceClick(e)}
		disabled={isAdvancing}
		class="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
		title="Advance to next stage: {getCVStatusDisplayName(nextStage()!)}"
	>
		{#if isAdvancing}
			<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
		{:else}
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
			</svg>
		{/if}
	</button>
{/if}

<!-- Confirmation Dialog -->
{#if showConfirmDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<div class="flex items-center mb-4">
				<div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
					<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900">Advance CV Stage</h3>
			</div>
			
			<div class="mb-6">
				<p class="text-sm text-gray-600 mb-3">
					Are you sure you want to advance this CV to the next stage?
				</p>
				<div class="bg-gray-50 rounded-lg p-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">Current:</span>
						<span class="text-sm text-gray-600">{getCVStatusDisplayName(cvStatus)}</span>
					</div>
					<div class="flex items-center justify-between mt-1">
						<span class="text-sm font-medium text-gray-700">Next:</span>
						<span class="text-sm font-semibold text-blue-600">{getCVStatusDisplayName(nextStage()!)}</span>
					</div>
				</div>
			</div>

			<div class="flex justify-end space-x-3">
				<button
					type="button"
					onclick={cancelAdvance}
					disabled={isAdvancing}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmAdvance}
					disabled={isAdvancing}
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isAdvancing}
						<svg class="w-4 h-4 mr-2 animate-spin inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
					{/if}
					Advance Stage
				</button>
			</div>
		</div>
	</div>
{/if}
