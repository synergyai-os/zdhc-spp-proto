<script lang="ts">
	import UserCard from '$lib/components/UserCard.svelte';
	import ServiceBox from '$lib/components/ServiceBox.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import { organizationStore } from '$lib/stores/organization.svelte';
	
	// Organization context
	let currentOrgId = $state<string | null>(null);
	let orgContext = $derived($organizationStore);
	
	// Update currentOrgId when organization changes
	$effect(() => {
		currentOrgId = orgContext.currentOrganization?._id || null;
	});
	
	// Get data from Convex
	const users = useQuery(api.expertAssignments.getUsers, () => ({}));
	const organizations = useQuery(api.expertAssignments.getOrganizations, () => ({}));
	
	// Get expert assignments filtered by current organization
	const expertAssignments = useQuery(
		api.expertAssignments.getExpertAssignmentsByOrganizationWithDetails, 
		() => ({ organizationId: (currentOrgId || "j1j1j1j1j1j1j1j1j1j1j1j1") as any })
	);
	
	// Staff data
	const staffMembers = [
		{
			name: 'Ilaria Pellizzaro',
			role: 'Platform Administrator',
			initials: 'IP',
			status: 'active' as const,
			badge: 'Active',
			badgeColor: 'green' as const
		},
		{
			name: 'John Doe',
			role: 'System Manager',
			initials: 'JD',
			status: 'active' as const,
			badge: 'Active',
			badgeColor: 'green' as const
		},
		{
			name: 'Sarah Miller',
			role: 'Support Specialist',
			initials: 'SM',
			status: 'active' as const,
			badge: 'Active',
			badgeColor: 'green' as const
		}
	];
	
	// Services data
	const services = [
		{
			name: 'ETP Assessment',
			icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
			iconColor: 'green' as const,
			experts: [
				{ name: 'Dr. Maria Rodriguez', role: 'Lead Expert', initials: 'MR', isLead: true },
				{ name: 'Alex Kim', role: 'Senior Expert', initials: 'AK' },
				{ name: 'Lisa Thompson', role: 'Expert', initials: 'LT' },
				{ name: 'Robert Brown', role: 'Expert', initials: 'RB' },
				{ name: 'Emma Wilson', role: 'Junior Expert', initials: 'EW' }
			]
		},
		{
			name: 'Supplier Assessment',
			icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>',
			iconColor: 'purple' as const,
			experts: [
				{ name: 'Dr. Maria Rodriguez', role: 'Lead Expert', initials: 'MR', isLead: true },
				{ name: 'James Smith', role: 'Senior Expert', initials: 'JS' },
				{ name: 'Alex Kim', role: 'Expert', initials: 'AK', additionalServices: ['ETP'] },
				{ name: 'Nina Chen', role: 'Expert', initials: 'NC' }
			]
		},
		{
			name: 'Chemical Management',
			icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>',
			iconColor: 'orange' as const,
			experts: [
				{ name: 'Dr. David Lee', role: 'Lead Expert', initials: 'DL', isLead: true },
				{ name: 'Lisa Thompson', role: 'Expert', initials: 'LT', additionalServices: ['ETP'] },
				{ name: 'Michael Foster', role: 'Expert', initials: 'MF' }
			]
		}
	];
	
	function handleAddStaff() {
		console.log('Add new staff member');
	}
	
	function handleAddExpert() {
		// Navigate to add expert page
		window.location.href = '/user-management/add-expert';
	}
</script>

<!-- User Management Page -->
<div class="bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-6">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-4">User Management</h1>
			<p class="text-gray-600">Manage your staff and Solution Provider experts across different services.</p>
		</div>

		<!-- Staff Users Section -->
		<div class="mb-8">
			<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-800">Staff members</h2>
					<button 
						onclick={handleAddStaff}
						class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
					>
						Add Staff Member
					</button>
				</div>
				
				<!-- Staff Users Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each staffMembers as staff (staff.name)}
						<UserCard user={staff} size="lg" />
					{/each}
				</div>
			</div>
		</div>

		<!-- Saved Experts Section -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<div class="flex items-center justify-between mb-6">
				<div>
					<h2 class="text-xl font-bold text-gray-800">Saved Experts</h2>
					<p class="text-gray-600">
						{#if orgContext.currentOrganization}
							Experts for {orgContext.currentOrganization.name}
						{:else}
							Select an organization to view experts
						{/if}
					</p>
				</div>
				<div class="text-sm text-gray-500">
					{#if expertAssignments.isLoading}
						Loading...
					{:else if !currentOrgId}
						No organization selected
					{:else}
						Total: {expertAssignments.data?.length || 0} expert{(expertAssignments.data?.length || 0) !== 1 ? 's' : ''}
					{/if}
				</div>
			</div>
			
			{#if !currentOrgId}
				<div class="text-center py-8 text-gray-500">
					<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
					</svg>
					<p class="text-lg font-medium mb-2">No Organization Selected</p>
					<p class="text-sm">Use the organization switcher in the header to select an organization</p>
				</div>
			{:else if expertAssignments.isLoading}
				<div class="text-center py-8 text-gray-500">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p>Loading experts...</p>
				</div>
			{:else if expertAssignments.error}
				<div class="text-center py-8 text-red-500">
					<p class="text-lg font-medium mb-2">Error loading experts</p>
					<p class="text-sm">{expertAssignments.error.message}</p>
				</div>
			{:else if (expertAssignments.data?.length || 0) === 0}
				<div class="text-center py-8 text-gray-500">
					<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
					</svg>
					<p class="text-lg font-medium mb-2">No experts for this organization</p>
					<p class="text-sm">Use the "Add Expert" button below to add your first expert</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each expertAssignments.data as assignment (assignment._id)}
						{#if assignment.user}
							<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
								<div class="flex items-start justify-between mb-3">
									<div class="flex items-center">
										<div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
											{assignment.user.firstName[0]}{assignment.user.lastName[0]}
										</div>
										<div class="ml-3">
											<h3 class="font-semibold text-gray-800">{assignment.user.firstName} {assignment.user.lastName}</h3>
											<p class="text-sm text-gray-600">{assignment.user.email}</p>
										</div>
									</div>
									<span class="text-xs text-gray-500">
										{new Date(assignment.assignedAt).toLocaleDateString()}
									</span>
								</div>
								
								<div class="space-y-2">
									<div>
										<span class="text-xs font-medium text-gray-500">Services:</span>
										<div class="flex flex-wrap gap-1 mt-1">
											{#each assignment.services as service}
												<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
													{service}
												</span>
											{/each}
										</div>
									</div>
									
									<div class="flex items-center justify-between">
										<span class="px-2 py-1 text-xs rounded-full {
											assignment.status === 'active' ? 'bg-green-100 text-green-800' :
											assignment.status === 'certified' ? 'bg-blue-100 text-blue-800' :
											assignment.status === 'training' ? 'bg-yellow-100 text-yellow-800' :
											assignment.status === 'draft' ? 'bg-gray-100 text-gray-800' :
											assignment.status === 'rejected' ? 'bg-red-100 text-red-800' :
											'bg-gray-100 text-gray-800'
										}">
											{assignment.status.replace('_', ' ')}
										</span>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>

		<!-- Service Expert Lists -->
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-800">Your Services</h2>
				<button 
					onclick={handleAddExpert}
					class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
				>
					Add Expert
				</button>
			</div>
			
			{#each services as service (service.name)}
				<ServiceBox {service} />
			{/each}
		</div>
	</div>
</div>
