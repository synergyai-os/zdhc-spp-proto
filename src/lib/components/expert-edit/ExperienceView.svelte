<script lang="ts">
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';
	import { goto } from '$app/navigation';
	import ExperienceCard from '$lib/components/shared/ExperienceCard.svelte';

	interface FieldExperienceTypes {
		assessment: boolean;
		sampling: boolean;
		training: boolean;
	}

	interface FieldExperienceCounts {
		assessment: { total: number; last12m: number };
		sampling: { total: number; last12m: number };
		training: { total: number; last12m: number };
	}

	interface ExperienceEntry {
		title: string;
		company: string;
		location: string;
		startDate: string;
		endDate: string;
		current: boolean;
		description: string;
		fieldExperienceTypes?: FieldExperienceTypes;
		fieldExperienceCounts?: FieldExperienceCounts;
	}

	interface Props {
		expertId: string;
		cvStatus: CVStatus;
		localCVData: { experience?: ExperienceEntry[] } | null;
		onAddExperience: () => void;
		onRemoveExperience: (index: number) => void;
		onUpdateExperience: (index: number, field: string, value: string | boolean | number) => void;
		onSave?: () => Promise<void>;
	}

	let { 
		expertId,
		cvStatus,
		localCVData,
		onAddExperience, 
		onRemoveExperience, 
		onUpdateExperience,
		onSave
	}: Props = $props();

	// Component handles its own read-only state based on CV status
	let readOnly = $derived(!canEditCVContent(cvStatus));
	
	// Navigate to add new experience page
	async function addNewExperience() {
		// Save any pending changes (e.g., deleted experiences) before navigating
		if (onSave) {
			try {
				await onSave();
			} catch (error) {
				console.error('Failed to save before navigation:', error);
				alert('Failed to save changes. Please try again.');
				return; // Don't navigate if save failed
			}
		}
		goto(`/experts/${expertId}/cv/new-experience`);
	}
	
	// Navigate to edit experience page
	async function editExperience(index: number) {
		// Save any pending changes (e.g., deleted experiences) before navigating
		if (onSave) {
			try {
				await onSave();
			} catch (error) {
				console.error('Failed to save before navigation:', error);
				alert('Failed to save changes. Please try again.');
				return; // Don't navigate if save failed
			}
		}
		goto(`/experts/${expertId}/cv/new-experience?index=${index}`);
	}
</script>

<!-- Experience Section -->
<div>
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-800">Professional Experience</h3>
			<p class="text-sm text-gray-500">
				{readOnly ? 'View work experience for this expert' : 'Add relevant work experience for this expert'}
			</p>
		</div>
		{#if !readOnly}
			<button
				type="button"
				onclick={addNewExperience}
				class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Add Experience
			</button>
		{/if}
	</div>

	{#if !localCVData?.experience || localCVData.experience.length === 0}
		<div class="text-center py-8">
			<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No experience added yet</h3>
			<p class="text-gray-500 mb-4">
				{readOnly ? 'No professional experience has been added for this expert' : 'Add professional experience to help verify this expert\'s qualifications'}
			</p>
			{#if !readOnly}
				<button
					type="button"
					onclick={addNewExperience}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Add First Experience
				</button>
			{/if}
		</div>
	{:else}
		<div class="space-y-4">
			{#each localCVData.experience as entry, index}
				<ExperienceCard 
					experience={entry} 
					showEditButton={!readOnly}
					onEdit={() => editExperience(index)}
					onRemove={() => onRemoveExperience(index)}
					{readOnly}
				/>
			{/each}
		</div>
	{/if}
</div>
