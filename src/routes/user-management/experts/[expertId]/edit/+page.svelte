<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import { calculateServicePricing } from '$lib/pricing';
	import { validateCVCompletion } from '$lib/cvValidation';
	import { canEditServices, canEditCVContent, getCVStatusColor, type CVStatus } from '../../../../../convex/model/status';
	import ServiceSelection from '$lib/components/expert-edit/ServiceSelection.svelte';
	import ExpertHeader from '$lib/components/expert-edit/ExpertHeader.svelte';
	import TabSwitcher from '$lib/components/expert-edit/TabSwitcher.svelte';
	import ExperienceView from '$lib/components/expert-edit/ExperienceView.svelte';
	import EducationView from '$lib/components/expert-edit/EducationView.svelte';
	import TrainingQualificationView from '$lib/components/expert-edit/TrainingQualificationView.svelte';
	import DevelopmentToolBar from '$lib/components/admin/DevelopmentToolBar.svelte';
		
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

	// Query all service assignments for the organization to check for existing leads
	const orgAssignments = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => ({
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
	let activeTab = $state<'services' | 'experience' | 'education' | 'training'>('services');
	
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
			onSiteAuditsCompleted: 0,
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

	// Training management functions
	function addTraining() {
		if (!localCVData) return;
		const newTraining = {
			qualificationName: '',
			trainingOrganisation: '',
			trainingContent: '',
			dateIssued: '',
			expireDate: '',
			description: ''
		};
		localCVData.trainingQualifications = [...(localCVData.trainingQualifications || []), newTraining];
	}

	function removeTraining(index: number) {
		if (!localCVData) return;
		localCVData.trainingQualifications = (localCVData.trainingQualifications || []).filter((_: any, i: number) => i !== index);
	}

	function updateTraining(index: number, field: string, value: string) {
		if (!localCVData) return;
		localCVData.trainingQualifications = [...(localCVData.trainingQualifications || [])];
		localCVData.trainingQualifications[index] = { ...localCVData.trainingQualifications[index], [field]: value };
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
	
	// Check if there's already a lead expert for a service
	function hasLeadExpert(serviceId: string): boolean {
		if (!orgAssignments?.data) return false;
		
		// Check for any lead assignment (approved or pending - excludes rejected and inactive)
		const activeLeadAssignments = orgAssignments.data.filter(
			(assignment: any) => 
				assignment.serviceVersionId === serviceId &&
				assignment.status !== 'inactive' && // Exclude inactive
				assignment.status !== 'rejected' && // Exclude rejected
				assignment.role === 'lead'
		);
		
		return activeLeadAssignments.length > 0;
	}
	
	// Get read-only services (approved services for this CV)
	let readOnlyServices = $derived.by(() => {
		if (!assignedServices?.data) return [];
		return assignedServices.data
			.filter((assignment: any) => assignment.status === 'approved')
			.map((assignment: any) => assignment.serviceVersionId);
	});
	
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
			// Step 1: Save CV data changes (experience/education/training)
			if (localCVData) {
				await client.mutation(api.expert.updateCV, {
					cvId: localCVData._id,
					organizationId: orgId as Id<'organizations'>,
					experience: localCVData.experience,
					education: localCVData.education,
					trainingQualifications: localCVData.trainingQualifications
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
<div class="bg-gray-50 min-h-screen">
	<div class="max-w-7xl mx-auto px-6 py-8">
		{#if expertCV?.data}
			<div class="flex gap-6">
				<!-- LEFT SIDEBAR: Expert Header (Smaller, like admin page) -->
				<div class="w-80 flex-shrink-0 space-y-4">
					<ExpertHeader {userDetails} {expertCV} />
					
					<!-- Development Tools -->
					{#if expertCV?.data}
						<DevelopmentToolBar 
							userId={expertId as Id<'users'>}
							userIsActive={userDetails?.data?.isActive}
							cvStatus={expertCV.data.status}
							cvId={expertCV.data._id}
							onActionCompleted={() => {
								console.log('🔧 Development tool action completed - data will refresh automatically');
								// Convex queries will automatically refetch after mutations
							}}
						/>
					{/if}
				</div>

				<!-- MAIN CONTENT AREA: Tabs and Content (Wider) -->
				<div class="flex-1 space-y-6">
					<!-- Tab Switcher -->
					<TabSwitcher 
						tabs={['services', 'experience', 'education', 'training']} 
						{activeTab} 
						onTabChange={(tab: string) => activeTab = tab as 'services' | 'experience' | 'education' | 'training'} 
					/>
					
					<!-- Main Content Card -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
								hasLeadExpert={hasLeadExpert}
								readOnlyServices={readOnlyServices}
							/>
						{/if}

						<!-- Experience Tab Content -->
						{#if activeTab === 'experience'}
							<ExperienceView 
								cvStatus={expertCV?.data?.status as CVStatus || 'draft'}
								{localCVData}
								onAddExperience={addExperience}
								onRemoveExperience={removeExperience}
								onUpdateExperience={updateExperience}
							/>
						{/if}

						<!-- Education Tab Content -->
						{#if activeTab === 'education'}
							<EducationView 
								cvStatus={expertCV?.data?.status as CVStatus || 'draft'}
								{localCVData}
								onAddEducation={addEducation}
								onRemoveEducation={removeEducation}
								onUpdateEducation={updateEducation}
							/>
						{/if}

						<!-- Training Qualification Tab Content -->
						{#if activeTab === 'training'}
							<TrainingQualificationView 
								cvStatus={expertCV?.data?.status as CVStatus || 'draft'}
								{localCVData}
								onAddTraining={addTraining}
								onRemoveTraining={removeTraining}
								onUpdateTraining={updateTraining}
							/>
						{/if}
					</div>

					<!-- Save Buttons - Fixed at bottom of page -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						{#if canEditCVContent(expertCV?.data?.status || 'draft')}
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2 text-sm text-gray-600">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
									</svg>
									<span>
										{#if expertCV?.data?.status === 'unlocked_for_edits'}
											Make your changes, then resubmit for review.
										{:else}
											Don't forget to save your changes.
										{/if}
									</span>
								</div>
								<div class="flex gap-3">
									<button 
										onclick={save} 
										disabled={isSaving} 
										class="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-sm"
									>
										{#if isSaving}
											<svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
											</svg>
											Saving...
										{:else}
											<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
											</svg>
											Save Changes
										{/if}
									</button>
									
									{#if expertCV?.data?.status === 'unlocked_for_edits'}
										<button 
											onclick={resubmitForReview} 
											disabled={isSaving} 
											class="inline-flex items-center px-6 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-sm"
										>
											{#if isSaving}
												<svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
												Submitting...
											{:else}
												<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
												</svg>
												Resubmit for Review
											{/if}
										</button>
									{/if}
								</div>
							</div>
						{:else}
							<div class="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
								<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
								</svg>
								<span>CV is locked and cannot be edited. Contact your administrator if changes are needed.</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{:else if !expertCV?.data}
			<ExpertHeader {userDetails} {expertCV} />
		{/if}
	</div>
</div>