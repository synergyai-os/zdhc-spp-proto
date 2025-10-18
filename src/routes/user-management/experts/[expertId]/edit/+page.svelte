<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
		
	// ==========================================
	// 1. SETUP & DATA
	// ==========================================
	const expertId = $derived($page.params.expertId);
	const orgId = DEFAULT_ORG_ID;
	const client = useConvexClient();

	// Data queries
	const expertCV = useQuery(api.expert.getLatestCV, () => ({
		userId: expertId as Id<'users'>,
		organizationId: orgId as Id<'organizations'>
	}));

	const assignedServices = useQuery(api.expert.getServicesByCV, () => {
		if (!expertCV?.data) return getDummyServiceQueryArgs();
		return getRealServiceQueryArgs();
	});

	const availableServices = useQuery(api.services.getApprovedServices, () => ({
		organizationId: orgId as Id<'organizations'>
	}));

	// ==========================================
	// 2. STATE
	// ==========================================
	let selectedServices = $derived(getSelectedServiceIds());
	let isSaving = $state(false);
	let saveError = $state(null);
	
	// ==========================================
	// 2. FUNCTIONS
	// ==========================================
	
	// Helper functions for cleaner code
	function getDummyServiceQueryArgs() {
		return {
			cvId: 'dummy' as Id<'expertCVs'>,
			userId: expertId as Id<'users'>,
			organizationId: orgId as Id<'organizations'>
		};
	}
	
	function getRealServiceQueryArgs() {
		return {
			cvId: expertCV.data._id as Id<'expertCVs'>,
			userId: expertId as Id<'users'>,
			organizationId: orgId as Id<'organizations'>
		};
	}
	
	function getSelectedServiceIds() {
		if (!assignedServices?.data) return [];
		return assignedServices.data.map((assignment: any) => assignment.serviceVersionId);
	}
	
	// Analysis function for save logic
	function analyzeServiceChanges() {
		const current = assignedServices?.data || [];
		const selected = selectedServices;
		
		// Convert current assignments to service IDs for comparison
		const currentServiceIds = current.map((assignment: any) => assignment.serviceVersionId);
		
		return {
			toAdd: selected.filter((id: any) => !currentServiceIds.includes(id)),
			toRemove: currentServiceIds.filter((id: any) => !selected.includes(id)),
			toUpdate: [] // Skip role updates for now
		};
	}
	
	// Action functions for save logic
	async function addServiceAssignment(serviceId: string) {
		if (!expertCV?.data) {
			throw new Error('No CV data available');
		}
		
		return client.mutation(api.expert.addService, {
			cvId: expertCV.data._id as Id<'expertCVs'>,
			userId: expertId as Id<'users'>,
			organizationId: orgId as Id<'organizations'>,
			serviceVersionId: serviceId as Id<'serviceVersions'>
		});
	}
	
	async function removeServiceAssignment(serviceId: string) {
		if (!expertCV?.data) {
			throw new Error('No CV data available');
		}
		
		return client.mutation(api.expert.removeService, {
			cvId: expertCV.data._id as Id<'expertCVs'>,
			userId: expertId as Id<'users'>,
			organizationId: orgId as Id<'organizations'>,
			serviceVersionId: serviceId as Id<'serviceVersions'>
		});
	}
	
	async function save() {
		isSaving = true;
		saveError = null;
		
		try {
			// Step 1: Analyze what changes need to be made
			const changes = analyzeServiceChanges();
			console.log('📊 Changes to make:', changes);
			console.log('Current assigned services:', assignedServices?.data);
			console.log('User selected services:', selectedServices);
			
			// Step 2: Execute the changes
			if (changes.toAdd.length > 0) {
				console.log('➕ Adding services:', changes.toAdd);
				for (const serviceId of changes.toAdd) {
					await addServiceAssignment(serviceId);
					console.log(`✅ Added service: ${serviceId}`);
				}
			}
			
			if (changes.toRemove.length > 0) {
				console.log('➖ Removing services:', changes.toRemove);
				for (const serviceId of changes.toRemove) {
					await removeServiceAssignment(serviceId);
					console.log(`✅ Removed service: ${serviceId}`);
				}
			}
			
			if (changes.toAdd.length === 0 && changes.toRemove.length === 0) {
				console.log('✅ No changes needed');
			}
			
			console.log('🎉 Save completed successfully!');
			
		} catch (error: any) {
			saveError = error.message;
			console.error('❌ Save failed:', error);
		} finally {
			isSaving = false;
		}
	}

	function handleError(error: any) {
		saveError = error.message;
		console.error('❌ Error:', error);
	}








	

	// ==========================================
	// 3. EFFECTS & REACTIVE LOGIC
	// ==========================================
	
	// Debug: Log the data to see what we're getting
	$effect(() => {
		console.log('🔍 Expert CV:', {
			isLoading: expertCV?.isLoading,
			hasData: !!expertCV?.data,
			data: expertCV?.data,
			error: expertCV?.error
		});
		console.log('🔍 Assigned Services:', {
			isLoading: assignedServices?.isLoading,
			hasData: !!assignedServices?.data,
			data: assignedServices?.data,
			error: assignedServices?.error
		});
		console.log('🔍 Available Services:', {
			isLoading: availableServices?.isLoading,
			hasData: !!availableServices?.data,
			data: availableServices?.data,
			error: availableServices?.error
		});
		console.log('🔍 Selected Services:', selectedServices);
	});
</script>

<!-- 5. Simple template -->
<div class="max-w-4xl mx-auto px-6 py-8">
	<h1 class="text-3xl font-bold text-gray-800 mb-6">Edit Expert CV</h1>
	
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
				<p><strong>Status:</strong> {expertCV.data.status}</p>
				<p><strong>Version:</strong> {expertCV.data.version}</p>
				<p><strong>Experience entries:</strong> {expertCV.data.experience?.length || 0}</p>
				<p><strong>Education entries:</strong> {expertCV.data.education?.length || 0}</p>
			</div>

			<!-- Assigned Services Section -->
			<div class="mt-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-3">Assigned Services</h3>
				{#if assignedServices?.isLoading}
					<p class="text-gray-500">Loading assigned services...</p>
				{:else if assignedServices?.error}
					<p class="text-red-500">Error loading assigned services: {assignedServices.error}</p>
				{:else if assignedServices?.data && assignedServices.data.length > 0 && expertCV?.data}
					<div class="space-y-2">
						{#each assignedServices.data as assignment}
							<div class="bg-gray-50 p-3 rounded border">
								<p><strong>Service:</strong> {assignment.serviceName}</p>
								<p><strong>Role:</strong> {assignment.role}</p>
								<p><strong>Status:</strong> {assignment.status}</p>
								{#if assignment.serviceDescription}
									<p class="text-sm text-gray-600">{assignment.serviceDescription}</p>
								{/if}
						</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500">No assigned services found</p>
				{/if}
			</div>

			<!-- Available Services Section -->
			<div class="mt-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-3">Available Services</h3>
				<p class="text-sm text-gray-600 mb-4">Selected: {selectedServices.length} services</p>
				{#if availableServices?.isLoading}
					<p class="text-gray-500">Loading available services...</p>
				{:else if availableServices?.error}
					<p class="text-red-500">Error loading services: {availableServices.error}</p>
				{:else if availableServices?.data && availableServices.data.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each availableServices.data as service}
							<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
								<div class="flex items-start space-x-3">
									<input 
										type="checkbox" 
										id="service-{service._id}"
										bind:group={selectedServices}
										value={service._id}
										class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
									<div class="flex-1">
										<label for="service-{service._id}" class="block cursor-pointer">
											<h4 class="text-sm font-semibold text-gray-800">{service.name}</h4>
											<p class="text-xs text-gray-600 mt-1">{service.description}</p>
											<div class="flex items-center space-x-2 mt-2">
												<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
													{service.version}
							</span>
												{#if service.serviceParent}
													<span class="text-xs text-gray-500">{service.serviceParent.name}</span>
												{/if}
						</div>
										</label>
					</div>
				</div>
			</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500">No available services found for this organization</p>
			{/if}
			</div>

			<div class="mt-6">
				<button onclick={save} disabled={isSaving} class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
					{isSaving ? 'Saving...' : 'Save CV'}
				</button>
			</div>
			</div>
						{:else}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
			<h2 class="text-xl font-semibold text-gray-800 mb-2">No CV Found</h2>
			<p class="text-gray-600 mb-4">This expert doesn't have a CV yet.</p>
			<button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
				Create New CV
					</button>
	</div>
	{/if}
</div>