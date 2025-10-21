<script lang="ts">
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';
	import type { Id } from '$lib';

	interface ExperienceEntry {
		title: string;
		company: string;
		location: string;
		startDate: string;
		endDate: string;
		current: boolean;
		description: string;
	}

	interface EducationEntry {
		school: string;
		degree: string;
		field: string;
		startDate: string;
		endDate: string;
		description: string;
	}

	interface CVData {
		_id: Id<'expertCVs'>;
		experience: ExperienceEntry[];
		education: EducationEntry[];
	}

	interface ExpertCV {
		data: CVData | null;
	}

	interface Props {
		expertCV: ExpertCV;
		cvStatus: CVStatus;
		localCVData: CVData | null;
		isSaving: boolean;
		onSave: () => void;
		onResubmit: () => void;
		onAddExperience: () => void;
		onRemoveExperience: (index: number) => void;
		onUpdateExperience: (index: number, field: string, value: string | boolean) => void;
		onAddEducation: () => void;
		onRemoveEducation: (index: number) => void;
		onUpdateEducation: (index: number, field: string, value: string) => void;
	}

	let { 
		expertCV, 
		cvStatus,
		localCVData, 
		isSaving, 
		onSave, 
		onResubmit, 
		onAddExperience, 
		onRemoveExperience, 
		onUpdateExperience, 
		onAddEducation, 
		onRemoveEducation, 
		onUpdateEducation 
	}: Props = $props();

	// Component handles its own read-only state based on CV status
	let readOnly = $derived(!canEditCVContent(cvStatus));
</script>

<!-- CV Details Tab Content -->
<!-- Experience Section -->
<div class="mt-6">
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
					onclick={onAddExperience}
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
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
				</svg>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No experience added yet</h3>
				<p class="text-gray-500 mb-4">
					{readOnly ? 'No professional experience has been added for this expert' : 'Add professional experience to help verify this expert\'s qualifications'}
				</p>
				{#if !readOnly}
					<button
						type="button"
						onclick={onAddExperience}
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
			<div class="space-y-6">
				{#each localCVData.experience as entry, index}
					<div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
						<div class="flex items-center justify-between mb-4">
							<h4 class="text-md font-medium text-gray-900">Experience #{index + 1}</h4>
							{#if !readOnly}
								<button
									type="button"
									onclick={() => onRemoveExperience(index)}
									class="text-red-600 hover:text-red-800 transition-colors"
									title="Remove experience"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							{/if}
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
								<input
									type="text"
									value={entry.title}
									oninput={(e) => onUpdateExperience(index, 'title', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									placeholder="e.g., Senior Consultant"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Company *</label>
								<input
									type="text"
									value={entry.company}
									oninput={(e) => onUpdateExperience(index, 'company', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									placeholder="e.g., ABC Consulting"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
								<input
									type="text"
									value={entry.location}
									oninput={(e) => onUpdateExperience(index, 'location', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									placeholder="e.g., Amsterdam, Netherlands"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
								<input
									type="date"
									value={entry.startDate}
									oninput={(e) => onUpdateExperience(index, 'startDate', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
								<input
									type="date"
									value={entry.endDate}
									oninput={(e) => onUpdateExperience(index, 'endDate', e.currentTarget.value)}
									disabled={entry.current}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								/>
							</div>

							<div class="flex items-center">
								<input
									type="checkbox"
									checked={entry.current}
									disabled={readOnly}
									onchange={(e) => {
										if (!readOnly) {
											onUpdateExperience(index, 'current', e.currentTarget.checked);
											if (e.currentTarget.checked) {
												onUpdateExperience(index, 'endDate', '');
											}
										}
									}}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
								/>
								<label class="ml-2 block text-sm text-gray-700">Currently working here</label>
							</div>
						</div>

						<div class="mt-4">
							<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
							<textarea
								value={entry.description}
								oninput={(e) => onUpdateExperience(index, 'description', e.currentTarget.value)}
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
								placeholder="Describe the role and key responsibilities..."
							></textarea>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

<!-- Education Section -->
	<div class="mt-6">
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
								<label class="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
								<input
									type="text"
									value={entry.school}
									oninput={(e) => onUpdateEducation(index, 'school', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									placeholder="e.g., University of Amsterdam"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
								<input
									type="text"
									value={entry.degree}
									oninput={(e) => onUpdateEducation(index, 'degree', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									placeholder="e.g., Master of Science"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
								<input
									type="text"
									value={entry.field}
									oninput={(e) => onUpdateEducation(index, 'field', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									placeholder="e.g., Environmental Science"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
								<input
									type="date"
									value={entry.startDate}
									oninput={(e) => onUpdateEducation(index, 'startDate', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
								<input
									type="date"
									value={entry.endDate}
									oninput={(e) => onUpdateEducation(index, 'endDate', e.currentTarget.value)}
									disabled={readOnly}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								/>
							</div>
						</div>

						<div class="mt-4">
							<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
							<textarea
								value={entry.description}
								oninput={(e) => onUpdateEducation(index, 'description', e.currentTarget.value)}
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
								placeholder="Additional details about the education..."
							></textarea>
						</div>
					</div>
				{/each}
			</div>
	{/if}
	</div>

<div class="mt-6 flex gap-3">
	{#if !readOnly}
		<button onclick={onSave} disabled={isSaving} class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
			{isSaving ? 'Saving...' : 'Save CV'}
		</button>
		
		{#if cvStatus === 'unlocked_for_edits'}
			<button onclick={onResubmit} disabled={isSaving} class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
				{isSaving ? 'Submitting...' : 'Resubmit for Review'}
			</button>
		{/if}
	{:else}
		<div class="text-sm text-gray-500 italic">
			CV is locked and cannot be edited. Contact your administrator if changes are needed.
		</div>
	{/if}
</div>
