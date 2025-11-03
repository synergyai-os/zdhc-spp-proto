<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import { canEditCVContent, type CVStatus } from '../../../../../convex/model/status';
	
	const client = useConvexClient();
	const expertId = $derived($page.params.expertId);
	const orgId = DEFAULT_ORG_ID;
	const educationIndex = $derived($page.url.searchParams.get('index'));
	
	// Get CV data to determine if we're editing
	const expertCV = useQuery(api.expert.getLatestCV, () => ({
		userId: expertId as Id<'users'>,
		organizationId: orgId as Id<'organizations'>
	}));
	
	// Determine if we're editing or creating new
	let isEditing = $derived(educationIndex !== null && !isNaN(Number(educationIndex)));
	let editIndex = $derived(isEditing ? Number(educationIndex) : -1);
	
	// Form state
	let formData = $state({
		field: '',
		school: '',
		degree: '',
		startDate: '',
		endDate: '',
		description: ''
	});

	// Field of Study options
	const fieldOfStudyOptions = [
		'Chemistry',
		'Chemical Engineering',
		'Environmental Science',
		'Environmental Engineering',
		'Textile or Leather Technology/Chemistry',
		'Other'
	];

	// Track dropdown selection separately from the stored field value
	let dropdownSelection = $state('');
	
	// Check if "Other" is selected in dropdown
	const predefinedOptions = fieldOfStudyOptions.filter(opt => opt !== 'Other');
	let isOtherSelected = $derived(dropdownSelection === 'Other');
	
	// Check if field of study is selected (dropdown selection OR custom text filled)
	let fieldOfStudySelected = $derived(
		(dropdownSelection !== '' && dropdownSelection !== 'Other') || 
		(isOtherSelected && formData.field.trim() !== '')
	);
	
	// Load existing data if editing
	$effect(() => {
		if (isEditing && expertCV?.data && !Array.isArray(expertCV.data) && expertCV.data.education && expertCV.data.education[editIndex]) {
			const existing: any = expertCV.data.education[editIndex];
			// Update properties instead of reassigning to maintain reactivity
			// Check if existing field is not in the predefined options, treat as "Other"
			if (existing.field && !fieldOfStudyOptions.includes(existing.field)) {
				dropdownSelection = 'Other';
				formData.field = existing.field; // Store custom value
			} else {
				dropdownSelection = existing.field || '';
				formData.field = existing.field || '';
			}
			formData.school = existing.school || '';
			formData.degree = existing.degree || '';
			formData.startDate = existing.startDate || '';
			formData.endDate = existing.endDate || '';
			formData.description = existing.description || '';
		}
	});
	
	// Handle dropdown change - clear field when switching away from "Other"
	$effect(() => {
		if (dropdownSelection !== 'Other' && dropdownSelection !== '') {
			// User selected a predefined option, store it directly
			formData.field = dropdownSelection;
		} else if (dropdownSelection === 'Other') {
			// User selected "Other", keep current custom text or leave empty for them to type
			// Don't clear formData.field - user might be editing existing custom value
		} else if (dropdownSelection === '') {
			// User cleared selection
			formData.field = '';
		}
	});
	
	// Check if the item being edited is locked
	let isItemLocked = $derived.by(() => {
		if (!isEditing || !expertCV?.data || Array.isArray(expertCV.data)) return false;
		const existing = expertCV.data.education?.[editIndex];
		return existing?.lockedForReviewAt !== undefined;
	});

	// Check if editing is allowed (status check + locked item check)
	let canEdit = $derived.by(() => {
		const statusCheck = canEditCVContent((!Array.isArray(expertCV?.data) && expertCV?.data?.status) || 'draft');
		if (!statusCheck) return false;
		if (isItemLocked) return false;
		return true;
	});

	// Redirect if trying to edit locked item
	function goBack() {
		goto(`/experts/${expertId}/cv?tab=education`);
	}

	$effect(() => {
		if (isEditing && isItemLocked && expertCV?.data && !Array.isArray(expertCV.data)) {
			const cvStatus = expertCV.data.status;
			if (cvStatus === 'unlocked_for_edits') {
				alert('This education entry is locked for review and cannot be edited. Contact your administrator if changes are needed.');
				goBack();
			}
		}
	});

	// Save education
	async function saveEducation() {
		if (!expertCV?.data || Array.isArray(expertCV.data)) {
			console.error('No CV data available');
			return;
		}
		
		if (!canEdit) {
			if (isItemLocked) {
				alert('This education entry is locked for review and cannot be edited. Contact your administrator if changes are needed.');
			} else {
				alert('CV is locked and cannot be edited');
			}
			return;
		}

		// Extra check before saving - prevent saving locked items
		if (isEditing && isItemLocked) {
			alert('This education entry is locked for review and cannot be edited. Contact your administrator if changes are needed.');
			return;
		}
		
		try {
			// Get current education array
			const education = [...(expertCV.data.education || [])];
			
			// Prepare data to save - field already contains the right value (dropdown selection or custom text)
			const existingItem = isEditing ? education[editIndex] : null;
			const educationData = {
				field: formData.field,
				school: formData.school,
				degree: formData.degree,
				startDate: formData.startDate,
				endDate: formData.endDate,
				description: formData.description
			};
			
			if (isEditing) {
				// Update existing education - preserve lockedForReviewAt if it exists
				education[editIndex] = {
					...educationData,
					lockedForReviewAt: existingItem?.lockedForReviewAt // Preserve lock status
				};
			} else {
				// Add new education
				education.push(educationData);
			}
			
			// Save to database
			await client.mutation(api.expert.updateCV, {
				cvId: expertCV.data._id as Id<'expertCVs'>,
				organizationId: orgId as Id<'organizations'>,
				experience: expertCV.data.experience || [],
				education: education,
				trainingQualifications: expertCV.data.trainingQualifications || []
			});
			
			// Navigate back to edit page
			await goto(`/experts/${expertId}/cv?tab=education`);
		} catch (error: any) {
			console.error('Failed to save education:', error);
			alert('Failed to save education: ' + error.message);
		}
	}
</script>

<div class="bg-gray-50 min-h-screen">
	<div class="max-w-4xl mx-auto px-6 py-8">
		<!-- Locked Item Warning -->
		{#if isItemLocked}
			<div class="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
				<div class="flex items-start">
					<svg class="w-5 h-5 text-orange-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
					</svg>
					<div class="flex-1">
						<h3 class="text-sm font-semibold text-orange-800">Education Entry Locked for Review</h3>
						<p class="text-sm text-orange-700 mt-1">
							This education entry has been locked by an administrator for review and cannot be edited. Contact your administrator if changes are needed.
						</p>
					</div>
				</div>
			</div>
		{/if}

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
				{isEditing ? 'Edit Education' : 'Add New Education'}
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
			
			<form onsubmit={(e) => { e.preventDefault(); saveEducation(); }} class="space-y-6">
				<!-- Field of Study (First - Conditional Display Trigger) -->
				<div>
					<label for="field" class="block text-sm font-medium text-gray-700 mb-1">
						Field of Study *
					</label>
					<p class="text-xs text-gray-500 mb-2">
						Select the primary academic discipline for this education. This helps reviewers quickly assess your qualifications for specific services.
					</p>
					<!-- Dropdown for predefined options -->
					<select
						id="fieldDropdown"
						bind:value={dropdownSelection}
						required
						disabled={!canEdit}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					>
						<option value="">Select field of study...</option>
						{#each fieldOfStudyOptions.filter(opt => opt !== 'Other') as option}
							<option value={option}>{option}</option>
						{/each}
						<option value="Other">Other</option>
					</select>
					
					<!-- Additional text input when "Other" is selected -->
					{#if isOtherSelected}
						<div class="mt-3">
							<label for="fieldOther" class="block text-sm font-medium text-gray-700 mb-1">
								Specify your field of study *
							</label>
							<p class="text-xs text-gray-500 mb-2">
								Please enter the specific field of study that is not listed in the dropdown above.
							</p>
							<input
								id="fieldOther"
								type="text"
								bind:value={formData.field}
								required
								disabled={!canEdit}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="Enter your field of study"
							/>
						</div>
					{/if}
				</div>
				
				<!-- Conditional display: Show other fields only after field of study is selected -->
				{#if fieldOfStudySelected}
					<!-- Institution and Degree -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="school" class="block text-sm font-medium text-gray-700 mb-1">
								Institution *
							</label>
							<input
								id="school"
								type="text"
								bind:value={formData.school}
								required={fieldOfStudySelected}
								disabled={!canEdit}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., University of Amsterdam"
							/>
						</div>
						
						<div>
							<label for="degree" class="block text-sm font-medium text-gray-700 mb-1">
								Degree *
							</label>
							<input
								id="degree"
								type="text"
								bind:value={formData.degree}
								required={fieldOfStudySelected}
								disabled={!canEdit}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								placeholder="e.g., Master of Science"
							/>
						</div>
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
								required={fieldOfStudySelected}
								disabled={!canEdit}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>
						
						<div>
							<label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
								End Date *
							</label>
							<input
								id="endDate"
								type="date"
								bind:value={formData.endDate}
								required={fieldOfStudySelected}
								disabled={!canEdit}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
						</div>
					</div>
					
					<!-- Description -->
					<div class="border-t border-gray-200 pt-6">
						<div class="mb-4">
							<h2 class="text-lg font-semibold text-gray-900 mb-1">Description</h2>
							<p class="text-sm text-gray-500">Provide additional context about your education, coursework, honors, or achievements to help ZDHC reviewers evaluate your qualifications.</p>
						</div>
						<textarea
							id="description"
							bind:value={formData.description}
							disabled={!canEdit}
							rows="6"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						></textarea>
					</div>
				{/if}
				
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
						Save Education
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
