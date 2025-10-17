<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { organizationState } from '$lib/stores/organization.svelte';
	import OrganizationRequired from '$lib/components/OrganizationRequired.svelte';
	import Step2Confirmation from '$lib/components/expert-wizard/Step2Confirmation.svelte';
	import Step3Services from '$lib/components/expert-wizard/Step3Services.svelte';
	import Step4Experience from '$lib/components/expert-wizard/Step4Experience.svelte';
	import Step5Education from '$lib/components/expert-wizard/Step5Education.svelte';
	import { toast } from 'svelte-sonner';
	import { 
		expertEditState, 
		expertEditStore, 
		getAvailableServices,
		getSelectedServices,
		getServiceRoles
	} from '$lib/stores/expertEdit.svelte';
	import { syncServiceAssignments } from '$lib/services/expertService';
	import { api } from '$lib';
	import { useConvexClient, useQuery } from 'convex-svelte';

	// Get expert ID from URL params
	const expertId = $derived($page.params.expertId);

	// Initialize store
	expertEditStore.initialize(expertId, organizationState.currentOrganizationId);

	// Get Convex client
	const client = useConvexClient();

	// Query the latest CV for this expert
	const latestCV = useQuery(
		api.expertCVs.getLatestExpertCV,
		() => ({ 
			userId: expertId as any, 
			organizationId: (expertEditState.validOrgId || 'j975t878dn66x7br1076wb7ey17skxyg') as any 
		})
	);

	// Query CV history for this expert
	const cvHistory = useQuery(
		api.expertCVs.getExpertCVHistory,
		() => ({ 
			userId: expertId as any, 
			organizationId: (expertEditState.validOrgId || 'j975t878dn66x7br1076wb7ey17skxyg') as any 
		})
	);

	// Get user ID from latest CV
	const userId = $derived(latestCV?.data?.userId || expertId);
	
	// Query user data if CV exists
	const userData = useQuery(
		api.utilities.getUserById,
		() => ({ id: (userId || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any })
	);

	// Query available services for this organization
	const serviceVersions = useQuery(api.utilities.getServiceVersions, () => ({}));

	const organizationApprovals = useQuery(
		api.utilities.getOrganizationApprovals,
		() => ({ organizationId: (expertEditState.validOrgId || 'j975t878dn66x7br1076wb7ey17skxyg') as any })
	);

	// Get the current CV data (latest CV)
	const currentCVData = $derived(latestCV?.data);

	// Query existing service assignments for this CV
	const existingServiceAssignments = useQuery(
		api.expertServiceAssignments.getExpertServiceAssignments,
		() => ({ expertCVId: (currentCVData?._id || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any })
	);

	// Loading and error states
	const isLoading = $derived(latestCV?.isLoading || cvHistory?.isLoading || userData?.isLoading || false);
	const hasError = $derived(latestCV?.error || cvHistory?.error || userData?.error || false);

	// Derived states
	const latestCVData = $derived(latestCV?.data);
	const cvHistoryData = $derived(cvHistory?.data);
	const userDataResult = $derived(userData?.data);
	const serviceVersionsData = $derived(serviceVersions?.data);
	const organizationApprovalsData = $derived(organizationApprovals?.data);

	// Derived states from queries
	let availableServices = $derived(getAvailableServices(
		serviceVersionsData || [],
		organizationApprovalsData || [],
		expertEditState.validOrgId
	));

	let selectedServices = $derived(getSelectedServices(
		currentCVData,
		existingServiceAssignments?.data || [],
		serviceVersionsData || []
	));

	let serviceRoles = $derived(getServiceRoles(
		currentCVData,
		existingServiceAssignments?.data || [],
		serviceVersionsData || []
	));

	let experience = $derived(currentCVData?.experience || []);
	let education = $derived(currentCVData?.education || []);

	// Initialize user state from derived data
	$effect(() => {
		expertEditStore.initializeUserState(
			selectedServices,
			serviceRoles,
			experience,
			education
		);
	});

	// Update store state when derived data changes
	$effect(() => {
		expertEditState.userId = userId || expertId;
		expertEditState.currentCVData = currentCVData;
	});

	function goBack() {
		window.history.back();
	}

	async function handleSave() {
		if (expertEditState.isSaving || !expertEditState.currentCVData) return;

		try {
			expertEditStore.setSaving(true);
			expertEditStore.setSaveError(null);

			// Update the CV with new experience and education
			await client.mutation(api.expertCVs.updateExpertCV, {
				id: expertEditState.currentCVData._id,
				experience: expertEditState.userExperience,
				education: expertEditState.userEducation
			});

			// Handle service assignments - complete sync
			const syncResult = await syncServiceAssignments(client, {
				currentCVData: expertEditState.currentCVData,
				userId: expertEditState.userId,
				validOrgId: expertEditState.validOrgId,
				userSelectedServices: expertEditState.userSelectedServices,
				userServiceRoles: expertEditState.userServiceRoles,
				existingServiceAssignments: existingServiceAssignments?.data || [],
				serviceVersionsData: serviceVersionsData || []
			});

			if (!syncResult.success) {
				throw new Error(syncResult.error || 'Failed to sync service assignments');
			}

			// Show success message
			toast.success('Expert profile updated successfully!');
			
			// Navigate back to user management
			goto('/user-management?section=experts');

		} catch (error) {
			console.error('Error saving expert:', error);
			expertEditStore.setSaveError(error instanceof Error ? error.message : 'An error occurred while saving');
			toast.error('Failed to update expert profile');
		} finally {
			expertEditStore.setSaving(false);
		}
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
	{:else}
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

		{#if isLoading}
			<!-- Loading State -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<div
					class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"
				></div>
				<p class="text-gray-600">Loading expert profile...</p>
			</div>
		{:else if hasError}
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
		{:else if !expertEditState.currentCVData}
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
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="flex items-center">
					<div class="flex-shrink-0 h-16 w-16">
						<div
							class="h-16 w-16 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl"
						>
							{userDataResult
								? `${userDataResult.firstName?.[0] || ''}${userDataResult.lastName?.[0] || ''}`
								: '?'}
						</div>
					</div>
					<div class="ml-6">
							<h2 class="text-2xl font-bold text-gray-900">
								{userDataResult
									? `${userDataResult.firstName || ''} ${userDataResult.lastName || ''}`.trim() ||
										userDataResult.email
									: 'Unknown User'}
							</h2>
							<p class="text-gray-600">{userDataResult?.email}</p>
						<div class="mt-2 flex items-center space-x-4">
							<span
												class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {expertEditState.currentCVData.status === 'locked'
													? 'bg-green-100 text-green-800'
													: expertEditState.currentCVData.status === 'submitted'
													? 'bg-yellow-100 text-yellow-800'
													: 'bg-blue-100 text-blue-800'}"
							>
												{expertEditState.currentCVData.status === 'locked'
													? 'Complete'
													: expertEditState.currentCVData.status === 'submitted'
													? 'Under Review'
													: `Draft - CV v${expertEditState.currentCVData.version}`}
							</span>
							<span
								class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {userDataResult
									?.isActive
									? 'bg-green-100 text-green-800'
									: 'bg-red-100 text-red-800'}"
							>
												{userDataResult?.isActive ? 'Active' : 'Invited'}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Save Error Display -->
				{#if expertEditState.saveError}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<div>
							<h3 class="text-sm font-medium text-red-800">Save Error</h3>
									<p class="text-sm text-red-700 mt-1">{expertEditState.saveError}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- STEP 2: Expert Confirmation -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 2: Expert Confirmation</h2>
					<p class="text-gray-600">Verify expert information and invitation status</p>
				</div>
				<Step2Confirmation
					userData={userDataResult}
					isDraftMode={!userDataResult?.isActive}
					invitedUserEmail={userDataResult?.email}
				/>
			</div>

			<!-- STEP 3: Select Services -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 3: Select Services & Roles</h2>
					<p class="text-gray-600">Choose which services this expert will provide and their role</p>
				</div>
				<Step3Services
					availableServices={availableServices}
							selectedServices={expertEditState.userSelectedServices}
							serviceRoles={expertEditState.userServiceRoles}
							currentOrgId={expertEditState.validOrgId}
					isLoadingServices={serviceVersions?.isLoading || organizationApprovals?.isLoading}
					isDraftMode={!userDataResult?.isActive}
					on:toggleService={(e) => handleToggleService(e.detail)}
					on:toggleRole={(e) => handleToggleRole(e.detail)}
				/>
			</div>

			<!-- STEP 4: Professional Experience -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 4: Professional Experience</h2>
					<p class="text-gray-600">Add relevant work experience and achievements</p>
				</div>
							<Step4Experience
								experience={expertEditState.userExperience}
								on:updateExperience={(e) => handleUpdateExperience(e.detail)}
							/>
			</div>

			<!-- STEP 5: Education -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 5: Education & Certifications</h2>
					<p class="text-gray-600">Add educational background and relevant certifications</p>
				</div>
						<Step5Education education={expertEditState.userEducation} on:updateEducation={(e) => handleUpdateEducation(e.detail)} />
			</div>

			<!-- Save Button -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center justify-center">
					<button
						type="button"
						onclick={handleSave}
								disabled={expertEditState.isSaving}
						class="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg font-medium"
					>
								{#if expertEditState.isSaving}
							Saving Profile...
						{:else}
							Save Complete Profile
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
	{/if}
</div>
