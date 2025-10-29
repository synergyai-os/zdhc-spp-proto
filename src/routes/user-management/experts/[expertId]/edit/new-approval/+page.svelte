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
	const approvalIndex = $derived($page.url.searchParams.get('index'));
	
	// Get CV data to determine if we're editing
	const expertCV = useQuery(api.expert.getLatestCV, () => ({
		userId: expertId as Id<'users'>,
		organizationId: orgId as Id<'organizations'>
	}));
	
	// Determine if we're editing or creating new
	let isEditing = $derived(approvalIndex !== null && !isNaN(Number(approvalIndex)));
	let editIndex = $derived(isEditing ? Number(approvalIndex) : -1);
	
	// Form state
	let formData = $state({
		organisationName: '',
		role: '',
		dateIssued: ''
	});
	
	// Load existing data if editing
	$effect(() => {
		if (isEditing && expertCV?.data && !Array.isArray(expertCV.data) && expertCV.data.otherApprovals && expertCV.data.otherApprovals[editIndex]) {
			const existing: any = expertCV.data.otherApprovals[editIndex];
			// Update properties instead of reassigning to maintain reactivity
			formData.organisationName = existing.organisationName || '';
			formData.role = existing.role || '';
			formData.dateIssued = existing.dateIssued || '';
		}
	});
	
	// Check if editing is allowed
	let canEdit = $derived(canEditCVContent((!Array.isArray(expertCV?.data) && expertCV?.data?.status) || 'draft'));
	
	// Save approval
	async function saveApproval() {
		if (!expertCV?.data || Array.isArray(expertCV.data)) {
			console.error('No CV data available');
			return;
		}
		
		if (!canEdit) {
			console.error('CV is locked and cannot be edited');
			return;
		}
		
		try {
			// Get current other approvals array
			const otherApprovals = [...(expertCV.data.otherApprovals || [])];
			
			if (isEditing) {
				// Update existing approval
				otherApprovals[editIndex] = formData;
			} else {
				// Add new approval
				otherApprovals.push(formData);
			}
			
			// Save to database
			await client.mutation(api.expert.updateCV, {
				cvId: expertCV.data._id as Id<'expertCVs'>,
				organizationId: orgId as Id<'organizations'>,
				experience: expertCV.data.experience || [],
				education: expertCV.data.education || [],
				trainingQualifications: expertCV.data.trainingQualifications || [],
				otherApprovals: otherApprovals
			});
			
			// Navigate back to edit page
			await goto(`/user-management/experts/${expertId}/edit?tab=approvals`);
		} catch (error: any) {
			console.error('Failed to save approval:', error);
			alert('Failed to save approval: ' + error.message);
		}
	}
	
	// Navigate back
	function goBack() {
		goto(`/user-management/experts/${expertId}/edit?tab=approvals`);
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
				{isEditing ? 'Edit Other Approval' : 'Add New Other Approval'}
			</h2>
			
			<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<p class="text-sm text-gray-700">
					<strong>Note:</strong> This section is optional. If you have been approved by another likeminded organization (like Cascale), you can record that information here. This may help speed up your approval process.
				</p>
			</div>
			
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
			
			<form onsubmit={(e) => { e.preventDefault(); saveApproval(); }} class="space-y-6">
				<!-- Organisation Name -->
				<div>
					<label for="organisationName" class="block text-sm font-medium text-gray-700 mb-1">
						Organisation Name *
					</label>
					<input
						id="organisationName"
						type="text"
						bind:value={formData.organisationName}
						required
						disabled={!canEdit}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						placeholder="e.g., SAC Higg 3.0 FEM"
					/>
				</div>
				
				<!-- Role -->
				<div>
					<label for="role" class="block text-sm font-medium text-gray-700 mb-1">
						Role *
					</label>
					<input
						id="role"
						type="text"
						bind:value={formData.role}
						required
						disabled={!canEdit}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
						placeholder="e.g., verifier & chemical specialist"
					/>
				</div>
				
				<!-- Date Issued -->
				<div>
					<label for="dateIssued" class="block text-sm font-medium text-gray-700 mb-1">
						Date Issued *
					</label>
					<input
						id="dateIssued"
						type="date"
						bind:value={formData.dateIssued}
						required
						disabled={!canEdit}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					/>
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
						Save Approval
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
