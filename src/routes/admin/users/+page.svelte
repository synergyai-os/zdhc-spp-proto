<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';

	// Get all users
	const usersData = useQuery(api.utilities.getUsers, {});

	// Get all CVs to find user organizations and roles
	const allCVs = useQuery(api.expert.getCVs, {});

	// Enrich users with organization and role info
	let users = $derived.by(() => {
		if (!usersData?.data || !allCVs?.data) return [];

		return usersData.data.map((user) => {
			// Find CVs for this user
			const userCVs = allCVs.data.filter((cv) => cv.userId === user._id);

			// Get unique organizations from CVs
			const organizations = Array.from(
				new Set(
					userCVs
						.map((cv) => cv.organization?.name)
						.filter((name): name is string => !!name)
				)
			);

			// Determine role - if user has CVs, they're likely an expert/manager
			// For now, we'll show "Expert" if they have CVs, otherwise "User"
			const role = userCVs.length > 0 ? 'Expert' : 'User';

			// Get primary organization (first one found)
			const primaryOrganization = organizations[0] || '—';

			return {
				...user,
				role,
				organizations,
				primaryOrganization,
				cvCount: userCVs.length
			};
		});
	});

	let isLoading = $derived(!usersData || usersData.isLoading || !allCVs || allCVs.isLoading);
</script>

<svelte:head>
	<title>Users | Admin</title>
</svelte:head>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-2xl font-semibold text-gray-900 mb-1">Users</h1>
		<p class="text-sm text-gray-500">Manage all platform users</p>
	</div>

	{#if isLoading}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<div class="text-gray-500">Loading users...</div>
		</div>
	{:else if users.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<div class="text-gray-500">No users found</div>
		</div>
	{:else}
		<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Role
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Organization
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each users as user}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">
									{user.firstName} {user.lastName}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-500">{user.email}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-500">{user.country}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-500">{user.role}</div>
								{#if user.cvCount > 0}
									<div class="text-xs text-gray-400">{user.cvCount} CV{user.cvCount !== 1 ? 's' : ''}</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-500">{user.primaryOrganization}</div>
								{#if user.organizations.length > 1}
									<div class="text-xs text-gray-400">+{user.organizations.length - 1} more</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {user.isActive
									? 'bg-green-100 text-green-800'
									: 'bg-gray-100 text-gray-800'}">
									{user.isActive ? 'active' : 'inactive'}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

