<script lang="ts">
	import { goto } from '$app/navigation';
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';
	import TrainingCard from '$lib/components/shared/TrainingCard.svelte';

	interface TrainingQualificationEntry {
		qualificationName: string;
		trainingOrganisation: string;
		trainingContent: string;
		dateIssued: string;
		expireDate: string;
		description?: string;
	}

	interface Props {
		expertId: string;
		cvStatus: CVStatus;
		localCVData: { trainingQualifications?: TrainingQualificationEntry[] } | null;
		onRemoveTraining: (index: number) => void;
		onSave?: () => Promise<void>;
	}

	let { 
		expertId,
		cvStatus,
		localCVData,
		onRemoveTraining,
		onSave
	}: Props = $props();

	// Component handles its own read-only state based on CV status
	let readOnly = $derived(!canEditCVContent(cvStatus));

	// Navigate to new training page
	async function addNewTraining() {
		// Save any pending changes (e.g., deleted training) before navigating
		if (onSave) {
			try {
				await onSave();
			} catch (error) {
				console.error('Failed to save before navigation:', error);
				alert('Failed to save changes. Please try again.');
				return; // Don't navigate if save failed
			}
		}
		goto(`/experts/${expertId}/cv/new-training`);
	}

	// Navigate to edit training page
	async function editTraining(index: number) {
		// Save any pending changes before navigating
		if (onSave) {
			try {
				await onSave();
			} catch (error) {
				console.error('Failed to save before navigation:', error);
				alert('Failed to save changes. Please try again.');
				return; // Don't navigate if save failed
			}
		}
		goto(`/experts/${expertId}/cv/new-training?index=${index}`);
	}
</script>

<!-- Training Qualification Section -->
<div>
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-800">Training Qualification</h3>
			<p class="text-sm text-gray-500">
				{readOnly ? 'View training qualifications for this expert' : 'Add training qualifications for this expert'}
			</p>
		</div>
		{#if !readOnly}
			<button
				type="button"
				onclick={addNewTraining}
				class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Add Training Qualification
			</button>
		{/if}
	</div>

	{#if !localCVData?.trainingQualifications || localCVData.trainingQualifications.length === 0}
		<div class="text-center py-8">
			<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No training qualifications added yet</h3>
			<p class="text-gray-500 mb-4">
				{readOnly ? 'No training qualifications have been added for this expert' : 'Add training qualifications to help verify this expert\'s certifications'}
			</p>
			{#if !readOnly}
				<button
					type="button"
					onclick={addNewTraining}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Add First Training Qualification
				</button>
			{/if}
		</div>
	{:else}
		<div class="space-y-4">
			{#each localCVData.trainingQualifications as entry, index}
				<TrainingCard
					training={entry}
					showEditButton={!readOnly}
					onEdit={() => editTraining(index)}
					onRemove={() => onRemoveTraining(index)}
					{readOnly}
				/>
			{/each}
		</div>
	{/if}
</div>

