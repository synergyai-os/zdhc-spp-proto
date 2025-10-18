<script lang="ts">
	import { setContext } from 'svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';

	interface Props {
		expertId: string;
		orgId: string;
		children: any;
	}

	let { expertId, orgId, children }: Props = $props();

	// Fetch all expert-related data
	const latestCV = useQuery(api.expertCVs.getLatestExpertCV, () => ({
		userId: expertId as any,
		organizationId: orgId as any
	}));

	// Add this after: const latestCV = useQuery(...)
	console.log('🔍 latestCV query result:', latestCV);
	console.log('🔍 latestCV.data:', latestCV?.data);
	console.log('🔍 latestCV.isLoading:', latestCV?.isLoading);
	console.log('🔍 latestCV.error:', latestCV?.error);

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

	const existingServiceAssignments = useQuery(
		api.expertServiceAssignments.getExpertServiceAssignments,
		() => ({ expertCVId: (latestCV?.data?._id || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any })
	);

	// Create context data object
	const expertData = $derived.by(() => ({
		// Raw data
		currentCVData: latestCV?.data || null,
		userDataResult: userData?.data || null,
		serviceVersionsData: serviceVersions?.data || [],
		organizationApprovalsData: organizationApprovals?.data || [],
		existingServiceAssignmentsData: existingServiceAssignments?.data || [],
		
		// Loading states
		isLoading: latestCV?.isLoading || userData?.isLoading || serviceVersions?.isLoading || organizationApprovals?.isLoading || existingServiceAssignments?.isLoading,
		hasError: latestCV?.error || userData?.error || serviceVersions?.error || organizationApprovals?.error || existingServiceAssignments?.error,
		
		// Computed data
		userId: expertId,
		validOrgId: orgId,
		
		// Business logic results
		availableServices: !latestCV?.isLoading && !userData?.isLoading && serviceVersions?.data && organizationApprovals?.data
			? getAvailableServices(serviceVersions.data, organizationApprovals.data, orgId)
			: [],
		
		selectedServices: !latestCV?.isLoading && !userData?.isLoading && latestCV?.data && existingServiceAssignments?.data && serviceVersions?.data
			? getSelectedServices(latestCV.data, existingServiceAssignments.data, serviceVersions.data)
			: [],
		
		serviceRoles: !latestCV?.isLoading && !userData?.isLoading && latestCV?.data && existingServiceAssignments?.data && serviceVersions?.data
			? getServiceRoles(latestCV.data, existingServiceAssignments.data, serviceVersions.data)
			: {},
		
		experience: latestCV?.data?.experience || [],
		education: latestCV?.data?.education || []
	}));

	// Provide context to child components
	setContext('expertData', expertData);
	// Add this line after setContext('expertData', expertData);
console.log('🔍 Context data being set:', expertData);

	// Helper functions (simplified versions)
	function getAvailableServices(serviceVersionsData: any[], organizationApprovalsData: any[], orgId: string) {
		if (!serviceVersionsData || !organizationApprovalsData) return [];
		
		const approvedServiceIds = organizationApprovalsData
			.filter((approval: any) => approval.organizationId === orgId && approval.isApproved)
			.map((approval: any) => approval.serviceVersionId);
		
		return serviceVersionsData
			.filter((service: any) => approvedServiceIds.includes(service._id))
			.map((service: any) => ({
				name: service.name,
				_id: service._id
			}));
	}

	function getSelectedServices(currentCVData: any, existingServiceAssignmentsData: any[], serviceVersionsData: any[]) {
		if (!currentCVData || !existingServiceAssignmentsData || !serviceVersionsData) return [];
		
		return existingServiceAssignmentsData
			.filter((assignment: any) => assignment.status !== 'inactive')
			.map((assignment: any) => {
				const serviceVersion = serviceVersionsData.find((version: any) => version._id === assignment.serviceVersionId);
				return serviceVersion?.name || '';
			})
			.filter(Boolean);
	}

	function getServiceRoles(currentCVData: any, existingServiceAssignmentsData: any[], serviceVersionsData: any[]) {
		if (!currentCVData || !existingServiceAssignmentsData || !serviceVersionsData) return {};
		
		const roles: Record<string, 'lead' | 'regular'> = {};
		
		existingServiceAssignmentsData
			.filter((assignment: any) => assignment.status !== 'inactive')
			.forEach((assignment: any) => {
				const serviceVersion = serviceVersionsData.find((version: any) => version._id === assignment.serviceVersionId);
				if (serviceVersion?.name) {
					roles[serviceVersion.name] = assignment.role;
				}
			});
		
		return roles;
	}
</script>

<!-- This component only provides context, no UI -->
{@render children?.()}
