<script lang="ts">
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';

	interface EducationEntry {
		school: string;
		degree: string;
		field: string;
		startDate: string;
		endDate: string;
		description: string;
	}

	interface Props {
		cvStatus: CVStatus;
		localCVData: { education?: EducationEntry[] } | null;
		onAddEducation: () => void;
		onRemoveEducation: (index: number) => void;
		onUpdateEducation: (index: number, field: string, value: string) => void;
	}

	let { 
		cvStatus,
		localCVData,
		onAddEducation, 
		onRemoveEducation, 
		onUpdateEducation
	}: Props = $props();

	// Component handles its own read-only state based on CV status
	let readOnly = $derived(!canEditCVContent(cvStatus));
</script>

<!-- Education Section -->
<div>
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-800">Education</h3>
			<p class="text-sm text-gray-500">
				{readOnly ? 'View educational background for this expert' : 'Add educational background for this expert'}
			</p>
		</div>
		{#if !readOnly}
			<button
				type="button"
				onclick={onAddEducation}
				class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Add Education
			</button>
		{/if}
	</div>

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
				<button
					type="button"
					onclick={onAddEducation}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Add First Education
				</button>
			{/if}
		</div>
	{:else}
		<div class="space-y-6">
			{#each localCVData.education as entry, index}
				<div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
					<div class="flex items-center justify-between mb-4">
						<h4 class="text-md font-medium text-gray-900">Education #{index + 1}</h4>
						{#if !readOnly}
							<button
								type="button"
								onclick={() => onRemoveEducation(index)}
								class="text-red-600 hover:text-red-800 transition-colors"
								title="Remove education"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						{/if}
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="edu-school-{index}" class="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
							<input
								id="edu-school-{index}"
								type="text"
								value={entry.school}
								oninput={(e) => onUpdateEducation(index, 'school', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., University of Amsterdam"
							/>
						</div>

						<div>
							<label for="edu-degree-{index}" class="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
							<input
								id="edu-degree-{index}"
								type="text"
								value={entry.degree}
								oninput={(e) => onUpdateEducation(index, 'degree', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., Master of Science"
							/>
						</div>

						<div>
							<label for="edu-field-{index}" class="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
							<input
								id="edu-field-{index}"
								type="text"
								value={entry.field}
								oninput={(e) => onUpdateEducation(index, 'field', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., Environmental Science"
							/>
						</div>

						<div>
							<label for="edu-start-{index}" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
							<input
								id="edu-start-{index}"
								type="date"
								value={entry.startDate}
								oninput={(e) => onUpdateEducation(index, 'startDate', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>

						<div>
							<label for="edu-end-{index}" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
							<input
								id="edu-end-{index}"
								type="date"
								value={entry.endDate}
								oninput={(e) => onUpdateEducation(index, 'endDate', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>
					</div>

					<div class="mt-4">
						<label for="edu-desc-{index}" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
						<textarea
							id="edu-desc-{index}"
							value={entry.description}
							oninput={(e) => onUpdateEducation(index, 'description', e.currentTarget.value)}
							rows="3"
							disabled={readOnly}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							placeholder="Additional details about the education..."
						></textarea>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

