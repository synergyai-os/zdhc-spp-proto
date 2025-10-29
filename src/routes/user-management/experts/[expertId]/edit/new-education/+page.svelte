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
		school: '',
		degree: '',
		field: '',
		startDate: '',
		endDate: '',
		description: ''
	});
	
	// Load existing data if editing
	$effect(() => {
		if (isEditing && expertCV?.data && !Array.isArray(expertCV.data) && expertCV.data.education && expertCV.data.education[editIndex]) {
			const existing: any = expertCV.data.education[editIndex];
			// Update properties instead of reassigning to maintain reactivity
			formData.school = existing.school || '';
			formData.degree = existing.degree || '';
			formData.field = existing.field || '';
			formData.startDate = existing.startDate || '';
			formData.endDate = existing.endDate || '';
			formData.description = existing.description || '';
		}
	});
	
	// Check if editing is allowed
	let canEdit = $derived(canEditCVContent((!Array.isArray(expertCV?.data) && expertCV?.data?.status) || 'draft'));
	
	// Save education
	async function saveEducation() {
		if (!expertCV?.data || Array.isArray(expertCV.data)) {
			console.error('No CV data available');
			return;
		}
		
		if (!canEdit) {
			console.error('CV is locked and cannot be edited');
			return;
		}
		
		try {
			// Get current education array
			const education = [...(expertCV.data.education || [])];
			
			if (isEditing) {
				// Update existing education
				education[editIndex] = formData;
			} else {
				// Add new education
				education.push(formData);
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
			await goto(`/user-management/experts/${expertId}/edit?tab=education`);
		} catch (error: any) {
			console.error('Failed to save education:', error);
			alert('Failed to save education: ' + error.message);
		}
	}
	
	// Navigate back
	function goBack() {
		goto(`/user-management/experts/${expertId}/edit?tab=education`);
	}
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
							required
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
							required
							disabled={!canEdit}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							placeholder="e.g., Master of Science"
						/>
					</div>
				</div>
				
				<!-- Field of Study -->
				<div>
					<label for="field" class="block text-sm font-medium text-gray-700 mb-1">
						Field of Study
					</label>
					<input
						id="field"
						type="text"
						bind:value={formData.field}
						disabled={!canEdit}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						placeholder="e.g., Environmental Science"
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
							End Date *
						</label>
						<input
							id="endDate"
							type="date"
							bind:value={formData.endDate}
							required
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
