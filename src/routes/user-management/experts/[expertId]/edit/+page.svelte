<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import { calculateServicePricing } from '$lib/pricing';
	import { validateCVCompletion, canEditServices, canEditCVContent } from '$lib/cvValidation';
		
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
	let serviceRoles = $derived.by(() => {
		if (!assignedServices?.data) return {};
		return Object.fromEntries(
			assignedServices.data.map((a: any) => [a.serviceVersionId, a.role])
		);
	});
	let roleChanges = $state({}); // Track user role changes
	let isSaving = $state(false);
	let saveError = $state(null);
	
	// Reactive pricing calculation using utility function
	let pricing = $derived(calculateServicePricing(selectedServices.length));
	
	// ==========================================
	// 2. FUNCTIONS
	// ==========================================
	
	// Status color coding function
	function getStatusColor(status: string): string {
		switch (status) {
			case 'draft': return 'bg-gray-100 text-gray-800';
			case 'completed': return 'bg-blue-100 text-blue-800';
			case 'payment_pending': return 'bg-yellow-100 text-yellow-800';
			case 'paid': return 'bg-green-100 text-green-800';
			case 'locked_for_review': return 'bg-orange-100 text-orange-800';
			case 'unlocked_for_edits': return 'bg-red-100 text-red-800';
			case 'locked_final': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
	
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
		const roles = serviceRoles;
		const changes = roleChanges;
		
		// Extract complex logic to variables for readability
		const currentServiceIds = current.map((assignment: any) => assignment.serviceVersionId);
		
		const toAdd = selected.filter((id: any) => !currentServiceIds.includes(id));
		const toRemove = currentServiceIds.filter((id: any) => !selected.includes(id));
		
		// Simple role update logic - use user changes
		const roleUpdates = current.filter((assignment: any) => {
			const serviceId = assignment.serviceVersionId;
			return (changes as any)[serviceId] && (changes as any)[serviceId] !== assignment.role;
		});
		
		const toUpdate = roleUpdates.map((assignment: any) => ({
			assignmentId: assignment._id,
			newRole: (changes as any)[assignment.serviceVersionId]
		}));
		
		return { toAdd, toRemove, toUpdate };
	}
	
	// Action functions for save logic
	async function addServiceAssignment(serviceId: string) {
		if (!expertCV?.data) {
			throw new Error('No CV data available');
		}
		
		// Get the role from roleChanges or default to 'regular'
		const role = (roleChanges as any)[serviceId] || 'regular';
		
		return client.mutation(api.expert.addService, {
			cvId: expertCV.data._id as Id<'expertCVs'>,
			userId: expertId as Id<'users'>,
			organizationId: orgId as Id<'organizations'>,
			serviceVersionId: serviceId as Id<'serviceVersions'>,
			role: role as 'lead' | 'regular'
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
	
	async function updateServiceRole(assignmentId: string, newRole: string) {
		return client.mutation(api.expert.updateServiceRole, {
			assignmentId: assignmentId as Id<'expertServiceAssignments'>,
			newRole: newRole as 'lead' | 'regular'
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
			console.log('Current service roles:', serviceRoles);
			console.log('Role changes:', roleChanges);
			
			// Step 1.5: Log CV status and validation (NEW)
			console.log('🎯 CV Status:', expertCV?.data?.status);
			console.log('🎯 Can edit services:', canEditServices(expertCV?.data?.status || 'draft'));
			console.log('🎯 Can edit CV content:', canEditCVContent(expertCV?.data?.status || 'draft'));
			if (expertCV?.data) {
				// Create CV object with service assignments for validation
				const cvForValidation = {
					...expertCV.data,
					serviceAssignments: assignedServices?.data || []
				};
				const validation = validateCVCompletion(cvForValidation);
				console.log('🎯 CV Validation:', validation);
				console.log('🎯 CV Data:', expertCV.data);
				console.log('🎯 Experience length:', expertCV.data.experience?.length);
				console.log('🎯 Education length:', expertCV.data.education?.length);
				console.log('🎯 Service assignments length:', assignedServices?.data?.length || 0);
				
				// Step 1.7: Auto-transition from draft to completed (NEW)
				if (expertCV.data.status === 'draft' && validation.isValid) {
					console.log('🚀 Auto-transitioning: draft → completed');
					await client.mutation(api.expert.updateCVStatus, {
						cvId: expertCV.data._id,
						newStatus: 'completed'
					});
					console.log('✅ Status updated to completed');
				}
			}
			
			// Step 1.6: Check if service editing is allowed (NEW)
			const canEditServicesNow = canEditServices(expertCV?.data?.status || 'draft');
			console.log('🎯 Can edit services:', canEditServicesNow);
			
			// Step 2: Execute the changes (only if service editing is allowed)
			if (canEditServicesNow) {
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
			
			if (changes.toUpdate.length > 0) {
				console.log('🔄 Updating roles:', changes.toUpdate);
				for (const update of changes.toUpdate) {
					await updateServiceRole(update.assignmentId, update.newRole);
					console.log(`✅ Updated role: ${update.assignmentId} → ${update.newRole}`);
				}
			}
			
			if (changes.toAdd.length === 0 && changes.toRemove.length === 0 && changes.toUpdate.length === 0) {
				console.log('✅ No service changes needed');
			}
			} else {
				console.log('🚫 Service editing not allowed - skipping service changes');
			}
			
			console.log('🎉 Save completed successfully!');
			
		} catch (error: any) {
			saveError = error.message;
			console.error('❌ Save failed:', error);
		} finally {
			isSaving = false;
		}
	}

	async function resubmitForReview() {
		if (expertCV?.data?.status !== 'unlocked_for_edits') {
			throw new Error('Can only resubmit from unlocked_for_edits status');
		}
		
		isSaving = true;
		saveError = null;
		
		try {
			// First save any CV content changes (services will be skipped automatically)
			await save();
			
			// Then update status to locked_for_review
			console.log('🚀 Resubmitting for review: unlocked_for_edits → locked_for_review');
			await client.mutation(api.expert.updateCVStatus, {
				cvId: expertCV.data._id,
				newStatus: 'locked_for_review'
			});
			console.log('✅ Resubmitted for review');
			
		} catch (error: any) {
			saveError = error.message;
			console.error('❌ Resubmit failed:', error);
		} finally {
			isSaving = false;
		}
	}

	function handleError(error: any) {
		saveError = error.message;
		console.error('❌ Error:', error);
	}
	
	// Role management handler - track user changes
	function handleRoleChange(serviceId: string, newRole: string) {
		console.log('🎭 Role change:', { serviceId, newRole });
		// Track the role change for saving
		(roleChanges as any)[serviceId] = newRole;
		// Trigger reactivity
		roleChanges = { ...roleChanges };
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
		console.log('🎭 Service Roles (derived):', serviceRoles);
		console.log('🔍 Assigned Services Data:', assignedServices?.data);
		
		// Debug: Check if roles are being set correctly
		if (assignedServices?.data) {
			assignedServices.data.forEach((assignment: any) => {
				console.log(`🔍 Assignment: ${assignment.serviceVersionId} → Role: ${assignment.role}`);
			});
		}
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
				<p><strong>Status:</strong> 
					<span class="px-2 py-1 rounded text-xs font-medium {getStatusColor(expertCV.data.status)}">
						{expertCV.data.status}
					</span>
				</p>
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
											<!-- Role Dropdown - Only show when service is selected -->
											{#if selectedServices.includes(service._id)}
												<div class="ml-4 flex-shrink-0">
													<select 
														class="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px] shadow-sm"
														onchange={(e) => handleRoleChange(service._id, (e.target as HTMLSelectElement).value)}
														value={(roleChanges as any)[service._id] || (serviceRoles as any)[service._id] || 'regular'}
													>
														<!-- Debug: Log what's happening with this service -->
														{console.log(`🔍 Service ${service._id}: serviceRoles[${service._id}] = ${(serviceRoles as any)[service._id] || 'undefined'}`)}
														<option value="regular">Regular</option>
														<option value="lead">Lead</option>
													</select>
				</div>
											{:else}
												<!-- Placeholder for consistent layout -->
												<div class="ml-4 flex-shrink-0 w-[100px]"></div>
			{/if}
				</div>
			</div>
								{/each}
				</div>
				{:else}
					<p class="text-gray-500">No available services found for this organization</p>
			{/if}
			</div>

			<!-- Pricing Summary -->
			{#if selectedServices.length > 0}
				<div class="mt-8 p-6 bg-gray-50 rounded-lg border">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Estimated Cost</h3>
					
					<div class="space-y-3">
						{#each pricing.breakdown as item}
							<div class="flex justify-between items-center">
								<span class="text-sm text-gray-600">
									Service {item.serviceNumber}
									{#if item.discountPercentage > 0}
										<span class="text-green-600 ml-2">({item.discountPercentage}% off)</span>
									{/if}
								</span>
								<span class="font-medium">€{item.finalPrice.toFixed(2)}</span>
							</div>
						{/each}
						
						<hr class="my-3">
						
						<div class="flex justify-between items-center text-lg font-semibold">
							<span>Total</span>
							<span class="text-blue-600">€{pricing.total.toFixed(2)}</span>
						</div>
						
						{#if pricing.savings > 0}
							<div class="text-center text-green-600 font-medium">
								🎉 You save €{pricing.savings.toFixed(2)}!
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<div class="mt-6 flex gap-3">
				<button onclick={save} disabled={isSaving} class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
					{isSaving ? 'Saving...' : 'Save CV'}
				</button>
				
				{#if expertCV?.data?.status === 'unlocked_for_edits'}
					<button onclick={resubmitForReview} disabled={isSaving} class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
						{isSaving ? 'Submitting...' : 'Resubmit for Review'}
					</button>
				{/if}
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