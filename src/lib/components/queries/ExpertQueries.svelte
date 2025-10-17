<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import { getAvailableServices, getSelectedServices, getServiceRoles } from '$lib/stores/expertEdit.svelte';

	// Props
	let { expertId, orgId, children } = $props<{
		expertId: string;
		orgId: string;
		children: any;
	}>();

	// Debug logging
	console.log('🔍 ExpertQueries component initialized:', { expertId, orgId });

	// Query the latest CV for this expert
	const latestCV = useQuery(api.expertCVs.getLatestExpertCV, () => {
		console.log('🔍 Querying latestCV with:', { expertId, orgId });
		return {
			userId: expertId as any,
			organizationId: orgId as any
		};
	});

	// Get user ID from latest CV
	const userId = $derived(latestCV?.data?.userId || expertId);
	
	// Query user data if CV exists
	const userData = useQuery(api.utilities.getUserById, () => ({
		id: (userId || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any
	}));

	// Query available services for this organization
	const serviceVersions = useQuery(api.utilities.getServiceVersions, () => ({}));

	const organizationApprovals = useQuery(api.utilities.getOrganizationApprovals, () => ({
		organizationId: orgId as any
	}));

	// Get the current CV data (latest CV)
	const currentCVData = $derived(latestCV?.data);

	// Query existing service assignments for this CV
	const existingServiceAssignments = useQuery(
		api.expertServiceAssignments.getExpertServiceAssignments,
		() => ({ expertCVId: (currentCVData?._id || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any })
	);

	// Loading and error states
	const isLoading = $derived(latestCV?.isLoading || userData?.isLoading || false);
	const hasError = $derived(latestCV?.error || userData?.error || false);

	// Derived states
	const userDataResult = $derived(userData?.data);
	const serviceVersionsData = $derived(serviceVersions?.data);
	const organizationApprovalsData = $derived(organizationApprovals?.data);

	// Prepare data for children with all business logic
	const queryData = $derived({
		// Raw queries
		latestCV,
		userData,
		serviceVersions,
		organizationApprovals,
		existingServiceAssignments,

		// Processed data
		currentCVData,
		userDataResult,
		serviceVersionsData,
		organizationApprovalsData,
		userId,

		// Business logic results
		availableServices: getAvailableServices(
			serviceVersionsData || [],
			organizationApprovalsData || [],
			orgId
		),
		selectedServices: getSelectedServices(
			currentCVData,
			existingServiceAssignments?.data || [],
			serviceVersionsData || []
		),
		serviceRoles: getServiceRoles(
			currentCVData,
			existingServiceAssignments?.data || [],
			serviceVersionsData || []
		),
		experience: currentCVData?.experience || [],
		education: currentCVData?.education || [],

		// State
		isLoading,
		hasError
	});

	// Debug query results
	$effect(() => {
		console.log('🔍 Query results updated:', {
			isLoading,
			hasError,
			currentCVData: !!currentCVData,
			userDataResult: !!userDataResult,
			serviceVersionsData: serviceVersionsData?.length || 0
		});
	});
</script>

{#if children}
	{@render children(queryData)}
{/if}
