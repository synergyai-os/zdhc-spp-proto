<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useQuery } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import { getCVStatusColor, getCVStatusDisplayName } from '../../../convex/model/status';

	const expertId = $derived($page.params.expertId);
	const orgId = DEFAULT_ORG_ID;

	// Data queries
	const userDetails = useQuery(api.expert.getUser, () => ({
		userId: expertId as Id<'users'>
	}));

	const expertCV = useQuery(api.expert.getLatestCV, () => ({
		userId: expertId as Id<'users'>,
		organizationId: orgId as Id<'organizations'>
	}));

	// Get all service assignments for this user across all CVs
	const allUserAssignments = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => ({
		userId: expertId as Id<'users'>,
		organizationId: orgId as Id<'organizations'>
	}));

	// Calculate approved services count
	const approvedServicesCount = $derived.by(() => {
		if (!allUserAssignments?.data) return 0;
		return allUserAssignments.data.filter(
			(a: any) => a.status === 'approved' && a.expertCV?.status === 'locked_final'
		).length;
	});

	// Get unique approved service names
	const approvedServices = $derived.by(() => {
		if (!allUserAssignments?.data) return [];
		const serviceNames = allUserAssignments.data
			.filter((a: any) => a.status === 'approved' && a.expertCV?.status === 'locked_final')
			.map((a: any) => a.serviceVersion?.name)
			.filter(Boolean);
		return [...new Set(serviceNames)];
	});
</script>

<svelte:head>
	<title>
		{userDetails?.data
			? `${userDetails.data.firstName} ${userDetails.data.lastName} - Expert Profile`
			: 'Expert Profile'}
	</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen">
	<div class="max-w-4xl mx-auto px-6 py-8">
		{#if userDetails?.isLoading}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p class="text-gray-600">Loading expert profile...</p>
			</div>
		{:else if userDetails?.error}
			<div class="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
				<h2 class="text-xl font-semibold text-red-800 mb-2">Error Loading Profile</h2>
				<p class="text-red-600">{userDetails.error?.message || 'Unknown error'}</p>
			</div>
		{:else if userDetails?.data}
			<!-- Header Card -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="flex items-center space-x-4 mb-6">
					<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
						<span class="text-2xl font-semibold text-blue-600">
							{userDetails.data.firstName[0]}{userDetails.data.lastName[0]}
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<h1 class="text-2xl font-bold text-gray-900">
							{userDetails.data.firstName} {userDetails.data.lastName}
						</h1>
						<p class="text-gray-600">{userDetails.data.email}</p>
					</div>
					<a
						href="/experts/{expertId}/cv"
						class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
						Edit CV
					</a>
				</div>

				<!-- Status Badges -->
				<div class="flex items-center space-x-4 pt-4 border-t border-gray-200">
					<span
						class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {userDetails.data.isActive
							? 'bg-green-100 text-green-800'
							: 'bg-gray-100 text-gray-800'}"
					>
						{userDetails.data.isActive ? '✓ Active' : 'Inactive'}
					</span>
					{#if expertCV?.data}
						<span
							class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getCVStatusColor(expertCV.data.status)}"
						>
							{getCVStatusDisplayName(expertCV.data.status)} - CV v{expertCV.data.version}
						</span>
					{/if}
				</div>
			</div>

			<!-- Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<!-- Approved Services -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div class="text-sm text-gray-600 mb-1">Approved Services</div>
					<div class="text-2xl font-bold text-gray-900">{approvedServicesCount}</div>
				</div>

				<!-- CV Status -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div class="text-sm text-gray-600 mb-1">CV Status</div>
					<div class="text-lg font-semibold text-gray-900">
						{expertCV?.data ? getCVStatusDisplayName(expertCV.data.status) : 'No CV'}
					</div>
				</div>

				<!-- CV Version -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div class="text-sm text-gray-600 mb-1">CV Version</div>
					<div class="text-2xl font-bold text-gray-900">
						{expertCV?.data ? `v${expertCV.data.version}` : 'N/A'}
					</div>
				</div>
			</div>

			<!-- Approved Services List -->
			{#if approvedServices.length > 0}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Approved Services</h2>
					<div class="flex flex-wrap gap-2">
						{#each approvedServices as serviceName}
							<span
								class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
							>
								{serviceName}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

