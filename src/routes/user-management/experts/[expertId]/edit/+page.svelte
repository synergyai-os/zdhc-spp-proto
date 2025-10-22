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
	import CVDetailsContent from '$lib/components/expert-edit/CVDetailsContent.svelte';
		
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
			<TabSwitcher 
				tabs={['services', 'cv-details']} 
				{activeTab} 
				onTabChange={(tab: string) => activeTab = tab as 'services' | 'cv-details'} 
			/>

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
				<CVDetailsContent 
					{expertCV} 
					cvStatus={expertCV?.data?.status as CVStatus || 'draft'}
					{localCVData} 
					{isSaving}
					onSave={save}
					onResubmit={resubmitForReview}
					onAddExperience={addExperience}
					onRemoveExperience={removeExperience}
					onUpdateExperience={updateExperience}
					onAddEducation={addEducation}
					onRemoveEducation={removeEducation}
					onUpdateEducation={updateEducation}
				/>
			{/if}
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