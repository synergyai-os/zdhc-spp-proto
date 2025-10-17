<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../../../convex/_generated/api';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { organizationStore } from '$lib/stores/organization.svelte';
	import Step2Confirmation from '$lib/components/expert-wizard/Step2Confirmation.svelte';
	import Step3Services from '$lib/components/expert-wizard/Step3Services.svelte';
	import Step4Experience from '$lib/components/expert-wizard/Step4Experience.svelte';
	import Step5Education from '$lib/components/expert-wizard/Step5Education.svelte';
	import type { Id } from '../../../../../convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';

	interface Service {
		name: string;
		_id: string;
	}

	// Get expert ID from URL params
	const expertId = $derived($page.params.expertId);

	// Get Convex client
	const client = useConvexClient();

	// Query the latest CV for this expert (new schema)
	const latestCV = useQuery(
		api.expertCVs.getLatestExpertCV,
		() => ({ 
			userId: (expertId || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any, 
			organizationId: ($organizationStore.currentOrganization?._id || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any 
		})
	);

	// Query CV history for this expert
	const cvHistory = useQuery(
		api.expertCVs.getExpertCVHistory,
		() => ({ 
			userId: (expertId || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any, 
			organizationId: ($organizationStore.currentOrganization?._id || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any 
		})
	);

	// Get user ID from latest CV
	let userId = $derived(latestCV?.data?.userId || expertId);
	
	// Get the current CV data (the one we're editing)
	let cvData = $derived(latestCV?.data || null);

	// Organization context - use the organization from the CV or store
	let currentOrgId = $derived(cvData?.organizationId || $organizationStore.currentOrganization?._id || null);
	
	// Ensure we have a valid organization ID for queries
	let validOrgId = $derived(currentOrgId || 'j975t878dn66x7br1076wb7ey17skxyg'); // Fallback to a known org ID

	// Query user data if CV exists
	const userData = useQuery(
		api.utilities.getUserById,
		() => ({ id: (userId || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any })
	);

	// Query available services for this organization
	const serviceVersions = useQuery(api.utilities.getServiceVersions, () => ({}));

	const organizationApprovals = useQuery(
		api.utilities.getOrganizationApprovals,
		() => ({ organizationId: validOrgId as any })
	);

	// Get the current CV data (latest CV)
	let currentCVData = $derived(latestCV?.data);

	// Query existing service assignments for this CV
	const existingServiceAssignments = useQuery(
		api.expertServiceAssignments.getExpertServiceAssignments,
		() => ({ expertCVId: (currentCVData?._id || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any })
	);

	// Loading and error states
	let isLoading = $derived(latestCV?.isLoading || cvHistory?.isLoading || userData?.isLoading || false);
	let hasError = $derived(latestCV?.error || cvHistory?.error || userData?.error || false);

	// Derived states
	let latestCVData = $derived(latestCV?.data);
	let cvHistoryData = $derived(cvHistory?.data);
	let userDataResult = $derived(userData?.data);
	let serviceVersionsData = $derived(serviceVersions?.data);
	let organizationApprovalsData = $derived(organizationApprovals?.data);

	// Edit state
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);

	// Available services for the organization
	let availableServices = $derived.by((): Service[] => {
		// PROTOTYPE MODE: Show all services if:
		// 1. No organization is selected, OR
		// 2. No organization approvals exist
		if (!validOrgId || !organizationApprovalsData?.length) {
			return (serviceVersionsData || []).map((service: any) => ({
				name: service.name,
				_id: service._id
			}));
		}

		return (serviceVersionsData?.filter((service: any) =>
			organizationApprovalsData?.some(
				(approval: any) => approval.serviceVersionId === service._id
			)
		) || []).map((service: any) => ({
			name: service.name,
			_id: service._id
		}));
	});

	// Current form data (editable fields) - derived from CV data
	let selectedServices = $derived.by((): string[] => {
		if (!currentCVData || !existingServiceAssignments?.data || !serviceVersionsData) {
			return [];
		}
		
		const assignments = existingServiceAssignments.data;
		return assignments.map((assignment: any) => {
			const serviceVersion = serviceVersionsData.find(
				(version: any) => version._id === assignment.serviceVersionId
			);
			return serviceVersion?.name || '';
		}).filter(Boolean);
	});

	let serviceRoles = $derived.by((): Record<string, 'lead' | 'regular'> => {
		if (!currentCVData || !existingServiceAssignments?.data || !serviceVersionsData) {
			return {};
		}
		
		const assignments = existingServiceAssignments.data;
		const roles: Record<string, 'lead' | 'regular'> = {};
		
		assignments.forEach((assignment: any) => {
			const serviceVersion = serviceVersionsData.find(
				(version: any) => version._id === assignment.serviceVersionId
			);
			if (serviceVersion?.name) {
				roles[serviceVersion.name] = assignment.role || 'regular';
			}
		});
		
		return roles;
	});

	let experience = $derived(currentCVData?.experience || []);
	let education = $derived(currentCVData?.education || []);

	// Mutable state for user interactions (separate from derived state)
	let userSelectedServices = $state<string[]>([]);
	let userServiceRoles = $state<Record<string, 'lead' | 'regular'>>({});
	let userExperience = $state<any[]>([]);
	let userEducation = $state<any[]>([]);

	// Initialize user state from derived state when data loads
	$effect(() => {
		if (selectedServices.length > 0 || Object.keys(serviceRoles).length > 0) {
			userSelectedServices = selectedServices;
			userServiceRoles = serviceRoles;
		}
		if (experience.length > 0) {
			userExperience = experience;
		}
		if (education.length > 0) {
			userEducation = education;
		}
	});

	function goBack() {
		window.history.back();
	}

	async function handleSave() {
		if (isSaving || !currentCVData) return;

		try {
			isSaving = true;
			saveError = null;


			// Update the CV with new experience and education
			await client.mutation(api.expertCVs.updateExpertCV, {
				id: currentCVData._id as Id<'expertCVs'>,
				experience: userExperience,
				education: userEducation
			});

			// Handle service assignments
			// For now, we'll create new service assignments for all selected services
			// In a more sophisticated implementation, we'd handle updates and deletions
			const selectedServiceIds = userSelectedServices.map(serviceName => {
				const serviceVersion = serviceVersionsData?.find(
					(version: any) => version.name === serviceName
				);
				return serviceVersion?._id;
			}).filter(Boolean);

			if (selectedServiceIds.length > 0) {
				const serviceAssignments = userSelectedServices.map(serviceName => {
					const serviceVersion = serviceVersionsData?.find(
						(version: any) => version.name === serviceName
					);
					return {
						serviceVersionId: serviceVersion?._id as Id<'serviceVersions'>,
						role: userServiceRoles[serviceName] || 'regular'
					};
				}).filter(assignment => assignment.serviceVersionId);

				if (serviceAssignments.length > 0) {
					await client.mutation(api.expertServiceAssignments.createMultipleServiceAssignments, {
						organizationId: validOrgId as Id<'organizations'>,
						userId: userId as Id<'users'>,
						expertCVId: currentCVData._id as Id<'expertCVs'>,
						assignedBy: 'system', // or get from user context
						serviceAssignments: serviceAssignments
					});
				}
			}

			// Show success message
			toast.success('Expert profile updated successfully!');
			
			// Navigate back to user management
			goto('/user-management?section=experts');

		} catch (error) {
			console.error('Error saving expert:', error);
			saveError = error instanceof Error ? error.message : 'An error occurred while saving';
			toast.error('Failed to update expert profile');
		} finally {
			isSaving = false;
		}
	}

	function handleToggleService(serviceName: string) {
		if (userSelectedServices.includes(serviceName)) {
			userSelectedServices = userSelectedServices.filter((s) => s !== serviceName);
			delete userServiceRoles[serviceName];
		} else {
			userSelectedServices = [...userSelectedServices, serviceName];
			userServiceRoles[serviceName] = 'regular';
		}
	}

	function handleToggleRole(serviceName: string) {
		userServiceRoles[serviceName] = userServiceRoles[serviceName] === 'lead' ? 'regular' : 'lead';
	}

	function handleUpdateExperience(newExperience: any[]) {
		userExperience = newExperience;
	}

	function handleUpdateEducation(newEducation: any[]) {
		userEducation = newEducation;
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
		{:else if !currentCVData}
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
				<h2 class="text-xl font-semibold text-gray-800 mb-2">Expert CV Not Found</h2>
				<p class="text-gray-600 mb-4">The requested expert CV could not be found</p>
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
								class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {currentCVData.status === 'locked'
									? 'bg-green-100 text-green-800'
									: currentCVData.status === 'submitted'
									? 'bg-yellow-100 text-yellow-800'
									: 'bg-blue-100 text-blue-800'}"
							>
								{currentCVData.status === 'locked'
									? 'Complete'
									: currentCVData.status === 'submitted'
									? 'Under Review'
									: `Draft - CV v${currentCVData.version}`}
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
					availableServices={availableServices}
					selectedServices={userSelectedServices}
					serviceRoles={userServiceRoles}
					currentOrgId={validOrgId}
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
					experience={userExperience}
					on:updateExperience={(e) => handleUpdateExperience(e.detail)}
				/>
			</div>

			<!-- STEP 5: Education -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-4">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Step 5: Education & Certifications</h2>
					<p class="text-gray-600">Add educational background and relevant certifications</p>
				</div>
				<Step5Education education={userEducation} on:updateEducation={(e) => handleUpdateEducation(e.detail)} />
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
