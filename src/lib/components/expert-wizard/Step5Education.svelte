<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	interface EducationEntry {
		school: string;
		degree: string;
		field: string;
		startDate: string;
		endDate: string;
		description: string;
	}

	interface Props {
		education: EducationEntry[];
	}

	let { education }: Props = $props();

	function addEducation() {
		const newEducation = {
			school: '',
			degree: '',
			field: '',
			startDate: '',
			endDate: '',
			description: ''
		};
		dispatch('updateEducation', [...education, newEducation]);
	}

	function removeEducation(index: number) {
		const updatedEducation = education.filter((_, i) => i !== index);
		dispatch('updateEducation', updatedEducation);
	}

	function updateEducation(index: number, field: keyof EducationEntry, value: any) {
		const updatedEducation = [...education];
		updatedEducation[index] = { ...updatedEducation[index], [field]: value };
		dispatch('updateEducation', updatedEducation);
	}
</script>

<div class="education-step">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-medium text-gray-900">Education</h3>
			<p class="text-sm text-gray-500">Add educational background for this expert</p>
		</div>
		<button
			type="button"
			onclick={addEducation}
			class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
		>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 6v6m0 0v6m0-6h6m-6 0H6"
				/>
			</svg>
			Add Education
		</button>
	</div>

	{#if education.length === 0}
		<div class="text-center py-8">
			<svg
				class="w-12 h-12 text-gray-300 mx-auto mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 14l9-5-9-5-9 5 9 5z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
				/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No education added yet</h3>
			<p class="text-gray-500 mb-4">
				Add educational background to help verify this expert's qualifications
			</p>
			<button
				type="button"
				onclick={addEducation}
				class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				Add First Education
			</button>
		</div>
	{:else}
		<div class="space-y-6">
			{#each education as entry, index}
				<div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
					<div class="flex items-center justify-between mb-4">
						<h4 class="text-md font-medium text-gray-900">Education #{index + 1}</h4>
						<button
							type="button"
							onclick={() => removeEducation(index)}
							class="text-red-600 hover:text-red-800 transition-colors"
							title="Remove education"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">School/University *</label
							>
							<input
								type="text"
								value={entry.school}
								oninput={(e) => updateEducation(index, 'school', e.currentTarget.value)}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
								placeholder="e.g., University of Amsterdam"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Degree</label>
							<input
								type="text"
								value={entry.degree}
								oninput={(e) => updateEducation(index, 'degree', e.currentTarget.value)}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
								placeholder="e.g., Master of Science"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
							<input
								type="text"
								value={entry.field}
								oninput={(e) => updateEducation(index, 'field', e.currentTarget.value)}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
								placeholder="e.g., Environmental Science"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
							<input
								type="date"
								value={entry.startDate}
								oninput={(e) => updateEducation(index, 'startDate', e.currentTarget.value)}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
							<input
								type="date"
								value={entry.endDate}
								oninput={(e) => updateEducation(index, 'endDate', e.currentTarget.value)}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>

					<div class="mt-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
						<textarea
							value={entry.description}
							oninput={(e) => updateEducation(index, 'description', e.currentTarget.value)}
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
