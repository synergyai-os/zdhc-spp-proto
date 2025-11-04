<script lang="ts">
	import { goto } from '$app/navigation';
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';
	import EducationCard from '$lib/components/shared/EducationCard.svelte';

	interface EducationEntry {
		school: string;
		degree: string;
		field: string;
		startDate: string;
		endDate: string;
		description?: string;
	}

	interface Props {
		expertId: string;
		cvStatus: CVStatus;
		localCVData: { education?: EducationEntry[] } | null;
		onRemoveEducation: (index: number) => void;
		onSave?: () => Promise<void>;
		headerAction?: any;
		onImportFromPreviousCV?: () => void;
		hasPreviousCV?: boolean;
		previousCVOrgName?: string;
	}

	let { 
		expertId,
		cvStatus,
		localCVData,
		onRemoveEducation,
		onSave,
		headerAction,
		onImportFromPreviousCV,
		hasPreviousCV = false,
		previousCVOrgName
	}: Props = $props();

	// Component handles its own read-only state based on CV status
	let readOnly = $derived(!canEditCVContent(cvStatus));

	// Navigate to new education page
	async function addNewEducation() {
		// Save any pending changes (e.g., deleted education) before navigating
		if (onSave) {
			try {
				await onSave();
			} catch (error) {
				console.error('Failed to save before navigation:', error);
				alert('Failed to save changes. Please try again.');
				return; // Don't navigate if save failed
			}
		}
		goto(`/experts/${expertId}/cv/new-education`);
	}

	// Navigate to edit education page
	async function editEducation(index: number) {
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
		goto(`/experts/${expertId}/cv/new-education?index=${index}`);
	}
</script>

<!-- Education Section -->
<div>
	<div class="mb-6">
		<div class="flex items-center justify-between mb-2">
			<div>
				<h3 class="text-lg font-semibold text-gray-800">Education</h3>
				<p class="text-sm text-gray-500">
					{readOnly ? 'View educational background for this expert' : 'Add educational background for this expert'}
				</p>
			</div>
			{#if !readOnly}
				<button
					type="button"
					onclick={addNewEducation}
					class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Add Education
				</button>
			{/if}
		</div>
		{#if !readOnly && hasPreviousCV && localCVData?.education && localCVData.education.length > 0}
			<button
				type="button"
				onclick={onImportFromPreviousCV}
				class="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
				</svg>
				Import from Previous CV
			</button>
		{/if}
	</div>

	{#if headerAction}
		{@render headerAction()}
	{/if}

	{#if !localCVData?.education || localCVData.education.length === 0}
		<div class="text-center py-8">
			<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.083 12.083 0 01.665-6.479L12 14z" />
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No education added yet</h3>
			<p class="text-gray-500 mb-4">
				{readOnly ? 'No educational background has been added for this expert' : 'Add educational background to help verify this expert\'s qualifications'}
			</p>
			{#if !readOnly}
				<div class="flex items-center justify-center gap-3">
					{#if hasPreviousCV && onImportFromPreviousCV}
						<button
							type="button"
							onclick={onImportFromPreviousCV}
							class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							Import from Previous CV
						</button>
					{/if}
					<button
						type="button"
						onclick={addNewEducation}
						class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Add Education
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="space-y-4">
			{#each localCVData.education as entry, index}
				<EducationCard
					education={entry}
					showEditButton={!readOnly}
					onEdit={() => editEducation(index)}
					onRemove={() => onRemoveEducation(index)}
					{readOnly}
				/>
			{/each}
		</div>
	{/if}
</div>

