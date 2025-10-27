<script lang="ts">
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';

	interface ExperienceEntry {
		title: string;
		company: string;
		location: string;
		startDate: string;
		endDate: string;
		current: boolean;
		onSiteAuditsCompleted: number;
		description: string;
	}

	interface Props {
		cvStatus: CVStatus;
		localCVData: { experience?: ExperienceEntry[] } | null;
		onAddExperience: () => void;
		onRemoveExperience: (index: number) => void;
		onUpdateExperience: (index: number, field: string, value: string | boolean | number) => void;
	}

	let { 
		cvStatus,
		localCVData,
		onAddExperience, 
		onRemoveExperience, 
		onUpdateExperience
	}: Props = $props();

	// Component handles its own read-only state based on CV status
	let readOnly = $derived(!canEditCVContent(cvStatus));
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
							<label for="exp-title-{index}" class="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
							<input
								id="exp-title-{index}"
								type="text"
								value={entry.title}
								oninput={(e) => onUpdateExperience(index, 'title', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., Senior Consultant"
							/>
						</div>

						<div>
							<label for="exp-company-{index}" class="block text-sm font-medium text-gray-700 mb-1">Company *</label>
							<input
								id="exp-company-{index}"
								type="text"
								value={entry.company}
								oninput={(e) => onUpdateExperience(index, 'company', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., ABC Consulting"
							/>
						</div>

						<div>
							<label for="exp-location-{index}" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
							<input
								id="exp-location-{index}"
								type="text"
								value={entry.location}
								oninput={(e) => onUpdateExperience(index, 'location', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., Amsterdam, Netherlands"
							/>
						</div>

						<div>
							<label for="exp-start-{index}" class="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
							<input
								id="exp-start-{index}"
								type="date"
								value={entry.startDate}
								oninput={(e) => onUpdateExperience(index, 'startDate', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>

						<div>
							<label for="exp-end-{index}" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
							<input
								id="exp-end-{index}"
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

						<div>
							<label for="exp-audits-{index}" class="block text-sm font-medium text-gray-700 mb-1">On-site Audits Completed</label>
							<input
								id="exp-audits-{index}"
								type="number"
								min="0"
								value={entry.onSiteAuditsCompleted || 0}
								oninput={(e) => onUpdateExperience(index, 'onSiteAuditsCompleted', parseInt(e.currentTarget.value) || 0)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="0"
							/>
						</div>
					</div>

					<div class="mt-4">
						<label for="exp-desc-{index}" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
						<textarea
							id="exp-desc-{index}"
							value={entry.description}
							oninput={(e) => onUpdateExperience(index, 'description', e.currentTarget.value)}
							rows="3"
							disabled={readOnly}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							placeholder="Describe the role and key responsibilities..."
						></textarea>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

