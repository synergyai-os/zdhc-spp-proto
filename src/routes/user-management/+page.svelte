<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import type { Id } from '../../../convex/_generated/dataModel';
	import { getCVStatusColor } from '../../convex/model/status';

    const orgId = DEFAULT_ORG_ID;

	// Get expert CVs for the current organization
	const expertCVs = useQuery(api.expert.getCVs, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Get unique experts (users) who have CVs in this organization
	const experts = $derived.by(() => {
		if (!expertCVs?.data) return [];
		
		// Group CVs by user and get the latest CV for each user
		const userMap = new Map();
		
		expertCVs.data.forEach((cv: any) => {
			if (!userMap.has(cv.userId) || cv.version > userMap.get(cv.userId).version) {
				userMap.set(cv.userId, cv);
			}
		});
		
		return Array.from(userMap.values());
	});
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-900 mb-8">User Management</h1>
		
		<!-- Action Buttons -->
		<div class="mt-8 flex space-x-4">
			<a href="/user-management/add-expert" 
			   class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
				Add Expert
			</a>
			<a href="/checkout" 
			   class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
				Go to Checkout
			</a>
		</div>
        <br><br><br>

	{#if expertCVs?.isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-3 text-gray-600">Loading experts...</span>
		</div>
	{:else if expertCVs?.error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4">
			<p class="text-red-800">Error loading experts: {expertCVs.error}</p>
		</div>
	{:else if experts.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-500 text-lg">No experts found for this organization.</p>
		</div>
	{:else}
		<div class="bg-white shadow-sm rounded-lg overflow-hidden">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-medium text-gray-900">Experts ({experts.length})</h2>
			</div>
			
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Expert
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Email
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Account Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								CV Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								CV Version
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Assignments
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each experts as expert}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="flex-shrink-0 h-10 w-10">
											<div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
												<span class="text-white font-medium text-sm">
													{expert.user?.firstName?.[0]}{expert.user?.lastName?.[0]}
												</span>
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">
												{expert.user?.firstName} {expert.user?.lastName}
											</div>
											<div class="text-sm text-gray-500">
												{expert.user?.country}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{expert.user?.email}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
										{expert.user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
										{expert.user?.isActive ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getCVStatusColor(expert.status)}">
										{expert.status}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									v{expert.version}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									<div class="flex space-x-2">
										{#if expert.approvedCount > 0}
											<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
												{expert.approvedCount} approved
											</span>
										{/if}
										{#if expert.pendingCount > 0}
											<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
												{expert.pendingCount} pending
											</span>
										{/if}
										{#if expert.rejectedCount > 0}
											<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
												{expert.rejectedCount} rejected
											</span>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<a href="/user-management/experts/{expert.userId}/edit" 
									   class="text-blue-600 hover:text-blue-900">
										Edit CV
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
