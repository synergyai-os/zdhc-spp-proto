<script lang="ts">
	import { getCVStatusColor, getCVStatusDisplayName, canEditCVContent } from '../../../convex/model/status';

	interface Props {
		userDetails: any;
		expertCV: any;
	}

	let { userDetails, expertCV }: Props = $props();

	// Get user-friendly guidance message based on CV status
	function getStatusGuidance(status: string): { message: string; icon: string } {
		const guidance: Record<string, { message: string; icon: string }> = {
			draft: { 
				message: 'Complete your CV information below to proceed with service applications.',
				icon: '📝'
			},
			completed: { 
				message: 'Your CV is complete. Review and submit for approval when ready.',
				icon: '✅'
			},
			payment_pending: { 
				message: 'Payment is being processed. Please wait for confirmation.',
				icon: '💳'
			},
			paid: { 
				message: 'Payment received. Your CV is being prepared for review.',
				icon: '⏳'
			},
			locked_for_review: { 
				message: 'Your CV is under review. Changes are restricted at this time.',
				icon: '👀'
			},
			unlocked_for_edits: { 
				message: 'Review completed. Please update your CV based on the feedback provided.',
				icon: '✏️'
			},
			locked_final: { 
				message: 'Your CV is finalized and approved. No further edits are allowed.',
				icon: '🔒'
			}
		};
		return guidance[status] || { message: 'Review your CV status below.', icon: 'ℹ️' };
	}
</script>

<!-- Loading State -->
{#if expertCV?.isLoading}
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
		<p class="text-gray-600">Loading CV data...</p>
	</div>
{:else if expertCV?.error}
	<div class="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
		<h2 class="text-xl font-semibold text-red-800 mb-2">Error Loading CV</h2>
		<p class="text-red-600 mb-4">{expertCV.error}</p>
		<button onclick={() => window.location.reload()} class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
			Try Again
		</button>
	</div>
{:else if !expertCV?.data}
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
		<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
			<span class="text-2xl">👤</span>
		</div>
		<h2 class="text-xl font-semibold text-gray-900 mb-2">No CV Found</h2>
		<p class="text-gray-600 mb-4">This expert doesn't have a CV yet.</p>
		<button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
			Create New CV
		</button>
	</div>
{:else}
	<!-- Expert Header with Status - Compact sidebar version -->
	<div class="space-y-4">
		<!-- User Info Card -->
		{#if userDetails?.data}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div class="flex items-center space-x-3 mb-3">
					<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
						<span class="text-lg font-semibold text-blue-600">
							{userDetails.data.firstName[0]}{userDetails.data.lastName[0]}
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<h1 class="text-lg font-bold text-gray-900 truncate">
							{userDetails.data.firstName} {userDetails.data.lastName}
						</h1>
						<p class="text-xs text-gray-600 truncate">{userDetails.data.email}</p>
					</div>
				</div>
				<div class="pt-3 border-t border-gray-200">
					<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {userDetails.data.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
						{userDetails.data.isActive ? '✓ Active' : 'Inactive'}
					</span>
				</div>
			</div>
		{/if}

		<!-- CV Status Card -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div class="flex items-center space-x-2 mb-3">
				<span class="text-2xl">{getStatusGuidance(expertCV.data.status).icon}</span>
				<div class="flex-1 min-w-0">
					<p class="text-xs font-medium text-gray-500">Status</p>
					<p class="text-sm font-semibold text-gray-900 truncate">
						{getCVStatusDisplayName(expertCV.data.status)}
					</p>
				</div>
				<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getCVStatusColor(expertCV.data.status)}">
					{getCVStatusDisplayName(expertCV.data.status)}
				</span>
			</div>

			<!-- Guidance Message -->
			<div class="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
				<svg class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<p class="text-blue-900">{getStatusGuidance(expertCV.data.status).message}</p>
			</div>

			<!-- Quick Stats -->
			<div class="grid grid-cols-3 gap-2 mt-3">
				<div class="text-center p-2 bg-gray-50 rounded">
					<div class="text-lg font-bold text-gray-900">{expertCV.data.experience?.length || 0}</div>
					<div class="text-xs text-gray-500">Exp</div>
				</div>
				<div class="text-center p-2 bg-gray-50 rounded">
					<div class="text-lg font-bold text-gray-900">{expertCV.data.education?.length || 0}</div>
					<div class="text-xs text-gray-500">Edu</div>
				</div>
				<div class="text-center p-2 bg-gray-50 rounded">
					<div class="text-lg font-bold text-gray-900">{expertCV.data.trainingQualifications?.length || 0}</div>
					<div class="text-xs text-gray-500">Train</div>
				</div>
			</div>

			<!-- Edit Status Indicator -->
			{#if !canEditCVContent(expertCV.data.status)}
				<div class="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
					<div class="flex items-start space-x-2">
						<svg class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
						</svg>
						<span class="text-amber-800">
							CV is locked. Contact admin if changes needed.
						</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
