<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useQuery } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import { getCVStatusDisplayName, getCVStatusColor, canEditCVContent } from '../../../convex/model/status';
	import ExpertHeader from '$lib/components/expert-edit/ExpertHeader.svelte';
	import DevelopmentToolBar from '$lib/components/admin/DevelopmentToolBar.svelte';
	import CVTimelineCard from '$lib/components/expert-edit/CVTimelineCard.svelte';
	import ApprovedServicesCard from '$lib/components/expert-edit/ApprovedServicesCard.svelte';
	import CVStatusTracker from '$lib/components/CVStatusTracker.svelte';

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

	// Check if CV can be edited
	const canEdit = $derived.by(() => {
		if (!expertCV?.data) return false;
		const status = (expertCV.data as any).status;
		return canEditCVContent(status);
	});

	// Map CV status to tracker status format
	const getCVTrackerStatus = $derived.by((): 'paid' | 'in_review' | 'approved' | 'denied' | 'waiting_for_response' | null => {
		if (!expertCV?.data) return null;
		const cvStatus = (expertCV.data as any).status;
		
		// Map CV statuses to tracker statuses
		if (cvStatus === 'paid') return 'paid';
		if (cvStatus === 'locked_for_review') return 'in_review';
		if (cvStatus === 'unlocked_for_edits') return 'waiting_for_response';
		if (cvStatus === 'locked_final') return 'approved';
		
		// For statuses before paid, show as paid (pre-payment)
		if (['draft', 'completed', 'payment_pending'].includes(cvStatus)) {
			return 'paid';
		}
		
		return null;
	});

	// Determine if CV tracker should be shown
	const shouldShowCVTracker = $derived.by(() => {
		if (!expertCV?.data) return false;
		const cvStatus = (expertCV.data as any).status;
		// Show tracker for CVs that are paid or beyond
		return ['paid', 'locked_for_review', 'unlocked_for_edits', 'locked_final'].includes(cvStatus);
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
	<div class="max-w-7xl mx-auto px-6 py-8">
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
			<div class="flex gap-6">
				<!-- LEFT SIDEBAR: Expert Header & Development Tools -->
				<div class="w-80 flex-shrink-0 space-y-4">
					<ExpertHeader {userDetails} {expertCV} allUserAssignments={allUserAssignments} />
					
					<!-- Development Tools -->
					{#if expertCV?.data}
						<DevelopmentToolBar 
							userId={expertId as Id<'users'>}
							userIsActive={userDetails?.data?.isActive}
							cvStatus={(expertCV.data as any).status}
							cvId={(expertCV.data as any)._id}
							onActionCompleted={() => {
								console.log('🔧 Development tool action completed - data will refresh automatically');
							}}
						/>
					{/if}
				</div>

				<!-- MAIN CONTENT AREA -->
				<div class="flex-1 space-y-6">
					<!-- Approved Services Card -->
					{#if expertCV?.data}
						<ApprovedServicesCard 
							userId={expertId as Id<'users'>}
							organizationId={orgId as Id<'organizations'>}
							{expertCV}
							{allUserAssignments}
						/>
					{/if}

					<!-- CV Management Card -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div class="flex items-center justify-between mb-4">
							<div class="flex-1">
								<h2 class="text-lg font-semibold text-gray-900 mb-1">CV Management</h2>
								<p class="text-sm text-gray-600">
									{canEdit ? 'Edit and manage your expert CV' : 'View your expert CV'}
								</p>
							</div>
							{#if expertCV?.data}
								<a
									href="/experts/{expertId}/cv"
									class="inline-flex items-center px-4 py-2 {canEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white text-sm font-semibold rounded-lg transition-colors"
								>
									{#if canEdit}
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
										Edit CV
									{:else}
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
										View CV
									{/if}
								</a>
							{/if}
						</div>
						
						{#if shouldShowCVTracker && getCVTrackerStatus}
							<div class="pt-4 border-t border-gray-200">
								<CVStatusTracker status={getCVTrackerStatus} title="CV Approval Progress" />
							</div>
						{/if}
					</div>

					<!-- CV History Timeline -->
					<CVTimelineCard 
						userId={expertId as Id<'users'>} 
						organizationId={orgId as Id<'organizations'>} 
					/>
				</div>
			</div>
		{:else}
			<ExpertHeader {userDetails} {expertCV} />
		{/if}
	</div>
</div>

