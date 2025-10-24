<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { 
		getTrainingStatusDisplayName,
		getTrainingStatusColor,
		type TrainingStatus 
	} from '../../../convex/model/status';

	interface Props {
		assignmentId: string;
		currentTrainingStatus?: TrainingStatus;
		onTrainingStatusUpdated?: () => void;
	}

	let { assignmentId, currentTrainingStatus, onTrainingStatusUpdated }: Props = $props();

	const convex = useConvexClient();

	const sendTrainingInvitation = async (args: any) => {
		return await convex.mutation(api.expert.sendTrainingInvitation, args);
	};
	const startTraining = async (args: any) => {
		return await convex.mutation(api.expert.startTraining, args);
	};
	const completeTraining = async (args: any) => {
		return await convex.mutation(api.expert.completeTraining, args);
	};

	let isProcessing = $state(false);
	let errorMessage = $state('');
	let showModal = $state(false);

	const handleAction = async (action: string) => {
		if (isProcessing) return;
		
		isProcessing = true;
		errorMessage = '';

		try {
			switch (action) {
				case 'invite':
					await sendTrainingInvitation({ 
						assignmentId, 
						invitedBy: 'Admin' 
					});
					break;
				case 'start':
					await startTraining({ assignmentId });
					break;
				case 'pass':
					await completeTraining({ 
						assignmentId, 
						passed: true,
						completedBy: 'Admin Override'
					});
					break;
				case 'fail':
					await completeTraining({ 
						assignmentId, 
						passed: false,
						completedBy: 'Admin Override'
					});
					break;
			}

			if (onTrainingStatusUpdated) {
				onTrainingStatusUpdated();
			}
			
			// Close modal after successful action
			showModal = false;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		} finally {
			isProcessing = false;
		}
	};

	// Determine which actions are available based on current status
	const getAvailableActions = () => {
		if (!currentTrainingStatus) return [];
		
		switch (currentTrainingStatus) {
			case 'required':
				return [{ action: 'invite', label: 'Send Invitation', color: 'blue' }];
			case 'invited':
				return [{ action: 'start', label: 'Start Training', color: 'green' }];
			case 'in_progress':
				return [
					{ action: 'pass', label: 'Mark Passed', color: 'green' },
					{ action: 'fail', label: 'Mark Failed', color: 'red' }
				];
			case 'failed':
				return [{ action: 'start', label: 'Retry Training', color: 'blue' }];
			default:
				return [];
		}
	};

	const availableActions = $derived(getAvailableActions());
</script>

<!-- Graduation Hat Icon Button -->
<button
	onclick={() => showModal = true}
	class="p-1 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
	title="Manage expert training status and academy invitations"
>
	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
	</svg>
</button>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
		 onclick={() => showModal = false}
		 onkeydown={(e) => e.key === 'Escape' && (showModal = false)}
		 role="dialog"
		 aria-modal="true"
		 aria-labelledby="modal-title"
		 tabindex="-1">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" onclick={(e) => e.stopPropagation()}>
			<!-- Modal Header -->
			<div class="flex items-center justify-between mb-4">
				<h3 id="modal-title" class="text-lg font-semibold text-gray-900 flex items-center">
					<svg class="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
					</svg>
					Academy Training Controls
				</h3>
				<button 
					onclick={() => showModal = false}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Close modal"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Training Status Display -->
			{#if currentTrainingStatus}
				<div class="mb-4 p-3 bg-gray-50 rounded-lg">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">Current Status:</span>
						<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getTrainingStatusColor(currentTrainingStatus)}">
							{getTrainingStatusDisplayName(currentTrainingStatus)}
						</span>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			{#if availableActions.length > 0}
				<div class="space-y-2">
					{#each availableActions as actionItem}
						<button
							onclick={() => handleAction(actionItem.action)}
							disabled={isProcessing}
							class="w-full px-4 py-2 text-sm font-medium rounded border transition-colors
								{actionItem.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : ''}
								{actionItem.color === 'green' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}
								{actionItem.color === 'red' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : ''}
								disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{actionItem.label}
						</button>
					{/each}
				</div>
			{:else}
				<div class="text-center text-gray-500 py-4">
					No training actions available
				</div>
			{/if}

			<!-- Error Message -->
			{#if errorMessage}
				<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
					{errorMessage}
				</div>
			{/if}

			<!-- Processing Indicator -->
			{#if isProcessing}
				<div class="mt-4 flex items-center justify-center">
					<svg class="animate-spin w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span class="ml-2 text-sm text-gray-600">Processing...</span>
				</div>
			{/if}

			<!-- Modal Footer -->
			<div class="mt-6 flex justify-end">
				<button 
					onclick={() => showModal = false}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
