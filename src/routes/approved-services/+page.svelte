<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import { organizationStore } from '$lib/stores/organization.svelte';
	import ToggleSwitch from '$lib/components/ToggleSwitch.svelte';
	
	const client = useConvexClient();
	
	// Get current organization from store
	let currentOrg = $derived($organizationStore?.currentOrganization);
	let currentOrgId = $derived(currentOrg?._id);
	
	// Debug organization loading
	$effect(() => {
		console.log('=== ORGANIZATION DEBUG ===');
		console.log('Organization store:', $organizationStore);
		console.log('Current org:', currentOrg);
		console.log('Current org ID:', currentOrgId);
		console.log('Available orgs:', $organizationStore?.availableOrganizations);
		console.log('========================');
	});
	
	
	// State
	let isLoading = $state(false);
	let error = $state('');
	let successMessage = $state('');
	let queryRefreshKey = $state(0);
	
	// Fetch data - only when organization is selected
	const serviceParents = useQuery(
		(api as any).serviceVersions.getServiceParents, 
		{}
	);
	const serviceVersions = useQuery(
		(api as any).serviceVersions.getServiceVersions, 
		{}
	);
	const organizationApprovals = useQuery(
		(api as any).serviceVersions.getOrganizationApprovals, 
		() => currentOrgId ? { organizationId: currentOrgId, refreshKey: queryRefreshKey } : { organizationId: "", refreshKey: queryRefreshKey }
	);
	
	// Group service versions by parent with approval status
	let groupedServices = $derived.by(() => {
		// Access the reactive data directly in the derived function
		const parents = serviceParents?.data;
		const versions = serviceVersions?.data;
		const approvals = organizationApprovals?.data;
		
		// Force reactivity by accessing the query objects themselves
		serviceParents;
		serviceVersions;
		organizationApprovals;
		
		
		if (!parents || !versions) return [];
		
		return parents.map((parent: any) => {
			// Filter versions that belong to this parent
			const parentVersions = versions.filter((version: any) => 
				version.parentId === parent._id
			).map((version: any) => {
				// Check if this version is approved - get the most recent approval record
				const versionApprovals = approvals?.filter((approval: any) => 
					approval.serviceVersionId === version._id
				) || [];
				
				// Sort by updatedAt descending to get the most recent
				const mostRecentApproval = versionApprovals.sort((a: any, b: any) => 
					b.updatedAt - a.updatedAt
				)[0];
				
				const isApproved = mostRecentApproval?.status === 'approved' || false;
				
				
				return {
					...version,
					isApproved
				};
			});
			
			return {
				...parent,
				versions: parentVersions
			};
		});
	});
	
	// Toggle service approval
	async function toggleServiceApproval(serviceVersionId: string, serviceName: string) {
		if (!currentOrgId) {
			error = 'Please select an organization first';
			return;
		}
		
		isLoading = true;
		error = '';
		successMessage = '';
		
		try {
			const result = await client.mutation((api as any).serviceVersions.toggleOrganizationServiceApproval, {
				organizationId: currentOrgId,
				serviceVersionId: serviceVersionId,
				notes: `Toggled by prototype user at ${new Date().toISOString()}`
			});
			
			
			if (result.status === 'approved') {
				successMessage = `Approved ${serviceName}`;
			} else {
				successMessage = `Removed approval for ${serviceName}`;
			}
			
			// Add a small delay to ensure mutation is committed before query refresh
			setTimeout(() => {
				queryRefreshKey++;
			}, 100);
		} catch (err) {
			error = `Failed to update approval: ${err}`;
		} finally {
			isLoading = false;
		}
	}
	
	// Clear messages after 3 seconds
	$effect(() => {
		if (successMessage || error) {
			const timer = setTimeout(() => {
				successMessage = '';
				error = '';
			}, 3000);
			return () => clearTimeout(timer);
		}
	});
</script>

<div class="container mx-auto p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">Approved Services</h1>
		<p class="text-gray-600">
			Manage service approvals for the selected organization. Toggle services on/off to test different scenarios.
		</p>
	</div>

	<!-- Current Organization Display -->
	{#if currentOrg}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
			<div class="flex items-center space-x-3">
				<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
				</svg>
				<div>
					<h2 class="text-lg font-semibold text-blue-900">Current Organization</h2>
					<p class="text-blue-700">{currentOrg.name}</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
			<div class="flex items-center space-x-3">
				<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
				</svg>
				<div>
					<h2 class="text-lg font-semibold text-yellow-900">No Organization Selected</h2>
					<p class="text-yellow-700">Please select an organization from the dropdown in the header to manage service approvals.</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Messages -->
	{#if successMessage}
		<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
			<div class="flex items-center space-x-3">
				<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
				</svg>
				<p class="text-green-700 font-medium">{successMessage}</p>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
			<div class="flex items-center space-x-3">
				<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
				</svg>
				<p class="text-red-700 font-medium">{error}</p>
			</div>
		</div>
	{/if}

	<!-- Services Table -->
	{#if !currentOrgId}
		<div class="text-center py-12">
			<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
			<p class="text-gray-500">Choose an organization from the dropdown above to manage service approvals.</p>
		</div>
	{:else if serviceParents?.isLoading || serviceVersions?.isLoading || (currentOrgId && organizationApprovals?.isLoading)}
		<div class="text-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p class="text-gray-500">Loading services for {currentOrg?.name}...</p>
		</div>
	{:else if serviceParents?.error || serviceVersions?.error || (currentOrgId && organizationApprovals?.error)}
		<div class="text-center py-12">
			<svg class="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Services</h3>
			<p class="text-gray-500 mb-4">
				{serviceParents?.error || serviceVersions?.error || (currentOrgId && organizationApprovals?.error)}
			</p>
		</div>
	{:else if !serviceParents?.data || !serviceVersions?.data}
		<div class="text-center py-12">
			<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No Services Available</h3>
			<p class="text-gray-500 mb-4">No service parents or versions found. Please seed the data first.</p>
			<a 
				href="/test-service-versioning" 
				class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
				</svg>
				Go to Test Page to Seed Data
			</a>
		</div>
	{:else if groupedServices.length === 0}
		<div class="text-center py-12">
			<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No Services Available</h3>
			<p class="text-gray-500 mb-4">No service parents or versions found. Please seed the data first.</p>
			<a 
				href="/test-service-versioning" 
				class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
				</svg>
				Go to Test Page to Seed Data
			</a>
		</div>
	{:else}
		<div class="space-y-6">
			{#each groupedServices as serviceParent (serviceParent._id)}
				<div class="bg-white border border-gray-200 rounded-lg shadow-sm">
					<!-- Service Parent Header -->
					<div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold text-gray-900">{serviceParent.name}</h3>
								<p class="text-sm text-gray-600 mt-1">{serviceParent.description}</p>
							</div>
							<div class="flex items-center space-x-2">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{serviceParent.versions.length} version{serviceParent.versions.length !== 1 ? 's' : ''}
								</span>
								{#if serviceParent.isActive}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
										Active
									</span>
								{:else}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
										Inactive
									</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Service Versions -->
					<div class="divide-y divide-gray-200">
						{#each serviceParent.versions as version (version._id)}
							<div class="px-6 py-4">
								<div class="flex items-center justify-between">
									<div class="flex-1 min-w-0">
										<div class="flex items-center space-x-3">
											<h4 class="text-sm font-medium text-gray-900 truncate">
												{version.name}
											</h4>
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
												{version.version}
											</span>
										</div>
										<p class="text-sm text-gray-600 mt-1">{version.description}</p>
										<div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
											<span>Released: {new Date(version.releasedAt).toLocaleDateString()}</span>
											{#if version.deprecatedAt}
												<span class="text-red-600">Deprecated: {new Date(version.deprecatedAt).toLocaleDateString()}</span>
											{/if}
										</div>
									</div>
									
									<!-- Toggle Switch -->
									<div class="flex items-center space-x-3">
										<span class="text-sm text-gray-500">
											{version.isApproved ? 'Approved' : 'Not Approved'}
										</span>
										<ToggleSwitch
											id={`toggle-${version._id}`}
											checked={version.isApproved}
											onToggle={() => toggleServiceApproval(version._id, version.name)}
											disabled={isLoading}
											size="md"
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
