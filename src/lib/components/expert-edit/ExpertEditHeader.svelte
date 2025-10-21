<script lang="ts">
	import { getCVStatusColor, getCVStatusDisplayName, type CVStatus } from '../../../convex/model/status';

	interface Props {
		userDataResult: any;
		currentCVData: {
			status: CVStatus;
			version: number;
		};
	}

	let { userDataResult, currentCVData }: Props = $props();
</script>

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
					class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getCVStatusColor(currentCVData.status)}"
				>
					{getCVStatusDisplayName(currentCVData.status)} - CV v{currentCVData.version}
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