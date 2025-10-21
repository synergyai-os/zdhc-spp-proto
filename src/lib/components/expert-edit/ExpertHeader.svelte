<script lang="ts">
	import { getCVStatusColor } from '../../../convex/model/status';

	interface Props {
		userDetails: any;
		expertCV: any;
	}

	let { userDetails, expertCV }: Props = $props();
</script>

<!-- User Details Card (Top Section) -->
{#if userDetails?.isLoading}
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
		<p class="text-gray-600">Loading expert details...</p>
	</div>
{:else if userDetails?.error}
	<div class="bg-white rounded-lg shadow-sm border border-red-200 p-6 mb-6">
		<h2 class="text-lg font-semibold text-red-800 mb-2">Error Loading Expert</h2>
		<p class="text-red-600">{userDetails.error}</p>
	</div>
{:else if userDetails?.data}
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
		<div class="flex items-start justify-between">
			<div>
				<h2 class="text-xl font-semibold text-gray-800">{userDetails.data.firstName} {userDetails.data.lastName}</h2>
				<p class="text-sm text-gray-600 mt-1">{userDetails.data.email}</p>
			</div>
			<span class="px-2 py-1 rounded text-xs font-medium {userDetails.data.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
				{userDetails.data.isActive ? 'Active' : 'Inactive'}
			</span>
		</div>
	</div>
{/if}

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
{:else if expertCV?.data}
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
		<h2 class="text-xl font-semibold text-gray-800 mb-4">CV Found!</h2>
		<div class="space-y-2 text-sm">
			<p><strong>CV ID:</strong> {expertCV.data._id}</p>
			<p><strong>Status:</strong> 
				<span class="px-2 py-1 rounded text-xs font-medium {getCVStatusColor(expertCV.data.status)}">
					{expertCV.data.status}
				</span>
			</p>
			<p><strong>Version:</strong> {expertCV.data.version}</p>
			<p><strong>Experience entries:</strong> {expertCV.data.experience?.length || 0}</p>
			<p><strong>Education entries:</strong> {expertCV.data.education?.length || 0}</p>
		</div>
	</div>
{/if}
