<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import { organizationStore } from '$lib/stores/organization.svelte';
	
	// Get Convex client
	const client = useConvexClient();
	
	// ==========================================
	// ORGANIZATION CONTEXT
	// ==========================================
	
	// Organization context
	let currentOrgId = $state<string | null>(null);
	let orgContext = $derived($organizationStore);
	
	// Update currentOrgId when organization changes
	$effect(() => {
		currentOrgId = orgContext.currentOrganization?._id || null;
	});
	
	// ==========================================
	// CONVEX QUERIES
	// ==========================================
	
	// Query existing users (PDC data)
	const existingUsers = useQuery(api.expertAssignments.getUsers, {});
	
	// Query available service versions
	const serviceVersions = useQuery((api as any).serviceVersions.getServiceVersions, {});
	
	// Query organization approvals to get approved services
	const organizationApprovals = useQuery(
		(api as any).serviceVersions.getOrganizationApprovals,
		() => currentOrgId ? { organizationId: currentOrgId } : { organizationId: "" }
	);
	
	// Available services derived from organization's approved services only
	const availableServices = $derived.by(() => {
		if (!serviceVersions?.data || !organizationApprovals?.data || !currentOrgId) {
			return [];
		}
		
		// Get approved service version IDs (get most recent approval for each service)
		const serviceVersionApprovals = new Map();
		
		// Group approvals by service version ID
		organizationApprovals.data.forEach((approval: any) => {
			const existing = serviceVersionApprovals.get(approval.serviceVersionId);
			if (!existing || approval.updatedAt > existing.updatedAt) {
				serviceVersionApprovals.set(approval.serviceVersionId, approval);
			}
		});
		
		// Get approved service version IDs (only most recent approvals with approved status)
		const approvedVersionIds = Array.from(serviceVersionApprovals.values())
			.filter((approval: any) => approval.status === 'approved')
			.map((approval: any) => approval.serviceVersionId);
		
		// Get approved service versions and return their names
		const approvedVersions = serviceVersions.data.filter((version: any) =>
			approvedVersionIds.includes(version._id)
		);
		
		return approvedVersions.map((version: any) => version.name);
	});
	
	// Loading states
	const isLoadingUsers = $derived(existingUsers?.isLoading || false);
	const isLoadingServices = $derived(serviceVersions?.isLoading || organizationApprovals?.isLoading || false);
	const hasError = $derived(existingUsers?.error || serviceVersions?.error || organizationApprovals?.error || false);

	// ==========================================
	// SVELTE 5 STATE (using $state rune)
	// ==========================================
	let currentStep = $state(1);
	let emailInput = $state('');
	let userExists = $state<boolean | null>(null);
	let pdcUserData = $state<{firstName: string, lastName: string, email: string, country: string} | null>(null);
	let selectedServices = $state<string[]>([]);
	let serviceRoles = $state<Record<string, 'regular' | 'lead'>>({});
	let invitationSent = $state(false);
	let isDraftMode = $state(false);
	let invitedUserEmail = $state('');
	
	// Draft tracking state
	let userId = $state<string | null>(null);
	let draftAssignmentIds = $state<any[]>([]);
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	
	// Professional Experience (SPP-owned data)
	let experience = $state([
		{
			id: crypto.randomUUID(),
			title: '',
			company: '',
			location: '',
			startDate: '',
			endDate: '',
			current: false,
			description: ''
		}
	]);
	
	// Education (SPP-owned data)
	let education = $state([
		{
			id: crypto.randomUUID(),
			school: '',
			degree: '',
			field: '',
			startDate: '',
			endDate: '',
			description: ''
		}
	]);

	// ==========================================
	// DERIVED STATE (using $derived rune)
	// ==========================================
	const totalSteps = $derived(5);
	const progressPercentage = $derived((currentStep / totalSteps) * 100);
	const canProceedFromStep1 = $derived(emailInput.trim() !== '' && userExists !== null);
	const canProceedFromStep2 = $derived(pdcUserData !== null || isDraftMode);
	const canProceedFromStep3 = $derived(selectedServices.length > 0);
	const canProceedFromStep4 = $derived(experience.length > 0 && experience.every(exp => exp.title.trim() !== ''));
	const canProceedFromStep5 = $derived(education.length > 0 && education.every(edu => edu.school.trim() !== ''));

	// ==========================================
	// FUNCTIONS
	// ==========================================
	
	/**
	 * Check if user exists in PDC (real user database)
	 */
	function checkUserInPdc() {
		const email = emailInput.trim().toLowerCase();
		const foundUser = existingUsers?.data?.find(user => user.email.toLowerCase() === email);
		
		if (foundUser) {
			userExists = true;
			pdcUserData = {
				firstName: foundUser.firstName,
				lastName: foundUser.lastName,
				email: foundUser.email,
				country: foundUser.country
			};
			isDraftMode = false;
			// Auto-advance to next step when user is found
			nextStep();
		} else {
			userExists = false;
			pdcUserData = null;
			isDraftMode = false;
		}
	}

	/**
	 * Send invitation to user and enable draft mode
	 */
	function sendInvitation() {
		console.log(`📧 Invitation sent to: ${emailInput}`);
		invitationSent = true;
		isDraftMode = true;
		invitedUserEmail = emailInput.trim();
		
		// In real app: POST to /api/invite with email
		// Status will be tracked as "Invited to ZDHC" with 90-day expiry
		
		// Auto-advance to next step in draft mode
		nextStep();
	}

	/**
	 * Save draft after step 1 - create user record and shell assignments
	 */
	async function saveDraftAfterStep1() {
		if (isSaving) return;
		
		try {
			isSaving = true;
			saveError = null;
			
			if (isDraftMode) {
				// Create user record for invited user
				userId = await client.mutation(api.expertAssignments.createUser, {
					firstName: invitedUserEmail.split('@')[0],
					lastName: '',
					email: invitedUserEmail,
					country: 'Unknown',
					isActive: false
				});
			} else if (pdcUserData) {
				// Check if user already exists in our database
				const existingUser = existingUsers?.data?.find(user => user.email.toLowerCase() === pdcUserData!.email.toLowerCase());
				
				if (existingUser) {
					userId = existingUser._id;
				} else {
					// Create new user record for PDC user
					userId = await client.mutation(api.expertAssignments.createUser, {
						firstName: pdcUserData.firstName,
						lastName: pdcUserData.lastName,
						email: pdcUserData.email,
						country: pdcUserData.country,
						isActive: true
					});
				}
			} else {
				throw new Error('No user data found to save');
			}
			
			// Create shell assignment to connect user to organization
			// This assignment has NO service assigned yet - that happens in step 3
			if (!currentOrgId) {
				throw new Error('No organization selected');
			}
			
			// Create a shell assignment without any service
			// This will be updated in step 3 when actual services are selected
			const shellAssignment = await client.mutation(api.expertAssignments.createShellAssignment, {
				userId: userId as Id<"users">,
				organizationId: currentOrgId as Id<"organizations">,
				assignedBy: 'current-user-id', // TODO: Get actual user ID
				notes: 'Shell assignment - services will be assigned in step 3'
			});
			
			draftAssignmentIds = [shellAssignment];
			console.log('✅ Shell assignment created (no service):', shellAssignment);
			
			console.log('✅ User created/saved:', userId);
		} catch (error) {
			console.error('Error saving user:', error);
			saveError = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			isSaving = false;
		}
	}

	/**
	 * Save services step - update shell assignment or create new ones
	 */
	async function saveServicesStep() {
		if (isSaving || !userId || selectedServices.length === 0) return;
		
		try {
			isSaving = true;
			saveError = null;
			
			if (!currentOrgId) {
				throw new Error('No organization selected');
			}
			
			const serviceAssignments = selectedServices.map(serviceName => {
				const serviceVersion = serviceVersions?.data?.find((version: any) => version.name === serviceName);
				if (!serviceVersion) {
					throw new Error(`Service version not found for: ${serviceName}`);
				}
				return {
					serviceVersionId: serviceVersion._id,
					role: serviceRoles[serviceName] || 'regular'
				};
			});
			
			if (draftAssignmentIds.length === 1 && selectedServices.length === 1) {
				// Update existing shell assignment
				const serviceVersion = serviceVersions?.data?.find((version: any) => version.name === selectedServices[0]);
				if (serviceVersion) {
					await client.mutation(api.expertAssignments.updateExpertAssignmentService, {
						id: draftAssignmentIds[0] as Id<"expertAssignments">,
						serviceVersionId: serviceVersion._id,
						role: serviceRoles[selectedServices[0]] || 'regular',
						profileCompletionStep: 3
					});
					console.log('✅ Shell assignment updated with service:', selectedServices[0]);
				}
			} else {
				// Delete shell assignment and create new ones for multiple services
				if (draftAssignmentIds.length > 0) {
					await client.mutation(api.expertAssignments.deleteExpertAssignment, {
						id: draftAssignmentIds[0] as Id<"expertAssignments">
					});
				}
				
				draftAssignmentIds = await client.mutation(api.expertAssignments.createExpertAssignmentsForUser, {
					userId: userId as Id<"users">,
					organizationId: currentOrgId as Id<"organizations">,
					serviceAssignments: serviceAssignments,
					assignedBy: 'current-user-id' // TODO: Get actual user ID
				});
				
				console.log('✅ Services saved, assignment IDs:', draftAssignmentIds);
			}
		} catch (error) {
			console.error('Error saving services:', error);
			saveError = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			isSaving = false;
		}
	}

	/**
	 * Save experience step
	 */
	async function saveExperienceStep() {
		if (isSaving || draftAssignmentIds.length === 0) return;
		
		try {
			isSaving = true;
			saveError = null;
			
			const experienceData = experience.filter(exp => exp.title.trim() !== '').map(exp => ({
				title: exp.title,
				company: exp.company,
				location: exp.location,
				startDate: exp.startDate,
				endDate: exp.endDate,
				current: exp.current,
				description: exp.description
			}));
			
			await client.mutation(api.expertAssignments.updateMultipleAssignmentsExperience, {
				assignmentIds: draftAssignmentIds,
				experience: experienceData,
				profileCompletionStep: 4
			});
			
			console.log('✅ Experience saved for assignments:', draftAssignmentIds);
		} catch (error) {
			console.error('Error saving experience:', error);
			saveError = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			isSaving = false;
		}
	}

	/**
	 * Save education step and mark profile as complete
	 */
	async function saveEducationStep() {
		if (isSaving || draftAssignmentIds.length === 0) return;
		
		try {
			isSaving = true;
			saveError = null;
			
			const educationData = education.filter(edu => edu.school.trim() !== '').map(edu => ({
				school: edu.school,
				degree: edu.degree,
				field: edu.field,
				startDate: edu.startDate,
				endDate: edu.endDate,
				description: edu.description
			}));
			
			await client.mutation(api.expertAssignments.updateMultipleAssignmentsEducation, {
				assignmentIds: draftAssignmentIds,
				education: educationData,
				profileCompletionStep: 5,
				isProfileComplete: true
			});
			
			console.log('✅ Education saved, profile complete for assignments:', draftAssignmentIds);
			
			// Store expert name for success page
			const expertDisplayName = isDraftMode 
				? invitedUserEmail 
				: `${pdcUserData?.firstName} ${pdcUserData?.lastName}`.trim();
			
			if (typeof window !== 'undefined') {
				localStorage.setItem('spp_last_added_expert', expertDisplayName);
			}
			
			// Navigate to success page
			window.location.href = '/user-management/add-expert/success';
		} catch (error) {
			console.error('Error saving education:', error);
			saveError = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			isSaving = false;
		}
	}

	/**
	 * Navigate to next step with auto-save
	 */
	async function nextStep() {
		if (isSaving) return; // Prevent double-clicks
		
		try {
			saveError = null;
			
			// Save based on current step before advancing
			if (currentStep === 1 && canProceedFromStep1) {
				await saveDraftAfterStep1();
			} else if (currentStep === 3 && canProceedFromStep3) {
				await saveServicesStep();
			} else if (currentStep === 4 && canProceedFromStep4) {
				await saveExperienceStep();
			} else if (currentStep === 5 && canProceedFromStep5) {
				await saveEducationStep();
				// Navigation handled in saveEducationStep()
				return;
			}
			
			if (currentStep < totalSteps) {
				currentStep++;
			}
		} catch (error) {
			console.error('Save failed:', error);
			// saveError is already set in the save functions
		}
	}

	/**
	 * Navigate to previous step
	 */
	function previousStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	/**
	 * Toggle service selection
	 */
	function toggleService(service: string) {
		const index = selectedServices.indexOf(service);
		if (index > -1) {
			selectedServices = selectedServices.filter(s => s !== service);
			// Remove role when service is unchecked
			delete serviceRoles[service];
		} else {
			selectedServices = [...selectedServices, service];
			// Default to 'regular' role when service is checked
			serviceRoles[service] = 'regular';
		}
	}

	/**
	 * Toggle service role (regular ↔ lead)
	 */
	function toggleServiceRole(service: string) {
		if (serviceRoles[service] === 'regular') {
			serviceRoles[service] = 'lead';
		} else {
			serviceRoles[service] = 'regular';
		}
	}

	/**
	 * Add new experience entry
	 */
	function addExperience() {
		experience = [...experience, {
			id: crypto.randomUUID(),
			title: '',
			company: '',
			location: '',
			startDate: '',
			endDate: '',
			current: false,
			description: ''
		}];
	}

	/**
	 * Remove experience entry
	 */
	function removeExperience(id: string) {
		if (experience.length > 1) {
			experience = experience.filter(exp => exp.id !== id);
		}
	}

	/**
	 * Add new education entry
	 */
	function addEducation() {
		education = [...education, {
			id: crypto.randomUUID(),
			school: '',
			degree: '',
			field: '',
			startDate: '',
			endDate: '',
			description: ''
		}];
	}

	/**
	 * Remove education entry
	 */
	function removeEducation(id: string) {
		if (education.length > 1) {
			education = education.filter(edu => edu.id !== id);
		}
	}



	/**
	 * Cancel and go back
	 */
	function handleCancel() {
		if (userId) {
			// If user has been created, progress is saved
			if (confirm('Your progress has been saved. You can continue editing this expert profile at any time from the User Management page. Are you sure you want to leave?')) {
				window.history.back();
			}
		} else {
			// If no user created yet, warn about losing progress
			if (confirm('Are you sure? All progress will be lost.')) {
				window.history.back();
			}
		}
	}

	/**
	 * Fill with test data (dev only)
	 */
	function fillTestData() {
		emailInput = 'sarah.johnson@example.com';
		checkUserInPdc();
		// Auto-fill services for testing
		selectedServices = ['ETP Assessment', 'Chemical Management', 'Compliance Auditing'];
		serviceRoles = {
			'ETP Assessment': 'lead',
			'Chemical Management': 'lead', 
			'Compliance Auditing': 'regular'
		};
	}
</script>

<div class="bg-gray-50 min-h-screen py-8">
	<div class="max-w-4xl mx-auto px-6">
		
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">Add New Expert</h1>
					<p class="text-gray-600">Add an expert from PDC to your Solution Provider team</p>
				</div>
				
				<!-- Test Data Button (temporary - remove in production) -->
				<button
					type="button"
					onclick={fillTestData}
					class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm flex items-center gap-2"
				>
					🧪 Fill Test Data
					<span class="text-xs bg-purple-700 px-2 py-0.5 rounded">DEV</span>
				</button>
			</div>
		</div>

		<!-- Progress Tracker -->
		<div class="mb-8">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<!-- Step Labels -->
				<div class="flex justify-between mb-4">
					<div class="flex-1 text-center">
						<div class="flex flex-col items-center">
							<div class={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs ${
								currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
							}`}>
								1
							</div>
							<span class="text-xs font-medium text-gray-700">Email</span>
						</div>
					</div>
					
					<div class="flex-1 text-center">
						<div class="flex flex-col items-center">
							<div class={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs ${
								currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
							}`}>
								2
							</div>
							<span class="text-xs font-medium text-gray-700">Confirm</span>
						</div>
					</div>
					
					<div class="flex-1 text-center">
						<div class="flex flex-col items-center">
							<div class={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs ${
								currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
							}`}>
								3
							</div>
							<span class="text-xs font-medium text-gray-700">Services</span>
						</div>
					</div>
					
					<div class="flex-1 text-center">
						<div class="flex flex-col items-center">
							<div class={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs ${
								currentStep >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
							}`}>
								4
							</div>
							<span class="text-xs font-medium text-gray-700">Experience</span>
						</div>
					</div>
					
					<div class="flex-1 text-center">
						<div class="flex flex-col items-center">
							<div class={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs ${
								currentStep >= 5 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
							}`}>
								5
							</div>
							<span class="text-xs font-medium text-gray-700">Education</span>
						</div>
					</div>
				</div>
				
				<!-- Progress Bar -->
				<div class="w-full bg-gray-200 rounded-full h-2">
					<div 
						class="bg-blue-500 h-2 rounded-full transition-all duration-300"
						style="width: {progressPercentage}%"
					></div>
				</div>
			</div>
		</div>

		<!-- Save Error Display -->
		{#if saveError}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
					</svg>
					<div>
						<h3 class="text-sm font-medium text-red-800">Save Error</h3>
						<p class="text-sm text-red-700 mt-1">{saveError}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Step Content -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			
			<!-- STEP 1: Email Lookup -->
			{#if currentStep === 1}
				<div>
					<h2 class="text-xl font-bold text-gray-800 mb-4">Step 1: Enter Email Address</h2>
					<p class="text-gray-600 mb-6">Enter the expert's email to check if they exist in PDC (Platform for Data Collection)</p>
					
					{#if isLoadingUsers}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
							<div class="flex items-center">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
								<span class="text-blue-700">Loading user database...</span>
							</div>
						</div>
					{:else if hasError}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
							<div class="flex items-center">
								<svg class="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
								</svg>
								<span class="text-red-700">Error loading user database. Please refresh the page.</span>
							</div>
						</div>
					{/if}
					
					<div class="space-y-4">
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
								Email Address *
							</label>
							<input
								id="email"
								type="email"
								bind:value={emailInput}
								placeholder="expert@example.com"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						
						<button
							type="button"
							onclick={checkUserInPdc}
							disabled={emailInput.trim() === '' || isLoadingUsers}
							class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
						>
							{isLoadingUsers ? 'Loading...' : 'Check in PDC'}
						</button>
						
						<!-- Result Messages -->
						{#if userExists === true}
							<div class="bg-green-50 border border-green-200 rounded-lg p-4">
								<div class="flex items-start">
									<svg class="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
									</svg>
									<div>
										<h3 class="text-sm font-medium text-green-800">User Found in PDC!</h3>
										<p class="text-sm text-green-700 mt-1">Click "Next" to review their information</p>
									</div>
								</div>
							</div>
						{:else if userExists === false}
							<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
								<div class="flex items-start">
									<svg class="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
									</svg>
									<div class="flex-1">
										<h3 class="text-sm font-medium text-yellow-800">User Not Found in PDC</h3>
										<p class="text-sm text-yellow-700 mt-1">This user doesn't have a PDC account yet. You can invite them to join ZDHC.</p>
										
										{#if !invitationSent}
											<button
												type="button"
												onclick={sendInvitation}
												class="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
											>
												📧 Send Invitation to ZDHC
											</button>
										{:else}
											<div class="mt-3 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
												<p class="text-sm text-yellow-800 font-medium">✅ Invitation Sent!</p>
												<p class="text-xs text-yellow-700 mt-1">
													Status: <span class="font-semibold">Invited to ZDHC</span> (expires in 90 days)
												</p>
												<p class="text-xs text-yellow-700 mt-1">
													You'll be notified when the user signs up.
												</p>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}
						
						<!-- Dev Helper -->
						<div class="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
							<p class="font-medium mb-2">🧪 Dev: Test with these emails:</p>
							<ul class="list-disc list-inside space-y-1">
								<li>sarah.johnson@example.com</li>
								<li>michael.chen@example.com</li>
								<li>emma.wilson@example.com</li>
							</ul>
						</div>
					</div>
				</div>
			
			<!-- STEP 2: Confirm PDC Data or Draft Mode -->
			{:else if currentStep === 2}
				<div>
					{#if isDraftMode}
						<h2 class="text-xl font-bold text-gray-800 mb-4">Step 2: Draft Mode - Invitation Sent</h2>
						<p class="text-gray-600 mb-6">
							You're adding an expert in draft mode. The user has been invited to join ZDHC and will complete their profile information when they accept the invitation.
						</p>
						
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
							<div class="flex items-start">
								<svg class="w-6 h-6 text-blue-500 mt-0.5 mr-4" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
								</svg>
								<div class="flex-1">
									<h3 class="text-lg font-medium text-blue-800 mb-2">Invitation Status</h3>
									<div class="space-y-2 text-sm text-blue-700">
										<p><strong>Email:</strong> {invitedUserEmail}</p>
										<p><strong>Status:</strong> Invitation sent (expires in 90 days)</p>
										<p><strong>Mode:</strong> Draft - Expert assignments will be created and linked when user accepts invitation</p>
									</div>
								</div>
							</div>
						</div>
					{:else}
						<h2 class="text-xl font-bold text-gray-800 mb-4">Step 2: Confirm User Information</h2>
						<p class="text-gray-600 mb-6">
							Review the user's default data from PDC. This data is owned by the user and cannot be edited.
						</p>
						
						{#if pdcUserData}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
							<div class="space-y-4">
								<div>
									<div class="block text-sm font-medium text-gray-500 mb-1">First Name</div>
									<p class="text-lg font-semibold text-gray-800">{pdcUserData.firstName}</p>
								</div>
								
								<div>
									<div class="block text-sm font-medium text-gray-500 mb-1">Last Name</div>
									<p class="text-lg font-semibold text-gray-800">{pdcUserData.lastName}</p>
								</div>
								
								<div>
									<div class="block text-sm font-medium text-gray-500 mb-1">Email</div>
									<p class="text-lg font-semibold text-gray-800">{pdcUserData.email}</p>
								</div>
								
								<div>
									<div class="block text-sm font-medium text-gray-500 mb-1">Country</div>
									<p class="text-lg font-semibold text-gray-800">{pdcUserData.country}</p>
								</div>
							</div>
							
							<div class="mt-6 pt-4 border-t border-blue-300">
								<div class="flex items-center text-sm text-blue-700">
									<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
									</svg>
									<span><strong>Note:</strong> This data is managed by the user in PDC and cannot be modified here.</span>
								</div>
							</div>
						</div>
						{/if}
					{/if}
				</div>
			
			<!-- STEP 3: Select Services -->
			{:else if currentStep === 3}
				<div>
					<h2 class="text-xl font-bold text-gray-800 mb-4">Step 3: Select Services & Roles</h2>
					{#if isDraftMode}
						<p class="text-gray-600 mb-2">
							Choose which services this expert will provide and whether they are a LEAD expert for each service. These assignments will be created in draft mode and linked when the user accepts the invitation.
						</p>
					{:else}
						<p class="text-gray-600 mb-2">
							Choose which services this expert will provide and whether they are a LEAD expert for each service.
						</p>
					{/if}
					
					{#if currentOrgId}
						<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
							<div class="flex items-center text-sm text-green-700">
								<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
								<span><strong>Approved Services:</strong> Showing only services that your organization is approved to provide ({availableServices.length} available)</span>
							</div>
						</div>
					{:else}
						<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<div class="flex items-center text-sm text-yellow-700">
								<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
								</svg>
								<span><strong>No Organization Selected:</strong> Please select an organization to see approved services</span>
							</div>
						</div>
					{/if}
					
					{#if isLoadingServices}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
							<div class="flex items-center">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
								<span class="text-blue-700">Loading available services...</span>
							</div>
						</div>
					{:else if availableServices.length === 0}
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
							<div class="flex items-center">
								<svg class="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
								</svg>
								<span class="text-yellow-700">No services available. Please seed the database first.</span>
							</div>
						</div>
					{/if}
					<div class="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div class="flex items-center text-sm text-blue-700">
							<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
							</svg>
							<span><strong>Tip:</strong> Click the role badges to toggle between LEAD and Regular expert</span>
						</div>
					</div>
					
					{#if !isLoadingServices && availableServices.length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each availableServices as service}
							<div class="flex items-center justify-between p-4 border-2 rounded-lg transition-all {
								selectedServices.includes(service) 
									? 'border-blue-500 bg-blue-50' 
									: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
							}">
								<label class="flex items-center cursor-pointer flex-1">
									<input
										type="checkbox"
										checked={selectedServices.includes(service)}
										onchange={() => toggleService(service)}
										class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
									/>
									<span class="ml-3 text-sm font-medium text-gray-700">{service}</span>
								</label>
								
								{#if selectedServices.includes(service)}
									<button
										type="button"
										onclick={() => toggleServiceRole(service)}
										class="ml-3 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer transform hover:scale-105 hover:shadow-md {
											serviceRoles[service] === 'lead'
												? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300 border border-yellow-400'
												: 'bg-blue-200 text-blue-800 hover:bg-blue-300 border border-blue-400'
										}"
										title="Click to toggle between LEAD and Regular"
									>
										<span class="flex items-center gap-1">
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M3 3a1 1 0 000 2v11a1 1 0 102 0V5a1 1 0 011-1h7a1 1 0 100 2H6v10a1 1 0 102 0V6h7a1 1 0 100-2H6a3 3 0 00-3 3z" clip-rule="evenodd"/>
											</svg>
											{serviceRoles[service] === 'lead' ? 'LEAD' : 'Regular'}
										</span>
									</button>
								{/if}
							</div>
						{/each}
						</div>
					{/if}
					
					{#if selectedServices.length > 0}
						<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
							<h3 class="text-sm font-medium text-gray-800 mb-3">Service Assignment Summary:</h3>
							<div class="space-y-2">
								{#each selectedServices as service}
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-700">{service}</span>
										<span class="px-2 py-1 rounded text-xs font-medium {
											serviceRoles[service] === 'lead'
												? 'bg-yellow-200 text-yellow-800'
												: 'bg-blue-200 text-blue-800'
										}">
											{serviceRoles[service] === 'lead' ? 'LEAD Expert' : 'Regular Expert'}
										</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			
			<!-- STEP 4: Professional Experience -->
			{:else if currentStep === 4}
				<div>
					<h2 class="text-xl font-bold text-gray-800 mb-4">Step 4: Professional Experience</h2>
					<p class="text-gray-600 mb-2">
						Add the expert's professional experience. This information is managed by SPP and required for legal compliance.
					</p>
					<div class="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
						<div class="flex items-center text-sm text-yellow-700">
							<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
							</svg>
							<span><strong>Important:</strong> SPP owns this data and is legally responsible for employee information</span>
						</div>
					</div>
					
					<div class="space-y-6">
						{#each experience as exp, index}
							<div class="border border-gray-200 rounded-lg p-4">
								<div class="flex items-center justify-between mb-4">
									<h3 class="font-semibold text-gray-800">Experience #{index + 1}</h3>
									{#if experience.length > 1}
										<button
											type="button"
											onclick={() => removeExperience(exp.id)}
											class="text-red-500 hover:text-red-700"
											aria-label="Remove experience"
										>
											<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
												<path d="M6 18L18 6M6 6l12 12"/>
											</svg>
										</button>
									{/if}
								</div>
								
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="exp-title-{exp.id}" class="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
										<input
											id="exp-title-{exp.id}"
											type="text"
											bind:value={exp.title}
											required
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									
									<div>
										<label for="exp-company-{exp.id}" class="block text-sm font-medium text-gray-700 mb-2">Company</label>
										<input
											id="exp-company-{exp.id}"
											type="text"
											bind:value={exp.company}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									
									<div>
										<label for="exp-location-{exp.id}" class="block text-sm font-medium text-gray-700 mb-2">Location</label>
										<input
											id="exp-location-{exp.id}"
											type="text"
											bind:value={exp.location}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									
									<div>
										<fieldset class="block">
											<legend class="text-sm font-medium text-gray-700 mb-2">Employment Type</legend>
											<div class="flex items-center">
												<input
													id="exp-current-{exp.id}"
													type="checkbox"
													bind:checked={exp.current}
													class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
												/>
												<label for="exp-current-{exp.id}" class="ml-2 text-sm text-gray-700">Currently working here</label>
											</div>
										</fieldset>
									</div>
									
									<div>
										<label for="exp-start-{exp.id}" class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
										<input
											id="exp-start-{exp.id}"
											type="date"
											bind:value={exp.startDate}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									
									{#if !exp.current}
										<div>
											<label for="exp-end-{exp.id}" class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
											<input
												id="exp-end-{exp.id}"
												type="date"
												bind:value={exp.endDate}
												class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>
									{/if}
									
									<div class="md:col-span-2">
										<label for="exp-desc-{exp.id}" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
										<textarea
											id="exp-desc-{exp.id}"
											bind:value={exp.description}
											rows="3"
											placeholder="Describe key responsibilities and achievements..."
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										></textarea>
									</div>
								</div>
							</div>
						{/each}
						
						<button
							type="button"
							onclick={addExperience}
							class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
						>
							+ Add Another Experience
						</button>
					</div>
				</div>
			
			<!-- STEP 5: Education -->
			{:else if currentStep === 5}
				<div>
					<h2 class="text-xl font-bold text-gray-800 mb-4">Step 5: Education</h2>
					{#if isDraftMode}
						<p class="text-gray-600 mb-2">
							Add the expert's educational background. This information will be stored in draft mode and linked when the user accepts the invitation.
						</p>
					{:else}
						<p class="text-gray-600 mb-2">
							Add the expert's educational background. This information is managed by SPP and required for legal compliance.
						</p>
					{/if}
					<div class="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
						<div class="flex items-center text-sm text-yellow-700">
							<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
							</svg>
							<span><strong>Important:</strong> SPP owns this data and is legally responsible for employee information</span>
						</div>
					</div>
					
					<div class="space-y-6">
						{#each education as edu, index}
							<div class="border border-gray-200 rounded-lg p-4">
								<div class="flex items-center justify-between mb-4">
									<h3 class="font-semibold text-gray-800">Education #{index + 1}</h3>
									{#if education.length > 1}
										<button
											type="button"
											onclick={() => removeEducation(edu.id)}
											class="text-red-500 hover:text-red-700"
											aria-label="Remove education"
										>
											<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
												<path d="M6 18L18 6M6 6l12 12"/>
											</svg>
										</button>
									{/if}
								</div>
								
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="edu-school-{edu.id}" class="block text-sm font-medium text-gray-700 mb-2">School/University *</label>
										<input
											id="edu-school-{edu.id}"
											type="text"
											bind:value={edu.school}
											required
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									
									<div>
										<label for="edu-degree-{edu.id}" class="block text-sm font-medium text-gray-700 mb-2">Degree</label>
										<input
											id="edu-degree-{edu.id}"
											type="text"
											bind:value={edu.degree}
											placeholder="e.g., Bachelor's, Master's, PhD"
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									
									<div>
										<label for="edu-field-{edu.id}" class="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
										<input
											id="edu-field-{edu.id}"
											type="text"
											bind:value={edu.field}
											placeholder="e.g., Environmental Science, Chemistry"
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									
									<div>
										<label for="edu-year-{edu.id}" class="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
										<input
											id="edu-year-{edu.id}"
											type="number"
											bind:value={edu.endDate}
											placeholder="e.g., 2020"
											min="1900"
											max="2030"
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									
									<div class="md:col-span-2">
										<label for="edu-desc-{edu.id}" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
										<textarea
											id="edu-desc-{edu.id}"
											bind:value={edu.description}
											rows="2"
											placeholder="Additional details, honors, relevant coursework..."
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										></textarea>
									</div>
								</div>
							</div>
						{/each}
						
						<button
							type="button"
							onclick={addEducation}
							class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
						>
							+ Add Another Education
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Navigation Buttons -->
		<div class="flex items-center justify-between">
			<button
				type="button"
				onclick={handleCancel}
				class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
			>
				Cancel
			</button>
			
			<div class="flex gap-3">
				{#if currentStep > 1}
					<button
						type="button"
						onclick={previousStep}
						class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
					>
						← Back
					</button>
				{/if}
				
				{#if currentStep < totalSteps}
					<button
						type="button"
						onclick={nextStep}
						disabled={
							isSaving ||
							(currentStep === 1 && !canProceedFromStep1) ||
							(currentStep === 2 && !canProceedFromStep2) ||
							(currentStep === 3 && !canProceedFromStep3) ||
							(currentStep === 4 && !canProceedFromStep4)
						}
						class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{#if isSaving}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							Saving...
						{:else}
							Next →
						{/if}
					</button>
				{:else}
					<button
						type="button"
						onclick={nextStep}
						disabled={isSaving || !canProceedFromStep5}
						class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{#if isSaving}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							Completing...
						{:else if isDraftMode}
							📧 Save Draft & Send Invitation
						{:else}
							💾 Save Expert
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
