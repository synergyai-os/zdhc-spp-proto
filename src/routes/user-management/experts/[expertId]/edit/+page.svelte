<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import { calculateServicePricing } from '$lib/pricing';
	import { validateCVCompletion } from '$lib/cvValidation';
	import { canEditServices, canEditCVContent, getCVStatusColor } from '../../../../../convex/model/status';
	import ServiceSelection from '$lib/components/expert-edit/ServiceSelection.svelte';
	import ExpertHeader from '$lib/components/expert-edit/ExpertHeader.svelte';
	import TabSwitcher from '$lib/components/expert-edit/TabSwitcher.svelte';
		
	// ==========================================
	// 1. SETUP & DATA
	// ==========================================
	const expertId = $derived($page.params.expertId);
	const orgId = DEFAULT_ORG_ID;
	const client = useConvexClient();

	// Data queries
	const userDetails = useQuery(api.expert.getUser, () => ({
		userId: expertId as Id<'users'>
	}));
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
	
	// Local mutable copy of CV data
	let localCVData = $state<any>(null);
	
	// Toggle switcher state
	let activeTab = $state<'services' | 'cv-details'>('services');
	
	// Service selection state - derived from assigned services
	let serviceSelection = $derived(getSelectedServiceIds());
	
	// User's service selection changes (for UI interactions)
	let userServiceChanges = $state<Set<string>>(new Set());
	
	// Combined service selection (assigned + user changes)
	let effectiveServiceSelection = $derived.by(() => {
		const assigned = getSelectedServiceIds();
		const changes = Array.from(userServiceChanges);
		
		// Start with assigned services
		const result = new Set(assigned);
		
		// Apply user changes
		for (const serviceId of changes) {
			if (result.has(serviceId)) {
				result.delete(serviceId); // User unchecked
			} else {
				result.add(serviceId); // User checked
			}
		}
		
		return Array.from(result);
	});
	
	// Sync CV data when it becomes available
	$effect(() => {
		if (expertCV?.data) {
			localCVData = { ...expertCV.data };
		}
	});
	
	// Reactive pricing calculation using utility function
	let pricing = $derived(calculateServicePricing(effectiveServiceSelection.length));
	
	// ==========================================
	// 2. FUNCTIONS
	// ==========================================
	
	// Experience management functions
	function addExperience() {
		if (!localCVData) return;
		const newExperience = {
			title: '',
			company: '',
			location: '',
			startDate: '',
			endDate: '',
			current: false,
			description: ''
		};
		localCVData.experience = [...(localCVData.experience || []), newExperience];
	}

	function removeExperience(index: number) {
		if (!localCVData) return;
		localCVData.experience = localCVData.experience.filter((_: any, i: number) => i !== index);
	}

	function updateExperience(index: number, field: string, value: any) {
		if (!localCVData) return;
		localCVData.experience = [...localCVData.experience];
		localCVData.experience[index] = { ...localCVData.experience[index], [field]: value };
	}

	// Education management functions
	function addEducation() {
		if (!localCVData) return;
		const newEducation = {
			school: '',
			degree: '',
			field: '',
			startDate: '',
			endDate: '',
			description: ''
		};
		localCVData.education = [...(localCVData.education || []), newEducation];
	}

	function removeEducation(index: number) {
		if (!localCVData) return;
		localCVData.education = localCVData.education.filter((_: any, i: number) => i !== index);
	}

	function updateEducation(index: number, field: string, value: any) {
		if (!localCVData) return;
		localCVData.education = [...localCVData.education];
		localCVData.education[index] = { ...localCVData.education[index], [field]: value };
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
		const selected = effectiveServiceSelection; // Use effective selection (assigned + user changes)
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
			// Step 1: Save CV data changes (experience/education)
			if (localCVData) {
				await client.mutation(api.expert.updateCV, {
					cvId: localCVData._id,
					organizationId: orgId as Id<'organizations'>,
					experience: localCVData.experience,
					education: localCVData.education
				});
			}
			
			// Step 2: Analyze and execute service changes FIRST
			const changes = analyzeServiceChanges();
			console.log('📊 Changes to make:', changes);
			console.log('Current assigned services:', assignedServices?.data);
			console.log('User effective selection:', effectiveServiceSelection);
			console.log('Current service roles:', serviceRoles);
			console.log('Role changes:', roleChanges);
			
			// Check if service editing is allowed
			const canEditServicesNow = canEditServices(expertCV?.data?.status || 'draft');
			console.log('🎯 Can edit services:', canEditServicesNow);
			
			// Execute service changes (only if service editing is allowed)
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
			
			// Step 3: NOW validate and handle status transitions AFTER all data is saved
			console.log('🎯 CV Status:', expertCV?.data?.status);
			console.log('🎯 Can edit CV content:', canEditCVContent(expertCV?.data?.status || 'draft'));
			
			if (localCVData) {
				// Create CV object with UPDATED service assignments for validation
				// We need to simulate what the service assignments will look like after our changes
				const updatedServiceAssignments = [...(assignedServices?.data || [])];
				
				// Add new service assignments
				for (const serviceId of changes.toAdd) {
					const role = (roleChanges as any)[serviceId] || 'regular';
					updatedServiceAssignments.push({
						_id: `temp-${serviceId}`, // Temporary ID for validation
						serviceVersionId: serviceId,
						role: role
					});
				}
				
				// Remove service assignments
				const filteredAssignments = updatedServiceAssignments.filter(
					(assignment: any) => !changes.toRemove.includes(assignment.serviceVersionId)
				);
				
				// Update roles for existing assignments
				const finalAssignments = filteredAssignments.map((assignment: any) => {
					if (changes.toUpdate.some((update: any) => update.assignmentId === assignment._id)) {
						const update = changes.toUpdate.find((update: any) => update.assignmentId === assignment._id);
						return { ...assignment, role: update?.newRole || assignment.role };
					}
					return assignment;
				});
				
				const cvForValidation = {
					...localCVData,
					serviceAssignments: finalAssignments
				};
				
				const validation = validateCVCompletion(cvForValidation);
				console.log('🎯 CV Validation:', validation);
				console.log('🎯 Local CV Data:', localCVData);
				console.log('🎯 Experience length:', localCVData.experience?.length);
				console.log('🎯 Education length:', localCVData.education?.length);
				console.log('🎯 Final service assignments length:', finalAssignments.length);
				
				// Handle status transitions based on validation
				const currentStatus = expertCV?.data?.status;
				
				if (currentStatus === 'draft' && validation.isValid) {
					// Draft → Completed: CV is now complete
					console.log('🚀 Auto-transitioning: draft → completed');
					await client.mutation(api.expert.updateCVStatus, {
						cvId: localCVData._id,
						newStatus: 'completed'
					});
					console.log('✅ Status updated to completed');
				} else if (currentStatus === 'completed' && !validation.isValid) {
					// Completed → Draft: CV is no longer complete (e.g., removed all education)
					console.log('🚀 Auto-transitioning: completed → draft (CV no longer complete)');
					await client.mutation(api.expert.updateCVStatus, {
						cvId: localCVData._id,
						newStatus: 'draft'
					});
					console.log('✅ Status reverted to draft');
				}
			}
			
			console.log('🎉 Save completed successfully!');
			
			// Clear user changes to sync UI with database state
			userServiceChanges = new Set();
			roleChanges = {};
			console.log('🔄 Cleared user changes - UI now reflects database state');
			
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
	
	// Service toggle handler
	function handleServiceToggle(serviceId: string) {
		console.log('🔧 Service toggle:', { serviceId });
		
		// Toggle the service in user changes
		const changes = new Set(userServiceChanges);
		if (changes.has(serviceId)) {
			changes.delete(serviceId); // Remove the change
		} else {
			changes.add(serviceId); // Add the change
		}
		userServiceChanges = changes;
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

	<ExpertHeader {userDetails} {expertCV} />
	
	{#if expertCV?.data}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<TabSwitcher {activeTab} onTabChange={(tab: 'services' | 'cv-details') => activeTab = tab} />

			<!-- Services Tab Content -->
			{#if activeTab === 'services'}
				<ServiceSelection 
					cvStatus={expertCV?.data?.status || 'draft'}
					availableServices={availableServices?.data || []}
					selectedServices={effectiveServiceSelection}
					serviceRoles={serviceRoles}
					roleChanges={roleChanges}
					onServiceToggle={handleServiceToggle}
					onRoleChange={handleRoleChange}
					isLoading={availableServices?.isLoading}
					error={availableServices?.error?.message || ''}
				/>
			{/if}

			<!-- CV Details Tab Content -->
			{#if activeTab === 'cv-details'}
			<!-- Experience Section -->
			{#if canEditCVContent(expertCV.data.status)}
			<div class="mt-6">
					<div class="flex items-center justify-between mb-6">
						<div>
							<h3 class="text-lg font-semibold text-gray-800">Professional Experience</h3>
							<p class="text-sm text-gray-500">Add relevant work experience for this expert</p>
						</div>
						<button
							type="button"
							onclick={addExperience}
							class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Experience
						</button>
					</div>

					{#if !localCVData?.experience || localCVData.experience.length === 0}
						<div class="text-center py-8">
							<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
							</svg>
							<h3 class="text-lg font-medium text-gray-900 mb-2">No experience added yet</h3>
							<p class="text-gray-500 mb-4">Add professional experience to help verify this expert's qualifications</p>
							<button
								type="button"
								onclick={addExperience}
								class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Add First Experience
							</button>
						</div>
					{:else}
						<div class="space-y-6">
							{#each localCVData.experience as entry, index}
								<div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
									<div class="flex items-center justify-between mb-4">
										<h4 class="text-md font-medium text-gray-900">Experience #{index + 1}</h4>
										<button
											type="button"
											onclick={() => removeExperience(index)}
											class="text-red-600 hover:text-red-800 transition-colors"
											title="Remove experience"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
											<input
												type="text"
												value={entry.title}
												oninput={(e) => updateExperience(index, 'title', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="e.g., Senior Consultant"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Company *</label>
											<input
												type="text"
												value={entry.company}
												oninput={(e) => updateExperience(index, 'company', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="e.g., ABC Consulting"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
											<input
												type="text"
												value={entry.location}
												oninput={(e) => updateExperience(index, 'location', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="e.g., Amsterdam, Netherlands"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
											<input
												type="date"
												value={entry.startDate}
												oninput={(e) => updateExperience(index, 'startDate', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
											<input
												type="date"
												value={entry.endDate}
												oninput={(e) => updateExperience(index, 'endDate', e.currentTarget.value)}
												disabled={entry.current}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
											/>
										</div>

										<div class="flex items-center">
											<input
												type="checkbox"
												checked={entry.current}
												onchange={(e) => {
													updateExperience(index, 'current', e.currentTarget.checked);
													if (e.currentTarget.checked) {
														updateExperience(index, 'endDate', '');
													}
												}}
												class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<label class="ml-2 block text-sm text-gray-700">Currently working here</label>
										</div>
									</div>

									<div class="mt-4">
										<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
										<textarea
											value={entry.description}
											oninput={(e) => updateExperience(index, 'description', e.currentTarget.value)}
											rows="3"
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
											placeholder="Describe the role and key responsibilities..."
										></textarea>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
								{/if}

			<!-- Education Section -->
			{#if canEditCVContent(expertCV.data.status)}
				<div class="mt-6">
					<div class="flex items-center justify-between mb-6">
						<div>
							<h3 class="text-lg font-semibold text-gray-800">Education</h3>
							<p class="text-sm text-gray-500">Add educational background for this expert</p>
						</div>
						<button
							type="button"
							onclick={addEducation}
							class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Education
						</button>
					</div>

					{#if !localCVData?.education || localCVData.education.length === 0}
						<div class="text-center py-8">
							<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.083 12.083 0 01.665-6.479L12 14z" />
							</svg>
							<h3 class="text-lg font-medium text-gray-900 mb-2">No education added yet</h3>
							<p class="text-gray-500 mb-4">Add educational background to help verify this expert's qualifications</p>
							<button
								type="button"
								onclick={addEducation}
								class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Add First Education
							</button>
					</div>
				{:else}
						<div class="space-y-6">
							{#each localCVData.education as entry, index}
								<div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
									<div class="flex items-center justify-between mb-4">
										<h4 class="text-md font-medium text-gray-900">Education #{index + 1}</h4>
										<button
											type="button"
											onclick={() => removeEducation(index)}
											class="text-red-600 hover:text-red-800 transition-colors"
											title="Remove education"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
											<input
												type="text"
												value={entry.school}
												oninput={(e) => updateEducation(index, 'school', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="e.g., University of Amsterdam"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
											<input
												type="text"
												value={entry.degree}
												oninput={(e) => updateEducation(index, 'degree', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="e.g., Master of Science"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
											<input
												type="text"
												value={entry.field}
												oninput={(e) => updateEducation(index, 'field', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="e.g., Environmental Science"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
											<input
												type="date"
												value={entry.startDate}
												oninput={(e) => updateEducation(index, 'startDate', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
											<input
												type="date"
												value={entry.endDate}
												oninput={(e) => updateEducation(index, 'endDate', e.currentTarget.value)}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>
									</div>

									<div class="mt-4">
										<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
										<textarea
											value={entry.description}
											oninput={(e) => updateEducation(index, 'description', e.currentTarget.value)}
											rows="3"
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
											placeholder="Additional details about the education..."
										></textarea>
									</div>
								</div>
							{/each}
						</div>
				{/if}
			</div>
			{/if}
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