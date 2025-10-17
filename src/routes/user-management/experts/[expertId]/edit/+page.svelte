<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { organizationState } from '$lib/stores/organization.svelte';
	import OrganizationRequired from '$lib/components/OrganizationRequired.svelte';
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

	import ExpertEditHeader from '$lib/components/expert-edit/ExpertEditHeader.svelte';
	import ExpertEditErrorBoundary from '$lib/components/expert-edit/ExpertEditErrorBoundary.svelte';
	import ExpertEditSteps from '$lib/components/expert-edit/ExpertEditSteps.svelte';
	import ExpertEditActions from '$lib/components/expert-edit/ExpertEditActions.svelte';

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

	// Parallel data preparation to prevent waterfall effects
	const parallelData = $derived({
		serviceVersionsData: serviceVersionsData || [],
		organizationApprovalsData: organizationApprovalsData || [],
		existingServiceAssignments: existingServiceAssignments?.data || [],
		currentCVData,
		validOrgId: expertEditState.validOrgId
	});

	// Derived states from parallel data - no waterfall effects
	let availableServices = $derived(getAvailableServices(
		parallelData.serviceVersionsData,
		parallelData.organizationApprovalsData,
		parallelData.validOrgId
	));

	let selectedServices = $derived(getSelectedServices(
		parallelData.currentCVData,
		parallelData.existingServiceAssignments,
		parallelData.serviceVersionsData
	));

	let serviceRoles = $derived(getServiceRoles(
		parallelData.currentCVData,
		parallelData.existingServiceAssignments,
		parallelData.serviceVersionsData
	));

	let experience = $derived(parallelData.currentCVData?.experience || []);
	let education = $derived(parallelData.currentCVData?.education || []);

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
				existingServiceAssignments: parallelData.existingServiceAssignments,
				serviceVersionsData: parallelData.serviceVersionsData
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
			<ExpertEditHeader userDataResult={userDataResult} currentCVData={expertEditState.currentCVData} />

			<ExpertEditErrorBoundary saveError={expertEditState.saveError} />

			<ExpertEditSteps 
				{userDataResult}
				{availableServices}
				{expertEditState}
				serviceVersions={serviceVersions}
				organizationApprovals={organizationApprovals}
				{handleToggleService}
				{handleToggleRole}
				{handleUpdateExperience}
				{handleUpdateEducation}
			/>

			<ExpertEditActions isSaving={expertEditState.isSaving} onSave={handleSave} />
		{/if}
	</div>
	{/if}
</div>
