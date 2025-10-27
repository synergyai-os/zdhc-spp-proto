<script lang="ts">
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';

	interface TrainingQualificationEntry {
		qualificationName: string;
		trainingOrganisation: string;
		trainingContent: string;
		dateIssued: string;
		expireDate: string;
		description: string;
	}

	interface Props {
		cvStatus: CVStatus;
		localCVData: { trainingQualifications?: TrainingQualificationEntry[] } | null;
		onAddTraining: () => void;
		onRemoveTraining: (index: number) => void;
		onUpdateTraining: (index: number, field: string, value: string) => void;
	}

	let { 
		cvStatus,
		localCVData,
		onAddTraining, 
		onRemoveTraining, 
		onUpdateTraining
	}: Props = $props();

	// Component handles its own read-only state based on CV status
	let readOnly = $derived(!canEditCVContent(cvStatus));
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
				onclick={onAddTraining}
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
					onclick={onAddTraining}
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
		<div class="space-y-6">
			{#each localCVData.trainingQualifications as entry, index}
				<div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
					<div class="flex items-center justify-between mb-4">
						<h4 class="text-md font-medium text-gray-900">Training Qualification #{index + 1}</h4>
						{#if !readOnly}
							<button
								type="button"
								onclick={() => onRemoveTraining(index)}
								class="text-red-600 hover:text-red-800 transition-colors"
								title="Remove training qualification"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						{/if}
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="md:col-span-2">
							<label for="train-qual-name-{index}" class="block text-sm font-medium text-gray-700 mb-1">Qualification Name *</label>
							<input
								id="train-qual-name-{index}"
								type="text"
								value={entry.qualificationName}
								oninput={(e) => onUpdateTraining(index, 'qualificationName', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., ISO 14001 Environmental Management"
							/>
						</div>

						<div class="md:col-span-2">
							<label for="train-org-{index}" class="block text-sm font-medium text-gray-700 mb-1">Training Organisation *</label>
							<input
								id="train-org-{index}"
								type="text"
								value={entry.trainingOrganisation}
								oninput={(e) => onUpdateTraining(index, 'trainingOrganisation', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., Bureau Veritas"
							/>
						</div>

						<div class="md:col-span-2">
							<label for="train-content-{index}" class="block text-sm font-medium text-gray-700 mb-1">Training Content *</label>
							<textarea
								id="train-content-{index}"
								value={entry.trainingContent}
								oninput={(e) => onUpdateTraining(index, 'trainingContent', e.currentTarget.value)}
								rows="3"
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="Describe the training content, topics covered, and learning objectives..."
							></textarea>
						</div>

						<div>
							<label for="train-date-issued-{index}" class="block text-sm font-medium text-gray-700 mb-1">Date Issued *</label>
							<input
								id="train-date-issued-{index}"
								type="date"
								value={entry.dateIssued}
								oninput={(e) => onUpdateTraining(index, 'dateIssued', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>

						<div>
							<label for="train-expire-{index}" class="block text-sm font-medium text-gray-700 mb-1">Expire Date</label>
							<input
								id="train-expire-{index}"
								type="date"
								value={entry.expireDate}
								oninput={(e) => onUpdateTraining(index, 'expireDate', e.currentTarget.value)}
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>

						<div class="md:col-span-2">
							<label for="train-desc-{index}" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
							<textarea
								id="train-desc-{index}"
								value={entry.description}
								oninput={(e) => onUpdateTraining(index, 'description', e.currentTarget.value)}
								rows="2"
								disabled={readOnly}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="Additional details about the training qualification..."
							></textarea>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

