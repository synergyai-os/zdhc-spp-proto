<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import { canEditCVContent, type CVStatus } from '../../../../../../convex/model/status';
	
	const client = useConvexClient();
	const expertId = $derived($page.params.expertId);
	const orgId = DEFAULT_ORG_ID;
	const experienceIndex = $derived($page.url.searchParams.get('index'));
	
	// Get CV data to determine if we're editing
	const expertCV = useQuery(api.expert.getLatestCV, () => ({
		userId: expertId as Id<'users'>,
		organizationId: orgId as Id<'organizations'>
	}));
	
	// Determine if we're editing or creating new
	let isEditing = $derived(experienceIndex !== null && !isNaN(Number(experienceIndex)));
	let editIndex = $derived(isEditing ? Number(experienceIndex) : -1);
	
	// Form state
	let formData = $state({
		title: '',
		company: '',
		location: '',
		startDate: '',
		endDate: '',
		current: false,
		fieldExperienceTypes: {
			assessment: false,
			sampling: false,
			training: false
		},
		fieldExperienceCounts: {
			assessment: { total: 0, last12m: 0 },
			sampling: { total: 0, last12m: 0 },
			training: { total: 0, last12m: 0 }
		},
		description: ''
	});
	
	// Load existing data if editing
	$effect(() => {
		if (isEditing && expertCV?.data && !Array.isArray(expertCV.data) && expertCV.data.experience && expertCV.data.experience[editIndex]) {
			const existing: any = expertCV.data.experience[editIndex];
			// Update properties instead of reassigning to maintain reactivity
			formData.title = existing.title || '';
			formData.company = existing.company || '';
			formData.location = existing.location || '';
			formData.startDate = existing.startDate || '';
			formData.endDate = existing.endDate || '';
			formData.current = existing.current || false;
			formData.fieldExperienceTypes = existing.fieldExperienceTypes || {
				assessment: false,
				sampling: false,
				training: false
			};
			formData.fieldExperienceCounts = existing.fieldExperienceCounts || {
				assessment: { total: 0, last12m: 0 },
				sampling: { total: 0, last12m: 0 },
				training: { total: 0, last12m: 0 }
			};
			formData.description = existing.description || '';
		}
	});
	
	// Check if editing is allowed
	let canEdit = $derived(canEditCVContent((!Array.isArray(expertCV?.data) && expertCV?.data?.status) || 'draft'));
	
	// Check if current field change
	function handleCurrentChange(checked: boolean) {
		formData.current = checked;
		if (checked) {
			formData.endDate = '';
		}
	}
	
	
	// Save experience
	async function saveExperience() {
		if (!expertCV?.data || Array.isArray(expertCV.data)) {
			console.error('No CV data available');
			return;
		}
		
		if (!canEdit) {
			console.error('CV is locked and cannot be edited');
			return;
		}
		
		try {
			// Get current experience array
			const experience = [...(expertCV.data.experience || [])];
			
			if (isEditing) {
				// Update existing experience
				experience[editIndex] = formData;
			} else {
				// Add new experience
				experience.push(formData);
			}
			
			// Save to database
			await client.mutation(api.expert.updateCV, {
				cvId: expertCV.data._id as Id<'expertCVs'>,
				organizationId: orgId as Id<'organizations'>,
				experience: experience,
				education: expertCV.data.education || [],
				trainingQualifications: expertCV.data.trainingQualifications || []
			});
			
			// Navigate back to edit page
			await goto(`/user-management/experts/${expertId}/edit?tab=experience`);
		} catch (error: any) {
			console.error('Failed to save experience:', error);
			alert('Failed to save experience: ' + error.message);
		}
	}
	
	// Navigate back
	function goBack() {
		goto(`/user-management/experts/${expertId}/edit?tab=experience`);
	}
	
	// Check if all mandatory fields are filled
	const allMandatoryFieldsFilled = $derived(
		formData.title.trim() !== '' &&
		formData.company.trim() !== '' &&
		formData.location.trim() !== '' &&
		formData.startDate !== ''
	);
	
	// Reactive computed values for contextual text
	const companyName = $derived(formData.company.trim() || 'the organization');
	
	function formatDate(date: string): string {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}
	
	const dateRange = $derived.by(() => {
		const start = formatDate(formData.startDate);
		if (formData.current || !formData.endDate) {
			return `since ${start}`;
		}
		const end = formatDate(formData.endDate);
		return `between ${start} and ${end}`;
	});
	
	const assessmentContext = $derived(`How many assessments did you perform at ${companyName} ${dateRange}?`);
	const samplingContext = $derived(`How many samplings did you perform at ${companyName} ${dateRange}?`);
	const trainingContext = $derived(`How many trainings did you give at ${companyName} ${dateRange}?`);
</script>

<div class="bg-gray-50 min-h-screen">
	<div class="max-w-4xl mx-auto px-6 py-8">
		<!-- Back Button -->
		<div class="mb-6">
			<button
				onclick={goBack}
				class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to CV
			</button>
		</div>
		
		<!-- Form Card -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">
				{isEditing ? 'Edit Experience' : 'Add New Experience'}
			</h2>
			
			{#if !canEdit}
				<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
						<span class="text-sm text-amber-700">CV is locked and cannot be edited.</span>
					</div>
				</div>
			{/if}
			
			<form onsubmit={(e) => { e.preventDefault(); saveExperience(); }} class="space-y-6">
				<!-- Title and Company -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
							Job Title *
						</label>
						<input
							id="title"
							type="text"
							bind:value={formData.title}
							required
							disabled={!canEdit}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							placeholder="e.g., Senior Consultant"
						/>
					</div>
					
					<div>
						<label for="company" class="block text-sm font-medium text-gray-700 mb-1">
							Company *
						</label>
						<input
							id="company"
							type="text"
							bind:value={formData.company}
							required
							disabled={!canEdit}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							placeholder="e.g., ABC Consulting"
						/>
					</div>
				</div>
				
				<!-- Location -->
				<div>
					<label for="location" class="block text-sm font-medium text-gray-700 mb-1">
						Location *
					</label>
					<input
						id="location"
						type="text"
						bind:value={formData.location}
						required
						disabled={!canEdit}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						placeholder="e.g., Amsterdam, Netherlands"
					/>
				</div>
				
				<!-- Dates -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
							Start Date *
						</label>
						<input
							id="startDate"
							type="date"
							bind:value={formData.startDate}
							required
							disabled={!canEdit}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						/>
					</div>
					
					<div>
						<label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
							End Date
						</label>
						<input
							id="endDate"
							type="date"
							bind:value={formData.endDate}
							disabled={formData.current || !canEdit}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						/>
					</div>
				</div>
				
				<!-- Current checkbox -->
				<div class="flex items-center">
					<input
						type="checkbox"
						id="current"
						checked={formData.current}
						onchange={(e) => handleCurrentChange(e.currentTarget.checked)}
						disabled={!canEdit}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
					/>
					<label for="current" class="ml-2 block text-sm text-gray-700">
						Currently working here
					</label>
				</div>
				
				<!-- Field Experience Section (only show when all mandatory fields are filled) -->
				{#if allMandatoryFieldsFilled}
				<div class="border-t border-gray-200 pt-6">
					<div class="mb-4">
						<h2 class="text-lg font-semibold text-gray-900 mb-1">Field Experience</h2>
						<p class="text-sm text-gray-500">Select what applies to your experience at {companyName}</p>
					</div>
					
					<!-- Selection Checkboxes -->
					<div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
						<div class="space-y-3">
							<div class="flex items-center">
								<input
									type="checkbox"
									id="field-assessment"
									bind:checked={formData.fieldExperienceTypes.assessment}
									disabled={!canEdit}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
								/>
								<label for="field-assessment" class="ml-3 block text-sm text-gray-700">
									Assessments
								</label>
							</div>
							<div class="flex items-center">
								<input
									type="checkbox"
									id="field-sampling"
									bind:checked={formData.fieldExperienceTypes.sampling}
									disabled={!canEdit}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
								/>
								<label for="field-sampling" class="ml-3 block text-sm text-gray-700">
									Samplings
								</label>
							</div>
							<div class="flex items-center">
								<input
									type="checkbox"
									id="field-training"
									bind:checked={formData.fieldExperienceTypes.training}
									disabled={!canEdit}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
								/>
								<label for="field-training" class="ml-3 block text-sm text-gray-700">
									Trainings Given
								</label>
							</div>
						</div>
					</div>
					
					<div class="space-y-4">
						<!-- Assessments -->
						{#if formData.fieldExperienceTypes.assessment}
						<div class="bg-white border border-gray-200 rounded-lg p-4">
							<h4 class="text-sm font-semibold text-gray-900 mb-2">Assessments</h4>
							<p class="text-sm text-gray-600 mb-3">{assessmentContext}</p>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Total Assessments
									</label>
									<input
										type="number"
										min="0"
										bind:value={formData.fieldExperienceCounts.assessment.total}
										disabled={!canEdit}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
										placeholder="0"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Last 12 Months
									</label>
									<input
										type="number"
										min="0"
										bind:value={formData.fieldExperienceCounts.assessment.last12m}
										disabled={!canEdit}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
										placeholder="0"
									/>
								</div>
							</div>
						</div>
						{/if}
						
						<!-- Samplings -->
						{#if formData.fieldExperienceTypes.sampling}
						<div class="bg-white border border-gray-200 rounded-lg p-4">
							<h4 class="text-sm font-semibold text-gray-900 mb-2">Samplings</h4>
							<p class="text-sm text-gray-600 mb-3">{samplingContext}</p>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Total Samplings
									</label>
									<input
										type="number"
										min="0"
										bind:value={formData.fieldExperienceCounts.sampling.total}
										disabled={!canEdit}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
										placeholder="0"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Last 12 Months
									</label>
									<input
										type="number"
										min="0"
										bind:value={formData.fieldExperienceCounts.sampling.last12m}
										disabled={!canEdit}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
										placeholder="0"
									/>
								</div>
							</div>
						</div>
						{/if}
						
						<!-- Trainings -->
						{#if formData.fieldExperienceTypes.training}
						<div class="bg-white border border-gray-200 rounded-lg p-4">
							<h4 class="text-sm font-semibold text-gray-900 mb-2">Trainings Given</h4>
							<p class="text-sm text-gray-600 mb-3">{trainingContext}</p>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Total Trainings
									</label>
									<input
										type="number"
										min="0"
										bind:value={formData.fieldExperienceCounts.training.total}
										disabled={!canEdit}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
										placeholder="0"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Last 12 Months
									</label>
									<input
										type="number"
										min="0"
										bind:value={formData.fieldExperienceCounts.training.last12m}
										disabled={!canEdit}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
										placeholder="0"
									/>
								</div>
							</div>
						</div>
						{/if}
					</div>
				</div>
				{/if}
				
				<!-- Description -->
				<div class="border-t border-gray-200 pt-6">
					<div class="mb-4">
						<h2 class="text-lg font-semibold text-gray-900 mb-1">Description</h2>
						<p class="text-sm text-gray-500">Describe your role, key responsibilities, work completed, and achievements to help ZDHC reviewers evaluate your experience.</p>
					</div>
					<textarea
						id="description"
						bind:value={formData.description}
						disabled={!canEdit}
						rows="6"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					></textarea>
				</div>
				
				<!-- Action Buttons -->
				<div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
					<button
						type="button"
						onclick={goBack}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!canEdit}
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save Experience
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

