<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { organizationState } from '$lib/stores/organization.svelte';
	import OrganizationRequired from '$lib/components/OrganizationRequired.svelte';
	import { toast } from 'svelte-sonner';
	import { 
		expertEditState, 
		expertEditStore
	} from '$lib/stores/expertEdit.svelte';
	import { syncServiceAssignments, saveExpertProfile } from '$lib/services/expertService';
	import { api } from '$lib';
	import { useConvexClient } from 'convex-svelte';

	import ExpertQueries from '$lib/components/queries/ExpertQueries.svelte';
	import ExpertEditHeader from '$lib/components/expert-edit/ExpertEditHeader.svelte';
	import ExpertEditErrorBoundary from '$lib/components/expert-edit/ExpertEditErrorBoundary.svelte';
	import ExpertEditSteps from '$lib/components/expert-edit/ExpertEditSteps.svelte';
	import ExpertEditActions from '$lib/components/expert-edit/ExpertEditActions.svelte';

	// Get expert ID from URL params
	const expertId = $derived($page.params.expertId);

	// Initialize store
	$effect(() => {
		if (expertId) {
			expertEditStore.initialize(expertId, organizationState.currentOrganizationId);
		}
	});

	// Get Convex client
	const client = useConvexClient();

	function goBack() {
		window.history.back();
	}

	async function handleSave(queryData: any) {
		console.log('🔍 Save button clicked!');
		console.log('🔍 Current state:', {
			isSaving: expertEditState.isSaving,
			hasQueryData: !!queryData,
			hasCurrentCVData: !!queryData?.currentCVData,
			cvId: queryData?.currentCVData?._id
		});
		
		if (expertEditState.isSaving || !queryData?.currentCVData) {
			console.log('🔍 Save blocked:', {
				isSaving: expertEditState.isSaving,
				hasQueryData: !!queryData,
				hasCurrentCVData: !!queryData?.currentCVData
			});
			return;
		}

		console.log('🔍 Starting save process...');
		expertEditStore.setSaving(true);
		expertEditStore.setSaveError(null);

		console.log('🔍 Calling saveExpertProfile with:', {
			cvId: queryData.currentCVData._id,
			experience: queryData.experience,
			education: queryData.education
		});

		const result = await saveExpertProfile(client, {
			cvId: queryData.currentCVData._id,
			experience: queryData.experience,
			education: queryData.education
		});

		console.log('🔍 Save result:', result);

		if (result.success) {
			toast.success('Expert profile updated successfully!');
			goto('/user-management?section=experts');
		} else {
			expertEditStore.setSaveError(result.error || 'An error occurred while saving');
			toast.error('Failed to update expert profile');
		}

		expertEditStore.setSaving(false);
	}

	function handleToggleService(serviceName: string) {
		expertEditStore.toggleService(serviceName);
	}

	function handleToggleRole(serviceName: string) {
		expertEditStore.toggleRole(serviceName);
	}

	function handleUpdateExperience(newExperience: any[]) {
		expertEditStore.updateExperience(newExperience);
	}

	function handleUpdateEducation(newEducation: any[]) {
		expertEditStore.updateEducation(newEducation);
	}
</script>

<svelte:head>
	<title>Edit Expert Profile - SPP</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen">
	{#if organizationState.availableOrganizations.length === 0}
		<div class="flex items-center justify-center min-h-[60vh]">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p class="text-lg text-gray-600">Loading...</p>
			</div>
		</div>
	{:else if !organizationState.hasCurrentOrganization}
		<OrganizationRequired />
	{:else if expertId}
	
		<ExpertQueries expertId={expertId} orgId={expertEditState.validOrgId}>
			{#snippet children(queryDataFromComponent: any)}
				
				<div class="max-w-4xl mx-auto px-6 py-8">
					<!-- Header -->
					<div class="mb-8">
						<div class="flex items-center justify-between">
							<div>
								<h1 class="text-3xl font-bold text-gray-800 mb-2">Edit Expert Profile</h1>
								<p class="text-gray-600">Complete or update expert profile information</p>
							</div>
							<button
								type="button"
								onclick={goBack}
								class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
							>
								← Back
							</button>
						</div>
					</div>

					{#if queryDataFromComponent.isLoading}
						<!-- Loading State -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
							<div
								class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"
							></div>
							<p class="text-gray-600">Loading expert profile...</p>
						</div>
					{:else if queryDataFromComponent.hasError}
						<!-- Error State -->
						<div class="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
							<svg
								class="w-12 h-12 mx-auto mb-4 text-red-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<h2 class="text-xl font-semibold text-red-800 mb-2">Error Loading Profile</h2>
							<p class="text-red-600 mb-4">Could not load expert profile data</p>
							<button
								type="button"
								onclick={() => window.location.reload()}
								class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
							>
								Try Again
							</button>
						</div>
					{:else if !queryDataFromComponent.currentCVData}
						<!-- Not Found -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
							<svg
								class="w-12 h-12 mx-auto mb-4 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
								/>
							</svg>
							<h2 class="text-xl font-semibold text-gray-800 mb-2">Expert CV Not Found</h2>
							<p class="text-gray-600 mb-4">The requested expert CV could not be found</p>
							<a href="/user-management" class="text-blue-600 hover:text-blue-800 font-medium">
								Back to User Management →
							</a>
						</div>
					{:else}
						<!-- Expert Info Header -->
						<ExpertEditHeader userDataResult={queryDataFromComponent.userDataResult} currentCVData={queryDataFromComponent.currentCVData} />

						<ExpertEditErrorBoundary saveError={expertEditState.saveError} />

						<ExpertEditSteps 
							userDataResult={queryDataFromComponent.userDataResult}
							availableServices={queryDataFromComponent.availableServices}
							selectedServices={queryDataFromComponent.selectedServices}
							serviceRoles={queryDataFromComponent.serviceRoles}
							experience={queryDataFromComponent.experience}
							education={queryDataFromComponent.education}
							expertEditState={expertEditState}
							serviceVersions={queryDataFromComponent.existingServiceAssignments}
							organizationApprovals={queryDataFromComponent.organizationApprovalsData}
							{handleToggleService}
							{handleToggleRole}
							{handleUpdateExperience}
							{handleUpdateEducation}
						/>

						<ExpertEditActions isSaving={expertEditState.isSaving} onSave={() => handleSave(queryDataFromComponent)} />
					{/if}
				</div>
			{/snippet}
		</ExpertQueries>
	{:else}
		<div class="max-w-4xl mx-auto px-6 py-8">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<h2 class="text-xl font-semibold text-gray-800 mb-2">Invalid Expert ID</h2>
				<p class="text-gray-600 mb-4">No expert ID provided</p>
				<a href="/user-management" class="text-blue-600 hover:text-blue-800 font-medium">
					Back to User Management →
				</a>
			</div>
		</div>
	{/if}
</div>