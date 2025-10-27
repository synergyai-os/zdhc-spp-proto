<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import ServiceSelection from '$lib/components/add-expert/ServiceSelection.svelte';
	import AddExpertStatusCard from '$lib/components/add-expert/AddExpertStatusCard.svelte';
	import { goto } from '$app/navigation';

	const client = useConvexClient();
	const currentOrgId = DEFAULT_ORG_ID;

	// Query all users from PDC (fake lookup)
	const existingUsers = useQuery(api.utilities.getUsers, {});
	const serviceVersions = useQuery((api as any).serviceVersions.getServiceVersions, {});
	const organizationApprovals = useQuery(
		(api as any).serviceVersions.getOrganizationApprovals,
		() => ({ organizationId: currentOrgId })
	);

	// State
	let emailInput = $state('');
	let foundUser = $state<{
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
		country: string;
	} | null>(null);
	let checked = $state(false);
	let inDraftMode = $state(false);
	let creatingNewCVVersion = $state(false);
	let selectedServices = $state<string[]>([]);
	let serviceRoles = $state<Record<string, 'regular' | 'lead'>>({});
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);

	// Query latest CV if we found a user (not in draft mode)
	const latestCV = useQuery(
		api.expert.getLatestCV,
		() => {
			// Only query when we have a real user and not in draft mode
			if (!foundUser || !currentOrgId || inDraftMode) {
				return {
					userId: 'j1j1j1j1j1j1j1j1j1j1j1j1j1' as Id<'users'>,
					organizationId: 'j1j1j1j1j1j1j1j1j1j1j1j1j1' as Id<'organizations'>
				};
			}
			return {
				userId: foundUser._id as Id<'users'>,
				organizationId: currentOrgId as Id<'organizations'>
			};
		}
	);

	// Query existing service assignments for the locked_final CV (for pre-selection)
	const existingAssignments = useQuery(
		api.expertServiceAssignments.getExpertServiceAssignments,
		() => {
			if (!foundUser || !currentOrgId || !cvData || scenario() !== 'cv_final') {
				return {
					expertCVId: 'j1j1j1j1j1j1j1j1j1j1j1j1j1' as Id<'expertCVs'>
				};
			}
			return {
				expertCVId: cvData._id as Id<'expertCVs'>
			};
		}
	);

	// Query all service assignments for the organization to check for existing leads
	const orgAssignments = useQuery(
		api.expertServiceAssignments.getExpertServiceAssignments,
		() => {
			if (!currentOrgId) {
				return {
					organizationId: 'j1j1j1j1j1j1j1j1j1j1j1j1j1' as Id<'organizations'>
				};
			}
			return {
				organizationId: currentOrgId as Id<'organizations'>
			};
		}
	);

	// Determine the workflow scenario
	type WorkflowScenario =
		| 'no_user_found'
		| 'user_no_cv'
		| 'cv_editable'
		| 'cv_blocked'
		| 'cv_final';

	const scenario = $derived((): WorkflowScenario => {
		if (!foundUser) return 'no_user_found';
		
		const cvData = latestCV?.data;
		if (!cvData || Array.isArray(cvData)) return 'user_no_cv';

		const status = cvData.status;
		if (status === 'draft' || status === 'completed') return 'cv_editable';
		if (status === 'paid' || status === 'payment_pending' || status === 'locked_for_review' || status === 'unlocked_for_edits')
			return 'cv_blocked';
		if (status === 'locked_final') return 'cv_final';

		return 'no_user_found';
	});

	const cvData = $derived(latestCV?.data && !Array.isArray(latestCV.data) ? latestCV.data : null);

	function checkEmail() {
		const email = emailInput.trim().toLowerCase();
		const user = existingUsers?.data?.find((u) => u.email.toLowerCase() === email);

		if (user) {
			foundUser = {
				_id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				country: user.country
			};
		} else {
			foundUser = null;
		}
		checked = true;
	}

	function reset() {
		emailInput = '';
		foundUser = null;
		checked = false;
		inDraftMode = false;
		creatingNewCVVersion = false;
		selectedServices = [];
		serviceRoles = {};
	}

	function startDraftMode() {
		inDraftMode = true;
	}

	function startCreatingNewCVVersion() {
		creatingNewCVVersion = true;
		
		// Pre-select services from existing assignments
		if (existingAssignments?.data && serviceVersions?.data) {
			const approvedAssignments = existingAssignments.data.filter(
				(assignment: any) => assignment.status === 'approved'
			);
			
			selectedServices = [];
			serviceRoles = {};
			
			approvedAssignments.forEach((assignment: any) => {
				const serviceVersionId = assignment.serviceVersionId;
				if (serviceVersionId) {
					selectedServices.push(serviceVersionId);
					serviceRoles[serviceVersionId] = assignment.role || 'regular';
				}
			});
		}
	}

	// Get available services for organization (full service objects with IDs)
	const availableServices = $derived.by(() => {
		if (!serviceVersions?.data || !organizationApprovals?.data || !currentOrgId) {
			return [];
		}

		const serviceVersionApprovals = new Map();
		organizationApprovals.data.forEach((approval: any) => {
			const existing = serviceVersionApprovals.get(approval.serviceVersionId);
			if (!existing || approval.updatedAt > existing.updatedAt) {
				serviceVersionApprovals.set(approval.serviceVersionId, approval);
			}
		});

		const approvedVersionIds = Array.from(serviceVersionApprovals.values())
			.filter((approval: any) => approval.status === 'approved')
			.map((approval: any) => approval.serviceVersionId);

		const approvedVersions = serviceVersions.data.filter((version: any) =>
			approvedVersionIds.includes(version._id)
		);

		// Return full service objects, not just names
		return approvedVersions;
	});

	function toggleService(serviceId: string) {
		const index = selectedServices.indexOf(serviceId);
		if (index > -1) {
			selectedServices = selectedServices.filter((s) => s !== serviceId);
			delete serviceRoles[serviceId];
		} else {
			selectedServices = [...selectedServices, serviceId];
			serviceRoles[serviceId] = 'regular';
		}
	}

	function toggleServiceRole(serviceId: string, newRole: string) {
		serviceRoles[serviceId] = newRole as 'regular' | 'lead';
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

	async function handleContinueDraftMode() {
		if (selectedServices.length === 0) return;

		isSubmitting = true;
		submitError = null;

		try {
			// Convert selected services to the format needed for the mutation
			const serviceAssignments = selectedServices.map((serviceId) => ({
				serviceVersionId: serviceId as Id<'serviceVersions'>,
				role: serviceRoles[serviceId] || 'regular'
			}));

			// Call the mutation
			const result = await client.mutation(api.utilities.createDraftExpert, {
				email: emailInput.trim(),
				organizationId: currentOrgId as Id<'organizations'>,
				serviceAssignments,
				createdBy: 'system', // TODO: Get from authenticated user
				notes: `Draft expert created via add-expert flow`
			});

			if (result.success) {
				// Redirect to expert edit page
				await goto(`/user-management/experts/${result.userId}/edit`);
			} else {
				submitError = 'Failed to create draft expert. Please try again.';
			}
		} catch (error) {
			console.error('Error creating draft expert:', error);
			submitError = error instanceof Error ? error.message : 'An unexpected error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function handleEditCV() {
		if (foundUser) {
			goto(`/user-management/experts/${foundUser._id}/edit`);
		}
	}

	async function handleCreateNewCVVersion() {
		if (selectedServices.length === 0 || !foundUser || !cvData || !existingAssignments?.data) return;

		isSubmitting = true;
		submitError = null;

		try {
			// Get approved assignments from the locked_final CV
			const approvedAssignments = existingAssignments.data.filter(
				(assignment: any) => assignment.status === 'approved'
			);

			// Build map of existing assignments (serviceVersionId -> role)
			const existingServiceMap = new Map(
				approvedAssignments.map((assignment: any) => [
					assignment.serviceVersionId,
					assignment.role
				])
			);

			// Filter out duplicates (same service + same role)
			const newOrChangedServices = selectedServices.filter((serviceId) => {
				const selectedRole = serviceRoles[serviceId] || 'regular';
				const existingRole = existingServiceMap.get(serviceId);
				
				// Include if service is new OR role has changed
				return !existingRole || existingRole !== selectedRole;
			});

			// If no new or changed services, show error
			if (newOrChangedServices.length === 0) {
				submitError = 'No changes detected. All selected services already exist with the same role.';
				isSubmitting = false;
				return;
			}

			// Convert filtered services to the format needed for the mutation
			const serviceAssignments = newOrChangedServices.map((serviceId) => ({
				serviceVersionId: serviceId as Id<'serviceVersions'>,
				role: serviceRoles[serviceId] || 'regular'
			}));

			// Create new CV version (experience/education will be copied by the model layer)
			const cvId = await client.mutation(api.expertCVs.createExpertCV, {
				userId: foundUser._id as Id<'users'>,
				organizationId: currentOrgId as Id<'organizations'>,
				experience: cvData.experience || [], // Copy from current CV
				education: cvData.education || [], // Copy from current CV
				createdBy: 'system',
				notes: `New CV version created to add/modify services`
			});

			// Create service assignments only for new/changed services
			for (const assignment of serviceAssignments) {
				await client.mutation(api.expertServiceAssignments.createExpertServiceAssignment, {
					userId: foundUser._id as Id<'users'>,
					organizationId: currentOrgId as Id<'organizations'>,
					expertCVId: cvId as Id<'expertCVs'>,
					serviceVersionId: assignment.serviceVersionId,
					role: assignment.role,
					assignedBy: 'system'
				});
			}

			// Redirect to edit page
			await goto(`/user-management/experts/${foundUser._id}/edit`);
		} catch (error) {
			console.error('Error creating new CV version:', error);
			submitError = error instanceof Error ? error.message : 'An unexpected error occurred';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="bg-gray-50 min-h-screen py-8">
	<div class="max-w-4xl mx-auto px-6">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Add Expert</h1>
			<p class="text-gray-600">
				Add an expert to your team or add services to an existing expert
			</p>
		</div>

		<!-- Email Input Section -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<h2 class="text-xl font-bold text-gray-800 mb-4">Find Expert by Email</h2>
			<p class="text-gray-600 mb-6">
				Enter the expert's email address to check if they're already in the system
			</p>

			<div class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email Address *
					</label>
					<div class="flex gap-3">
						<input
							id="email"
							type="email"
							bind:value={emailInput}
							placeholder="expert@example.com"
							class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<button
							type="button"
							onclick={checkEmail}
							disabled={emailInput.trim() === ''}
							class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
						>
							Find Expert
						</button>
						{#if checked}
							<button
								type="button"
								onclick={reset}
								class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
							>
								Reset
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Results Section -->
		{#if checked && inDraftMode}
			<!-- Service Selection for Draft Mode -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div class="mb-6">
					<h2 class="text-xl font-bold text-gray-800 mb-2">Select Services</h2>
					<p class="text-gray-600">
						Choose which services this expert will provide. Select whether they are a LEAD or regular expert
						for each service.
					</p>
					<p class="text-sm text-gray-500 mt-2">
						Adding: <strong>{emailInput}</strong> (new expert)
					</p>
				</div>

				<ServiceSelection
					availableServices={availableServices}
					selectedServices={selectedServices}
					serviceRoles={serviceRoles}
					onServiceToggle={toggleService}
					onServiceRoleToggle={toggleServiceRole}
					isLoading={serviceVersions?.isLoading || organizationApprovals?.isLoading}
					hasLeadExpert={hasLeadExpert}
				/>

			<div class="mt-6">
				<!-- Error Message -->
				{#if submitError}
					<div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
						<p class="text-sm text-red-700">{submitError}</p>
					</div>
				{/if}

				<div class="flex gap-3">
					<button
						type="button"
						onclick={() => (inDraftMode = false)}
						disabled={isSubmitting}
						class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						← Back
					</button>
					<button
						type="button"
						onclick={handleContinueDraftMode}
						disabled={selectedServices.length === 0 || isSubmitting}
						class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<span class="flex items-center gap-2">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								Creating...
							</span>
						{:else}
							Continue →
						{/if}
					</button>
				</div>
			</div>
			</div>

		{:else if checked && !foundUser}
			<AddExpertStatusCard
				variant="yellow"
				icon="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
				title="Expert Not Found"
				subtitle="This email is not in the system yet. You can still add this expert to your team."
				nextSteps={[
					'Create a draft expert profile',
					'Add services and CV information',
					'Invite them to complete their profile',
					'Profile will be finalized once they accept'
				]}
				buttonText="Continue with Draft Mode →"
				buttonAction={startDraftMode}
			/>

		{:else if checked && foundUser}
				<!-- User Found - Show CV Status Based Next Steps -->
				{#if latestCV?.isLoading}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
						<div class="flex items-center">
							<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
							<span class="text-blue-700">Loading CV status...</span>
						</div>
					</div>

				{:else if scenario() === 'user_no_cv'}
					<AddExpertStatusCard
						variant="green"
						icon="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						title="Expert Found"
						subtitle="{foundUser.firstName} {foundUser.lastName} ({foundUser.email})"
						statusInfo="Status: New Expert"
						description="This expert is new to your organization."
						nextSteps={[
							'Create a new CV for this expert',
							'Select services to assign',
							'Add experience and education information',
							'Submit for review'
						]}
						buttonText="Create New CV →"
					/>

				{:else if scenario() === 'cv_editable'}
					<AddExpertStatusCard
						variant="blue"
						icon="M13.586 3.586A2 2 0 1116.414 6.414l-3 3A2 2 0 0112 11h-1V9h1a2 2 0 001.414-.586l3-3zM11 13v1a2 2 0 01-2 2H8v1h2a2 2 0 002-2v-1h1a2 2 0 001.414-.586l3-3A2 2 0 0118 6v-.586l-1.293 1.293-1 1L13.586 2.586l-1 1L14.293 5H13a2 2 0 01-2 2v1H7V8a2 2 0 00-2-2H4V4.586l-1.293 1.293-1-1L4.414 2.586z"
						title="{foundUser.firstName} {foundUser.lastName}"
						subtitle="CV Status: {cvData?.status || 'Unknown'}"
						statusInfo="Status: Editable CV"
						description="This CV can be edited. You can add or remove services, and update experience/education."
						nextSteps={[
							'Edit existing CV to add/remove services',
							'Update experience and education if needed',
							'Save and submit when complete'
						]}
						buttonText="Edit CV →"
						buttonAction={handleEditCV}
					/>

				{:else if scenario() === 'cv_blocked'}
					<AddExpertStatusCard
						variant="red"
						icon="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
						title="{foundUser.firstName} {foundUser.lastName}"
						subtitle="CV Status: {cvData?.status || 'Unknown'}"
						statusInfo="Status: Cannot Add Services"
						description="This CV is currently {cvData?.status
							? cvData.status.replace('_', ' ')
							: 'Unknown'}. Services cannot be added or removed until the CV reaches locked_final status."
						nextSteps={[
							'CV is under review or in payment flow',
							'Services are locked for audit purposes',
							'Wait for current CV to be finalized before adding new services'
						]}
						buttonText="CV Under Review - Wait for Locked Final"
						buttonDisabled={true}
					/>

				{:else if scenario() === 'cv_final'}
					{#if creatingNewCVVersion}
						<!-- Service Selection for New CV Version -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
							<div class="mb-6">
								<h2 class="text-xl font-bold text-gray-800 mb-2">Select Services for New CV Version</h2>
								<p class="text-gray-600">
									Services that are already approved are included automatically and cannot be modified. You can only add new services.
								</p>
								<p class="text-sm text-gray-500 mt-2">
									Creating version {cvData?.version ? cvData.version + 1 : 2}
								</p>
							</div>

							{#if existingAssignments?.data}
								{@const readOnlyServices = existingAssignments.data
									.filter((assignment: any) => assignment.status === 'approved')
									.map((assignment: any) => assignment.serviceVersionId)}
								
								<ServiceSelection
									availableServices={availableServices}
									selectedServices={selectedServices}
									serviceRoles={serviceRoles}
									onServiceToggle={toggleService}
									onServiceRoleToggle={toggleServiceRole}
									isLoading={serviceVersions?.isLoading || organizationApprovals?.isLoading}
									hasLeadExpert={hasLeadExpert}
									readOnlyServices={readOnlyServices}
								/>
							{:else}
								<ServiceSelection
									availableServices={availableServices}
									selectedServices={selectedServices}
									serviceRoles={serviceRoles}
									onServiceToggle={toggleService}
									onServiceRoleToggle={toggleServiceRole}
									isLoading={serviceVersions?.isLoading || organizationApprovals?.isLoading}
									hasLeadExpert={hasLeadExpert}
									readOnlyServices={[]}
								/>
							{/if}

							<div class="mt-6">
								<!-- Error Message -->
								{#if submitError}
									<div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
										<p class="text-sm text-red-700">{submitError}</p>
									</div>
								{/if}

								<div class="flex gap-3">
									<button
										type="button"
										onclick={() => (creatingNewCVVersion = false)}
										disabled={isSubmitting}
										class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										← Back
									</button>
									<button
										type="button"
										onclick={handleCreateNewCVVersion}
										disabled={selectedServices.length === 0 || isSubmitting}
										class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
									>
										{#if isSubmitting}
											<span class="flex items-center gap-2">
												<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
												Creating...
											</span>
										{:else}
											Create New CV Version →
										{/if}
									</button>
								</div>
							</div>
						</div>
					{:else}
						<AddExpertStatusCard
							variant="purple"
							icon="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
							title="{foundUser.firstName} {foundUser.lastName}"
							subtitle="CV Status: Locked Final (Version {cvData?.version || 1})"
							statusInfo="Status: Can Add New Services"
							description="The current CV is finalized. You can create a new CV version to add additional services."
							nextSteps={[
								`Create new CV version (Version ${cvData?.version ? cvData.version + 1 : 2})`,
								'Select new services to assign',
								'Experience and education will be copied from previous CV',
								'Can modify experience/education if needed'
							]}
							buttonText="Create New CV Version →"
							buttonAction={startCreatingNewCVVersion}
						/>
					{/if}
				{/if}
		{/if}
	</div>
</div>

