<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import { DEFAULT_ORG_ID } from '$lib/config';

	// Using hardcoded organization ID
	const currentOrgId = DEFAULT_ORG_ID;

	// Get draft experts count for current organization (unique experts, not assignments)
	const draftExperts = useQuery(
		api.adminCVReview.getExpertsForCVReview,
		() => ({ organizationId: currentOrgId as any, status: 'draft' as const })
	);

	// Get expert name from URL params or localStorage
	let expertName = $state('');

	// Try to get expert name from localStorage (set by add-expert wizard)
	$effect(() => {
		if (typeof window !== 'undefined') {
			const savedExpertName = localStorage.getItem('spp_last_added_expert');
			if (savedExpertName) {
				expertName = savedExpertName;
				// Clear it after reading
				localStorage.removeItem('spp_last_added_expert');
			}
		}
	});

	// Navigation functions
	function goToAddExpert() {
		window.location.href = '/user-management/add-expert';
	}

	function goToCheckout() {
		window.location.href = '/checkout';
	}

	function goToUserManagement() {
		window.location.href = '/user-management?section=experts';
	}

	// Get draft count (unique experts, not assignments)
	let draftCount = $derived.by(() => {
		if (!draftExperts?.data) return 0;

		// Count unique experts by userId
		const uniqueExpertIds = new Set();
		draftExperts.data.forEach((assignment: any) => {
			if (assignment.userId) {
				uniqueExpertIds.add(assignment.userId);
			}
		});

		return uniqueExpertIds.size;
	});
</script>

<div class="bg-gray-50 min-h-screen py-8">
	<div class="max-w-4xl mx-auto px-6">
		<!-- Success Header -->
		<div class="text-center mb-8">
			<div
				class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"
			>
				<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Expert Added Successfully!</h1>
			{#if expertName}
				<p class="text-lg text-gray-600">
					Expert "{expertName}" has been added to your organization
				</p>
			{:else}
				<p class="text-lg text-gray-600">Your expert has been added to your organization</p>
			{/if}
		</div>

		<!-- Draft Experts Info -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				<div>
					<p class="text-sm font-medium text-blue-800">
						You have {draftCount} expert{draftCount !== 1 ? 's' : ''} in draft status
					</p>
					<p class="text-xs text-blue-700 mt-1">
						{draftCount > 0 ? 'Ready for payment processing' : 'No pending payments'}
					</p>
				</div>
			</div>
		</div>

		<!-- Action Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<!-- Add Another Expert -->
			<button
				type="button"
				onclick={goToAddExpert}
				class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left w-full"
			>
				<div class="text-center">
					<div
						class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4"
					>
						<svg
							class="h-6 w-6 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Add Another Expert</h3>
					<p class="text-sm text-gray-600 mb-4">Continue adding more experts to your team</p>
					<div class="text-blue-600 text-sm font-medium">Continue Adding →</div>
				</div>
			</button>

			<!-- Continue to Payment -->
			<button
				type="button"
				onclick={draftCount > 0 ? goToCheckout : null}
				disabled={draftCount === 0}
				class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left w-full {draftCount ===
				0
					? 'opacity-50 cursor-not-allowed'
					: ''}"
			>
				<div class="text-center">
					<div
						class="mx-auto flex items-center justify-center h-12 w-12 rounded-full {draftCount > 0
							? 'bg-green-100'
							: 'bg-gray-100'} mb-4"
					>
						<svg
							class="h-6 w-6 {draftCount > 0 ? 'text-green-600' : 'text-gray-400'}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Continue to Payment</h3>
					<p class="text-sm text-gray-600 mb-4">
						{draftCount > 0
							? `Process payment for ${draftCount} expert${draftCount !== 1 ? 's' : ''}`
							: 'No experts ready for payment'}
					</p>
					<div class="text-sm font-medium {draftCount > 0 ? 'text-green-600' : 'text-gray-400'}">
						{draftCount > 0 ? 'Proceed to Payment →' : 'No Payment Needed'}
					</div>
				</div>
			</button>

			<!-- Back to Dashboard -->
			<button
				type="button"
				onclick={goToUserManagement}
				class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left w-full"
			>
				<div class="text-center">
					<div
						class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4"
					>
						<svg
							class="h-6 w-6 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Back to Dashboard</h3>
					<p class="text-sm text-gray-600 mb-4">Return to user management overview</p>
					<div class="text-gray-600 text-sm font-medium">View Dashboard →</div>
				</div>
			</button>
		</div>
	</div>
</div>
