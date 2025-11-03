<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib';
	import type { Id } from '$lib';
	import { getContext } from 'svelte';

	const orgId = getContext('orgId');

	// Get users for the organization
	const usersQuery = useQuery(api.expert.getUsersByOrganization, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// Split users into active and inactive
	const usersData = $derived(usersQuery?.data || []);
	const activeUsers = $derived(
		usersData.filter((user: any) => user.isActive)
	);
	const inactiveUsers = $derived(
		usersData.filter((user: any) => !user.isActive)
	);
</script>

{#if usersQuery?.isLoading}
	<div class="flex justify-center items-center py-12">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
	</div>
{:else if usersQuery?.error}
	<div class="bg-red-50 border border-red-200 rounded-md p-4">
		<p class="text-red-800">
			Error loading users: {usersQuery.error.message}
		</p>
	</div>
{:else}
	<div class="space-y-8">
		<!-- Active Users Section -->
		<div>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">
					Active Users
					<span class="ml-2 text-sm font-normal text-gray-500">({activeUsers.length})</span>
				</h2>
			</div>
			{#if activeUsers.length > 0}
				<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Name
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Email
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Country
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each activeUsers as user}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4">
										<div class="flex items-center">
											<div class="flex-shrink-0 h-10 w-10">
												<div
													class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center"
												>
													<span class="text-white font-medium text-sm">
														{user.firstName?.[0]}{user.lastName?.[0]}
													</span>
												</div>
											</div>
											<div class="ml-4">
												<div class="text-sm font-medium text-gray-900">
													{user.firstName} {user.lastName}
												</div>
											</div>
										</div>
									</td>
									<td class="px-6 py-4 text-sm text-gray-500">{user.email}</td>
									<td class="px-6 py-4 text-sm text-gray-500">{user.country}</td>
									<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<a
											href="/experts/{user._id}"
											class="text-blue-600 hover:text-blue-900"
										>
											View Profile
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
					<p class="text-gray-500">No active users found</p>
				</div>
			{/if}
		</div>

		<!-- Inactive Users Section -->
		<div>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">
					Inactive Users
					<span class="ml-2 text-sm font-normal text-gray-500">({inactiveUsers.length})</span>
				</h2>
			</div>
			{#if inactiveUsers.length > 0}
				<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Name
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Email
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Country
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each inactiveUsers as user}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4">
										<div class="flex items-center">
											<div class="flex-shrink-0 h-10 w-10">
												<div
													class="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center"
												>
													<span class="text-white font-medium text-sm">
														{user.firstName?.[0]}{user.lastName?.[0]}
													</span>
												</div>
											</div>
											<div class="ml-4">
												<div class="text-sm font-medium text-gray-900">
													{user.firstName} {user.lastName}
												</div>
											</div>
										</div>
									</td>
									<td class="px-6 py-4 text-sm text-gray-500">{user.email}</td>
									<td class="px-6 py-4 text-sm text-gray-500">{user.country}</td>
									<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<a
											href="/experts/{user._id}"
											class="text-blue-600 hover:text-blue-900"
										>
											View Profile
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
					<p class="text-gray-500">No inactive users found</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

