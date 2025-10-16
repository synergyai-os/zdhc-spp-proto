<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../../../convex/_generated/api';
	import { page } from '$app/stores';
	import { organizationStore } from '$lib/stores/organization.svelte';
	import Step2Confirmation from '$lib/components/expert-wizard/Step2Confirmation.svelte';
	import Step3Services from '$lib/components/expert-wizard/Step3Services.svelte';
	import Step4Experience from '$lib/components/expert-wizard/Step4Experience.svelte';
	import Step5Education from '$lib/components/expert-wizard/Step5Education.svelte';
	import type { Id } from '../../../../../convex/_generated/dataModel';

	// Get expert ID from URL params
	const expertId = $derived($page.params.expertId);

	// Get Convex client
	const client = useConvexClient();

	// Query the primary expert assignment data
	const primaryAssignment = useQuery(api.expertAssignments.getExpertAssignmentById, () =>
		expertId ? { id: expertId as any } : { id: '' as any }
	);

	// Get user ID from primary assignment to query all assignments for this user
	let userId = $derived(primaryAssignment?.data?.userId || null);
	
	// Query all assignments for this user
	const expertAssignments = useQuery(api.expertAssignments.getExpertAssignmentsByUserId, () =>
		userId ? { userId: userId as any } : { userId: '' as any }
	);

	// Get the primary assignment (the one we're editing)
	let assignmentData = $derived(primaryAssignment?.data || null);

	// Organization context - use the organization from the expert assignment
	let currentOrgId = $derived(assignmentData?.organizationId || null);

	// Debug organization context
	$effect(() => {
		console.log('🏢 Organization Context:');
		console.log('  - assignmentData:', assignmentData);
		console.log('  - currentOrgId from assignment:', currentOrgId);
		console.log('  - global organization:', $organizationStore.currentOrganization?._id);
		console.log(
			'  - availableOrganizations:',
			$organizationStore.availableOrganizations?.length || 0
		);
	});

	// Query user data if assignment exists
	const userData = useQuery(api.expertAssignments.getUserById, () =>
		primaryAssignment?.data?.userId ? { id: primaryAssignment.data.userId } : { id: '' as any }
	);

	// Query available services for this organization
	const serviceVersions = useQuery(api.expertAssignments.getServiceVersions, () => ({}));

	const organizationApprovals = useQuery(api.expertAssignments.getOrganizationApprovals, () =>
		currentOrgId && assignmentData
			? { organizationId: currentOrgId as any }
			: { organizationId: '' as any }
	);

	// Loading and error states
	let isLoading = $derived(primaryAssignment?.isLoading || expertAssignments?.isLoading || userData?.isLoading || false);
	let hasError = $derived(primaryAssignment?.error || expertAssignments?.error || userData?.error || false);


	// Edit state
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);

	// Available services for the organization
	let availableServices = $derived(
		(() => {
			console.log('🔍 Debug Services:');
			console.log('  - currentOrgId:', currentOrgId);
			console.log('  - serviceVersions:', serviceVersions?.data?.length || 0);
			console.log('  - organizationApprovals:', organizationApprovals?.data?.length || 0);

			// PROTOTYPE MODE: Show all services if:
			// 1. No organization is selected, OR
			// 2. No organization approvals exist
			if (!currentOrgId || !organizationApprovals?.data?.length) {
				console.log('  - Prototype mode: showing all services');
				return serviceVersions?.data || [];
			}

			const filtered =
				serviceVersions?.data?.filter((service: any) =>
					organizationApprovals?.data?.some(
						(approval: any) => approval.serviceVersionId === service._id
					)
				) || [];

			console.log('  - Filtered services:', filtered.length);
			return filtered;
		})()
	);

	// Current form data (editable fields)
	let selectedServices = $state<string[]>([]);
	let serviceRoles = $state<Record<string, 'lead' | 'regular'>>({});
	let experience = $state<any[]>([]);
	let education = $state<any[]>([]);

	// Initialize form data when assignment data loads
	$effect(() => {
		if (assignmentData && expertAssignments?.data) {
			// Initialize services from ALL assignments for this user
			const allServices = expertAssignments.data
				.filter((assignment: any) => assignment.serviceVersion)
				.map((assignment: any) => ({
					name: assignment.serviceVersion.name,
					role: assignment.role || 'regular'
				}));

			// Remove duplicates and set selected services
			const uniqueServices = [...new Map(allServices.map((s: any) => [s.name, s])).values()];
			selectedServices = uniqueServices.map((s: any) => s.name);
			serviceRoles = Object.fromEntries(uniqueServices.map((s: any) => [s.name, s.role]));

			// Initialize experience and education from the primary assignment
			experience = assignmentData.experience || [];
			education = assignmentData.education || [];
		}
	});

	function goBack() {
		window.history.back();
	}

	async function handleSave() {
		if (isSaving) return;

		try {
			isSaving = true;
			saveError = null;

			// Handle service assignments for shell assignments
			let newAssignmentIds: Id<'expertAssignments'>[] = [];

			// Handle service assignments - prevent duplicates, handle role updates, and service removal
			// This runs even when selectedServices.length === 0 to handle removal of all services
			if (assignmentData?.userId && assignmentData?.organizationId) {
				const userId = assignmentData?.userId;
				const organizationId = assignmentData?.organizationId;
				
				if (!userId || !organizationId) {
					throw new Error('Missing user or organization data');
				}

				// Get existing assignments with their service versions and roles
				const existingAssignments = expertAssignments?.data
					?.filter((assignment: any) => assignment.serviceVersionId) || [];

				console.log('🔍 Debug Save - Service Assignment:');
				console.log('  - selectedServices:', selectedServices);
				console.log('  - existingAssignments:', existingAssignments.map((a: any) => ({
					id: a._id,
					serviceName: a.serviceVersion?.name,
					currentRole: a.role
				})));

				// Separate new services, role updates, and services to remove
				const newServiceAssignments: any[] = [];
				const roleUpdates: any[] = [];
				const assignmentsToDelete: string[] = [];

				// Get currently selected service IDs (empty array if no services selected)
				const selectedServiceIds = selectedServices.map(serviceName => {
					const serviceVersion = serviceVersions?.data?.find(
						(version: any) => version.name === serviceName
					);
					return serviceVersion?._id;
				}).filter(Boolean);

				// Find assignments to delete (services that were selected but are no longer selected)
				// This includes ALL assignments when selectedServices is empty
				for (const assignment of existingAssignments) {
					if (!selectedServiceIds.includes(assignment.serviceVersionId)) {
						const serviceName = assignment.serviceVersion?.name || 'Unknown Service';
						console.log(`🗑️ Service removed: ${serviceName} (assignment ${assignment._id})`);
						assignmentsToDelete.push(assignment._id);
					}
				}

				// Process currently selected services
				for (const serviceName of selectedServices) {
					const serviceVersion = serviceVersions?.data?.find(
						(version: any) => version.name === serviceName
					);
					
					if (!serviceVersion) {
						throw new Error(`Service version not found for: ${serviceName}`);
					}

					const newRole = serviceRoles[serviceName] || 'regular';
					
					// Check if this service already exists
					const existingAssignment = existingAssignments.find(
						(assignment: any) => assignment.serviceVersionId === serviceVersion._id
					);

					if (existingAssignment) {
						// Service exists - check if role changed
						if (existingAssignment.role !== newRole) {
							console.log(`🔄 Role update needed: ${serviceName} (${existingAssignment.role} → ${newRole})`);
							roleUpdates.push({
								assignmentId: existingAssignment._id,
								newRole: newRole
							});
						} else {
							console.log(`✅ No change needed: ${serviceName} (${newRole})`);
						}
					} else {
						// New service - create assignment
						console.log(`➕ New service: ${serviceName} (${newRole})`);
						newServiceAssignments.push({
							serviceVersionId: serviceVersion._id,
							role: newRole
						});
					}
				}

				// Handle shell assignment deletion
				if (!assignmentData?.serviceVersionId && expertAssignments?.data?.length === 1) {
					console.log('🗑️ Deleting shell assignment:', expertId);
					await client.mutation(api.expertAssignments.deleteExpertAssignment, {
						id: expertId as Id<'expertAssignments'>
					});
				}

				// Delete assignments for removed services
				for (const assignmentId of assignmentsToDelete) {
					console.log(`🗑️ Deleting assignment: ${assignmentId}`);
					await client.mutation(api.expertAssignments.deleteExpertAssignment, {
						id: assignmentId as Id<'expertAssignments'>
					});
				}

				// If all services were removed and no new services were added,
				// we need to handle this case to avoid ID conflicts
				let shellAssignmentId: Id<'expertAssignments'> | null = null;
				if (selectedServices.length === 0 && newServiceAssignments.length === 0 && assignmentsToDelete.length > 0) {
					// Check if we're dealing with a single assignment (can convert to shell)
					if (expertAssignments?.data?.length === 1) {
						const singleAssignment = expertAssignments.data[0];
						if (singleAssignment.serviceVersionId) {
							// Single assignment with service - convert to shell assignment
							console.log('🔄 Converting single assignment to shell assignment');
							await client.mutation(api.expertAssignments.updateExpertAssignmentService, {
								id: singleAssignment._id as Id<'expertAssignments'>,
								serviceVersionId: undefined, // Remove service to make it a shell
								role: undefined // Remove role
							});
							shellAssignmentId = singleAssignment._id;
						} else {
							// Already a shell assignment - no action needed
							console.log('✅ Already a shell assignment');
							shellAssignmentId = singleAssignment._id;
						}
					} else {
						// Multiple assignments - delete all and create new shell
						console.log('🔄 Multiple assignments removed - creating new shell assignment');
						shellAssignmentId = await client.mutation(api.expertAssignments.createShellAssignment, {
							userId: userId as Id<'users'>,
							organizationId: organizationId as Id<'organizations'>,
							assignedBy: 'current-user-id',
							notes: 'Shell assignment - all services removed, ready for new service selection'
						});
					}
				}

				// Update roles for existing assignments
				for (const roleUpdate of roleUpdates) {
					console.log(`🔄 Updating role for assignment ${roleUpdate.assignmentId} to ${roleUpdate.newRole}`);
					await client.mutation(api.expertAssignments.updateExpertAssignmentRole, {
						id: roleUpdate.assignmentId as Id<'expertAssignments'>,
						role: roleUpdate.newRole
					});
				}

				// Create new assignments only for new services
				let newlyCreatedAssignmentIds: Id<'expertAssignments'>[] = [];
				if (newServiceAssignments.length > 0) {
					console.log('➕ Creating new assignments:', newServiceAssignments);
					try {
						newlyCreatedAssignmentIds = await client.mutation(api.expertAssignments.createExpertAssignmentsForUser, {
							userId: userId as Id<'users'>,
							organizationId: organizationId as Id<'organizations'>,
							serviceAssignments: newServiceAssignments,
							assignedBy: 'current-user-id'
						});
						console.log('✅ Created assignment IDs:', newlyCreatedAssignmentIds);
					} catch (createError) {
						console.error('❌ Failed to create assignments:', createError);
						throw new Error(`Failed to create expert assignments: ${createError}`);
					}
				} else {
					console.log('ℹ️ No new services to create assignments for');
				}

				// Get all assignment IDs for updating experience/education
				// This includes: remaining existing assignments + newly created ones + shell assignment (if created/converted)
				const remainingAssignmentIds = expertAssignments?.data
					?.filter((a: any) => !assignmentsToDelete.includes(a._id))
					?.map((a: any) => a._id) || [];
				
				// Combine all assignment IDs
				newAssignmentIds = [...remainingAssignmentIds, ...newlyCreatedAssignmentIds];
				
				// Add shell assignment ID if one was created or converted
				if (shellAssignmentId && !newAssignmentIds.includes(shellAssignmentId)) {
					newAssignmentIds.push(shellAssignmentId);
				}
			}

			// Update experience for all assignments
			if (experience.length > 0 && newAssignmentIds.length > 0) {
				await client.mutation(api.expertAssignments.updateMultipleAssignmentsExperience, {
					assignmentIds: newAssignmentIds,
					experience: experience,
					profileCompletionStep: 4
				});
			}

			// Update education for all assignments
			if (education.length > 0 && newAssignmentIds.length > 0) {
				await client.mutation(api.expertAssignments.updateMultipleAssignmentsEducation, {
					assignmentIds: newAssignmentIds,
					education: education,
					profileCompletionStep: 5,
					isProfileComplete: true
				});
			}

			// Redirect back to user management immediately
			// This prevents the error flash that occurs when the page tries to reload data
			// for an assignment ID that no longer exists (after shell assignment creation)
			window.location.href = '/user-management';
		} catch (error) {
			console.error('Error saving profile:', error);
			saveError = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			isSaving = false;
		}
	}

	function handleToggleService(serviceName: string) {
		if (selectedServices.includes(serviceName)) {
			selectedServices = selectedServices.filter((s) => s !== serviceName);
			delete serviceRoles[serviceName];
		} else {
			selectedServices = [...selectedServices, serviceName];
			serviceRoles[serviceName] = 'regular';
		}
	}

	function handleToggleRole(serviceName: string) {
		serviceRoles[serviceName] = serviceRoles[serviceName] === 'lead' ? 'regular' : 'lead';
	}

	function handleUpdateExperience(newExperience: any[]) {
		experience = newExperience;
	}

	function handleUpdateEducation(newEducation: any[]) {
		education = newEducation;
	}

	// No step navigation needed - all steps are visible simultaneously
</script>

<svelte:head>
	<title>Edit Expert Profile - SPP</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen">
	<div class="max-w-4xl mx-auto px-6 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">Edit Expert Profile</h1>
					<p class="text-gray-600">Complete or update expert profile information</p>
				</div>
				<button
					type="button"
					onclick={goBack}
					class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
				>
					← Back
				</button>
			</div>
		</div>

		{#if isLoading}
			<!-- Loading State -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<div
					class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"
				></div>
				<p class="text-gray-600">Loading expert profile...</p>
			</div>
		{:else if hasError}
			<!-- Error State -->
			<div class="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
				<svg
					class="w-12 h-12 mx-auto mb-4 text-red-300"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h2 class="text-xl font-semibold text-red-800 mb-2">Error Loading Profile</h2>
				<p class="text-red-600 mb-4">Could not load expert profile data</p>
				<button
					type="button"
					onclick={() => window.location.reload()}
					class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
				>
					Try Again
				</button>
			</div>
		{:else if !assignmentData}
			<!-- Not Found -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<svg
					class="w-12 h-12 mx-auto mb-4 text-gray-300"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
					/>
				</svg>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">Expert Not Found</h2>
				<p class="text-gray-600 mb-4">The requested expert profile could not be found</p>
				<a href="/user-management" class="text-blue-600 hover:text-blue-800 font-medium">
					Back to User Management →
				</a>
			</div>
		{:else}
			<!-- Expert Info Header -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="flex items-center">
					<div class="flex-shrink-0 h-16 w-16">
						<div
							class="h-16 w-16 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl"
						>
							{userData?.data
								? `${userData.data.firstName?.[0] || ''}${userData.data.lastName?.[0] || ''}`
								: '?'}
						</div>
					</div>
					<div class="ml-6">
						<h2 class="text-2xl font-bold text-gray-900">
							{userData?.data
								? `${userData.data.firstName || ''} ${userData.data.lastName || ''}`.trim() ||
									userData.data.email
								: 'Unknown User'}
						</h2>
						<p class="text-gray-600">{userData?.data?.email}</p>
						<div class="mt-2 flex items-center space-x-4">
							<span
								class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {assignmentData.isProfileComplete
									? 'bg-green-100 text-green-800'
									: 'bg-blue-100 text-blue-800'}"
							>
								{assignmentData.isProfileComplete
									? 'Complete'
									: `Draft - Step ${assignmentData.profileCompletionStep || 0}/5`}
							</span>
							<span
								class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {userData
									?.data?.isActive
									? 'bg-green-100 text-green-800'
									: 'bg-red-100 text-red-800'}"
							>
								{userData?.data?.isActive ? 'Active' : 'Invited'}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Save Error Display -->
			{#if saveError}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<div>
							<h3 class="text-sm font-medium text-red-800">Save Error</h3>
							<p class="text-sm text-red-700 mt-1">{saveError}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- STEP 2: Expert Confirmation -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 2: Expert Confirmation</h2>
					<p class="text-gray-600">Verify expert information and invitation status</p>
				</div>
				<Step2Confirmation
					userData={userData?.data}
					isDraftMode={!userData?.data?.isActive}
					invitedUserEmail={userData?.data?.email}
				/>
			</div>

			<!-- STEP 3: Select Services -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 3: Select Services & Roles</h2>
					<p class="text-gray-600">Choose which services this expert will provide and their role</p>
				</div>
				<Step3Services
					{availableServices}
					{selectedServices}
					{serviceRoles}
					{currentOrgId}
					isLoadingServices={serviceVersions?.isLoading || organizationApprovals?.isLoading}
					isDraftMode={!userData?.data?.isActive}
					on:toggleService={(e) => handleToggleService(e.detail)}
					on:toggleRole={(e) => handleToggleRole(e.detail)}
				/>
			</div>

			<!-- STEP 4: Professional Experience -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 4: Professional Experience</h2>
					<p class="text-gray-600">Add relevant work experience and achievements</p>
				</div>
				<Step4Experience
					{experience}
					on:updateExperience={(e) => handleUpdateExperience(e.detail)}
				/>
			</div>

			<!-- STEP 5: Education -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 5: Education & Certifications</h2>
					<p class="text-gray-600">Add educational background and relevant certifications</p>
				</div>
				<Step5Education {education} on:updateEducation={(e) => handleUpdateEducation(e.detail)} />
			</div>

			<!-- Save Button -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center justify-center">
					<button
						type="button"
						onclick={handleSave}
						disabled={isSaving}
						class="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg font-medium"
					>
						{#if isSaving}
							Saving Profile...
						{:else}
							Save Complete Profile
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
