<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api, type Id } from '$lib';
	// NOTE: In prototype, expert ID comes from URL. In production, it will come from authenticated user session.
	import ExperienceView from '$lib/components/expert-edit/ExperienceView.svelte';
	import EducationView from '$lib/components/expert-edit/EducationView.svelte';
	import TrainingQualificationView from '$lib/components/expert-edit/TrainingQualificationView.svelte';
	import ApprovalView from '$lib/components/expert-edit/ApprovalView.svelte';
	import ExpertHeader from '$lib/components/expert-edit/ExpertHeader.svelte';
	import CompletionChecklist from '$lib/components/expert-edit/CompletionChecklist.svelte';
	import DevelopmentToolBar from '$lib/components/admin/DevelopmentToolBar.svelte';
	import TestDataGenerator from '$lib/components/expert-edit/TestDataGenerator.svelte';
	import { createExperienceEntry, createEducationEntry, createTrainingEntry } from '$lib/utils/cvDataHandlers';
	import { generateExperienceTestData, generateEducationTestData, generateTrainingTestData, generateApprovalTestData } from '$lib/utils/testDataGenerators';
	import { canEditCVContent, getCVStatusDisplayName, getCVStatusColor } from '../../../../convex/model/status';
	import { validateCVCompletion } from '$lib/cvValidation';
	import { shouldTransitionCVStatus } from '$lib/utils/cvStatusTransitionHandler';

	// NOTE: In prototype, expert ID comes from URL. In production, it will come from authenticated user session.
	const userId = $derived($page.params.cvId);
	const client = useConvexClient();
	let isAuthenticated = $state(false);
	let password = $state('password');
	
	// Organization selection state
	// Query all organizations this user has CVs for
	const userOrganizations = useQuery(api.expert.getLinkedOrganisationsByCV, () => ({
		userId: userId as Id<'users'>
	}));
	
	// Selected organization - defaults to first one if available
	let selectedOrgId = $state<string | null>(null);
	
	// Auto-select first organization when data loads
	$effect(() => {
		if (userOrganizations?.data && userOrganizations.data.length > 0 && !selectedOrgId) {
			selectedOrgId = userOrganizations.data[0].organizationId;
		}
	});
	
	// Get selected organization name
	const selectedOrgName = $derived.by(() => {
		if (!selectedOrgId || !userOrganizations?.data) return '';
		const org = userOrganizations.data.find(o => o.organizationId === selectedOrgId);
		return org?.organization.name || '';
	});
	
	// Save state
	let isSaving = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	const userData = useQuery(api.utilities.getUserById, () => ({
		id: userId as Id<'users'>
	}));

	// Query latest CV for selected organization
	const expertCV = useQuery(api.expert.getLatestCV, () => {
		if (!selectedOrgId) {
			// Return dummy query to prevent errors
			return {
				userId: 'j1j1j1j1j1j1j1j1j1j1j1j1j1' as Id<'users'>,
				organizationId: 'j1j1j1j1j1j1j1j1j1j1j1j1j1' as Id<'organizations'>
			};
		}
		return {
			userId: userId as Id<'users'>,
			organizationId: selectedOrgId as Id<'organizations'>
		};
	});

	const assignedServices = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => {
		if (!expertCV?.data || Array.isArray(expertCV.data) || !expertCV.data._id) {
			return { expertCVId: 'dummy' as Id<'expertCVs'> };
		}
		return { expertCVId: expertCV.data._id };
	});

	// Query latest CV for importing data (any status - if it has content, it can be imported)
	// Exclude current organization to avoid importing from the CV being edited
	const latestCVForImport = useQuery(api.expert.getLatestCVForImport, () => ({
		userId: userId as Id<'users'>,
		excludeOrganizationId: selectedOrgId ? selectedOrgId as Id<'organizations'> : undefined
	}));

	const email = $derived(userData?.data?.email || '');
	let localCVData = $state<any>(null);
	let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Reset and reload CV data when organization changes or CV data updates
	$effect(() => {
		if (selectedOrgId && expertCV?.data && !Array.isArray(expertCV.data)) {
			localCVData = { ...expertCV.data };
		} else {
			localCVData = null;
		}
	});

	// Computed assessment counts for CompletionChecklist
	const totalAssessments = $derived.by(() => {
		if (!expertCV?.data || Array.isArray(expertCV.data) || !expertCV.data.experience) return 0;
		return expertCV.data.experience.reduce((sum: number, exp: any) => {
			const assessmentCount = exp.fieldExperienceCounts?.assessment?.total || 0;
			return sum + assessmentCount;
		}, 0);
	});

	const totalAssessmentsLast12m = $derived.by(() => {
		if (!expertCV?.data || Array.isArray(expertCV.data) || !expertCV.data.experience) return 0;
		return expertCV.data.experience.reduce((sum: number, exp: any) => {
			const assessmentCount = exp.fieldExperienceCounts?.assessment?.last12m || 0;
			return sum + assessmentCount;
		}, 0);
	});

	function handleLogin() {
		if (password === 'password') {
			isAuthenticated = true;
		} else {
			alert('Incorrect password. Please use "password"');
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}

	function addExperience() {
		if (!localCVData) return;
		localCVData.experience = [...(localCVData.experience || []), createExperienceEntry()];
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

	function addEducation() {
		if (!localCVData) return;
		localCVData.education = [...(localCVData.education || []), createEducationEntry()];
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

	function addTraining() {
		if (!localCVData) return;
		localCVData.trainingQualifications = [...(localCVData.trainingQualifications || []), createTrainingEntry()];
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

	function removeApproval(index: number) {
		if (!localCVData) return;
		localCVData.otherApprovals = (localCVData.otherApprovals || []).filter((_: any, i: number) => i !== index);
	}

	// Import functions - append data from latest CV (any status)
	function importExperience() {
		if (!localCVData || !latestCVForImport?.data) return;
		
		const sourceExperience = latestCVForImport.data.experience || [];
		if (sourceExperience.length === 0) {
			importMessage = { type: 'error', text: 'No experience found in your previous CV.' };
			setTimeout(() => importMessage = null, 3000);
			return;
		}

		const existingExperience = localCVData.experience || [];
		localCVData.experience = [...existingExperience, ...sourceExperience];
		
		const orgName = latestCVForImport.data.organization?.name || 'previous organization';
		importMessage = { type: 'success', text: `${sourceExperience.length} experience ${sourceExperience.length === 1 ? 'entry' : 'entries'} imported from ${orgName} CV.` };
		setTimeout(() => importMessage = null, 5000);
	}

	function importEducation() {
		if (!localCVData || !latestCVForImport?.data) return;
		
		const sourceEducation = latestCVForImport.data.education || [];
		if (sourceEducation.length === 0) {
			importMessage = { type: 'error', text: 'No education found in your previous CV.' };
			setTimeout(() => importMessage = null, 3000);
			return;
		}

		const existingEducation = localCVData.education || [];
		localCVData.education = [...existingEducation, ...sourceEducation];
		
		const orgName = latestCVForImport.data.organization?.name || 'previous organization';
		importMessage = { type: 'success', text: `${sourceEducation.length} education ${sourceEducation.length === 1 ? 'entry' : 'entries'} imported from ${orgName} CV.` };
		setTimeout(() => importMessage = null, 5000);
	}

	function importTraining() {
		if (!localCVData || !latestCVForImport?.data) return;
		
		const sourceTraining = latestCVForImport.data.trainingQualifications || [];
		if (sourceTraining.length === 0) {
			importMessage = { type: 'error', text: 'No training qualifications found in your previous CV.' };
			setTimeout(() => importMessage = null, 3000);
			return;
		}

		const existingTraining = localCVData.trainingQualifications || [];
		localCVData.trainingQualifications = [...existingTraining, ...sourceTraining];
		
		const orgName = latestCVForImport.data.organization?.name || 'previous organization';
		importMessage = { type: 'success', text: `${sourceTraining.length} training qualification${sourceTraining.length === 1 ? '' : 's'} imported from ${orgName} CV.` };
		setTimeout(() => importMessage = null, 5000);
	}

	function importApprovals() {
		if (!localCVData || !latestCVForImport?.data) return;
		
		const sourceApprovals = latestCVForImport.data.otherApprovals || [];
		if (sourceApprovals.length === 0) {
			importMessage = { type: 'error', text: 'No approvals found in your previous CV.' };
			setTimeout(() => importMessage = null, 3000);
			return;
		}

		const existingApprovals = localCVData.otherApprovals || [];
		localCVData.otherApprovals = [...existingApprovals, ...sourceApprovals];
		
		const orgName = latestCVForImport.data.organization?.name || 'previous organization';
		importMessage = { type: 'success', text: `${sourceApprovals.length} approval${sourceApprovals.length === 1 ? '' : 's'} imported from ${orgName} CV.` };
		setTimeout(() => importMessage = null, 5000);
	}

	// Test data generation functions
	function fillTestData() {
		if (!localCVData) return;
		localCVData.experience = generateExperienceTestData();
	}

	function fillEducationTestData() {
		if (!localCVData) return;
		localCVData.education = generateEducationTestData();
	}

	function fillTrainingTestData() {
		if (!localCVData) return;
		localCVData.trainingQualifications = generateTrainingTestData();
	}

	function fillApprovalTestData() {
		if (!localCVData) return;
		localCVData.otherApprovals = generateApprovalTestData();
	}

	async function saveCVData() {
		if (!localCVData) return;
		
		isSaving = true;
		errorMessage = '';
		successMessage = '';
		
		if (!selectedOrgId) {
			errorMessage = 'Please select an organization';
			isSaving = false;
			return;
		}
		
		try {
			// Step 1: Save CV data first
			await client.mutation(api.expert.updateCV, {
				cvId: localCVData._id,
				organizationId: selectedOrgId as Id<'organizations'>,
				experience: localCVData.experience,
				education: localCVData.education,
				trainingQualifications: localCVData.trainingQualifications,
				otherApprovals: localCVData.otherApprovals
			});
			
			// Step 2: Validate CV completion and handle status transitions
			// Build CV object for validation (including service assignments)
			const cvForValidation = {
				...localCVData,
				serviceAssignments: assignedServices?.data || []
			};
			
			const validation = validateCVCompletion(cvForValidation);
			
			// Handle status transitions based on validation
			const currentStatus = expertCV?.data?.status || 'draft';
			const targetStatus = shouldTransitionCVStatus(currentStatus, validation.isValid);
			
			if (targetStatus) {
				await client.mutation(api.expert.updateCVStatus, {
					cvId: localCVData._id,
					newStatus: targetStatus
				});
				
				if (targetStatus === 'completed') {
					successMessage = 'CV saved and marked as complete! You can now submit for review.';
				} else {
					successMessage = 'CV saved successfully!';
				}
			} else {
				successMessage = 'CV saved successfully!';
			}
		} catch (error) {
			console.error('Error saving CV:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to save CV. Please try again.';
		} finally {
			isSaving = false;
		}
	}
	
	// Auto-dismiss success/error messages after 3 seconds
	$effect(() => {
		if (successMessage || errorMessage) {
			const timer = setTimeout(() => {
				successMessage = '';
				errorMessage = '';
			}, 3000);
			return () => clearTimeout(timer);
		}
	});
</script>

<svelte:head>
	<title>CV Completion - Login</title>
</svelte:head>

{#if !isAuthenticated}
	<div class="bg-gray-50 min-h-screen flex items-center justify-center px-4">
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-8 w-full max-w-md">
			<h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">CV Completion Login</h1>
			
			<div class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email Address
					</label>
					<input
						id="email"
						type="email"
						value={email}
						readonly
						class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						onkeypress={handleKeyPress}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<button
					type="button"
					onclick={handleLogin}
					class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
				>
					Login
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="bg-gray-50 min-h-screen pb-32">
		<div class="max-w-7xl mx-auto px-6">
			<!-- Organization Tabs - Show only if user has multiple organizations -->
			{#if userOrganizations?.data && userOrganizations.data.length > 1}
				<div class="py-12 flex flex-col items-center">
					<!-- Helper text -->
					<p class="text-sm text-gray-600 mb-4 text-center">
						You have CVs for multiple organizations. Select one to view and edit.
					</p>
					
					<!-- TabSwitcher-style organization tabs -->
					<div class="bg-white border border-gray-200 rounded-lg p-1 inline-flex shadow-sm">
						{#each userOrganizations.data as orgData}
							{@const isSelected = selectedOrgId === orgData.organizationId}
							<button
								type="button"
								onclick={() => selectedOrgId = orgData.organizationId}
								class="px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 {isSelected
									? 'bg-blue-600 text-white shadow-sm'
									: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
							>
								<span>{orgData.organization.name}</span>
								{#if orgData.latestCV}
									<span class="text-xs opacity-75">v{orgData.latestCV.version}</span>
								{/if}
								{#if isSelected}
									<span class="w-1.5 h-1.5 bg-white rounded-full"></span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}
			
			{#if !selectedOrgId}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
					<p class="text-yellow-800">
						{#if userOrganizations?.isLoading}
							Loading organizations...
						{:else if !userOrganizations?.data || userOrganizations.data.length === 0}
							No CVs found for this expert.
						{:else}
							Please select an organization above.
						{/if}
					</p>
				</div>
			{:else if localCVData && userId && expertCV?.data && !Array.isArray(expertCV.data) && expertCV.data.status}
				{@const cvStatus = expertCV.data.status as any}
				{@const isLocked = !canEditCVContent(cvStatus)}
				
				<div class="flex gap-6">
					<!-- LEFT SIDEBAR -->
					<div class="w-80 flex-shrink-0 space-y-4">
						<ExpertHeader userDetails={userData} {expertCV} />
						
					<CompletionChecklist 
						userIsActive={userData?.data?.isActive || false}
						experienceCount={expertCV.data.experience?.length || 0}
						educationCount={expertCV.data.education?.length || 0}
						serviceCount={assignedServices?.data?.length || 0}
						{totalAssessments}
						{totalAssessmentsLast12m}
						cvStatus={expertCV.data.status}
					/>
					
					<!-- Development Tools -->
					<DevelopmentToolBar 
						userId={userId as Id<'users'>}
						userIsActive={userData?.data?.isActive}
						cvStatus={expertCV.data.status}
						cvId={expertCV.data._id}
						onActionCompleted={() => {
							console.log('🔧 Development tool action completed - data will refresh automatically');
						}}
					/>
				</div>

					<!-- MAIN CONTENT AREA -->
					<div class="flex-1 space-y-6">
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<h1 class="text-2xl font-bold text-gray-900 mb-2">
								Complete Your Expert CV
								{#if selectedOrgName}
									<span class="text-gray-600 font-normal">for {selectedOrgName}</span>
								{/if}
							</h1>
							<p class="text-gray-600">Please fill in the following sections to complete your expert profile.</p>
						</div>
						
						{#if isLocked}
							<div class="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg">
								<div class="flex items-start">
									<svg class="w-6 h-6 text-amber-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
									</svg>
									<div class="flex-1">
										<h3 class="text-lg font-semibold text-amber-800">CV Locked</h3>
										<p class="text-sm text-amber-700 mt-1">
											Your CV is currently <span class="font-semibold">{getCVStatusDisplayName(cvStatus)}</span> and cannot be edited. 
											{#if selectedOrgName}
												Contact your administrator at {selectedOrgName} if changes are needed.
											{:else}
												Contact your administrator if changes are needed.
											{/if}
										</p>
									</div>
								</div>
							</div>
						{/if}
						
						<!-- Services Section -->
						{#if assignedServices?.data && assignedServices.data.length > 0}
							<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
								<div class="mb-6">
									<h3 class="text-lg font-semibold text-gray-800">Services</h3>
									<p class="text-sm text-gray-500">Services you are applying for</p>
								</div>
								<div class="flex flex-wrap gap-3">
									{#each assignedServices.data as assignment}
										{#if assignment.serviceVersion}
											<div class="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
												<span class="text-sm font-medium text-blue-700">{assignment.serviceVersion.name}</span>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/if}

						<!-- Experience Section -->
						<ExperienceView 
							expertId={userId}
							cvStatus={cvStatus}
							{localCVData}
							onAddExperience={addExperience}
							onRemoveExperience={removeExperience}
							onUpdateExperience={updateExperience}
							onSave={saveCVData}
							onImportFromPreviousCV={importExperience}
							hasPreviousCV={!!latestCVForImport?.data && (latestCVForImport.data.experience?.length || 0) > 0}
							previousCVOrgName={latestCVForImport?.data?.organization?.name}
						>
							{#snippet headerAction()}
								<TestDataGenerator tabName="Professional Experience" onFillData={fillTestData} />
							{/snippet}
						</ExperienceView>

						<!-- Education Section -->
						<EducationView 
							expertId={userId}
							cvStatus={cvStatus}
							{localCVData}
							onRemoveEducation={removeEducation}
							onSave={saveCVData}
							onImportFromPreviousCV={importEducation}
							hasPreviousCV={!!latestCVForImport?.data && (latestCVForImport.data.education?.length || 0) > 0}
							previousCVOrgName={latestCVForImport?.data?.organization?.name}
						>
							{#snippet headerAction()}
								<TestDataGenerator tabName="Education" onFillData={fillEducationTestData} />
							{/snippet}
						</EducationView>

						<!-- Training Section -->
						<TrainingQualificationView 
							expertId={userId}
							cvStatus={cvStatus}
							{localCVData}
							onRemoveTraining={removeTraining}
							onSave={saveCVData}
							onImportFromPreviousCV={importTraining}
							hasPreviousCV={!!latestCVForImport?.data && (latestCVForImport.data.trainingQualifications?.length || 0) > 0}
							previousCVOrgName={latestCVForImport?.data?.organization?.name}
						>
							{#snippet headerAction()}
								<TestDataGenerator tabName="Training Qualifications" onFillData={fillTrainingTestData} />
							{/snippet}
						</TrainingQualificationView>

						<!-- Other Approvals Section -->
						<ApprovalView 
							expertId={userId}
							cvStatus={cvStatus}
							{localCVData}
							onRemoveApproval={removeApproval}
							onSave={saveCVData}
							onImportFromPreviousCV={importApprovals}
							hasPreviousCV={!!latestCVForImport?.data && (latestCVForImport.data.otherApprovals?.length || 0) > 0}
							previousCVOrgName={latestCVForImport?.data?.organization?.name}
						>
							{#snippet headerAction()}
								<TestDataGenerator tabName="Other Approvals" onFillData={fillApprovalTestData} />
							{/snippet}
						</ApprovalView>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Save Button - Fixed at bottom -->
	{#if localCVData}
		<div class="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 shadow-lg z-50">
			<div class="max-w-7xl mx-auto px-6 py-4">
				<!-- Success/Error Messages -->
				{#if successMessage}
					<div class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
							<p class="text-green-700 font-medium">{successMessage}</p>
						</div>
					</div>
				{/if}
				
				{#if errorMessage}
					<div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
							</svg>
							<p class="text-red-700 font-medium">{errorMessage}</p>
						</div>
					</div>
				{/if}

				<!-- Import Messages -->
				{#if importMessage}
					<div class="mb-4 {importMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} rounded-lg p-4">
						<div class="flex items-center space-x-3">
							{#if importMessage.type === 'success'}
								<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
								</svg>
								<p class="text-green-700 font-medium">{importMessage.text}</p>
							{:else}
								<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
								</svg>
								<p class="text-red-700 font-medium">{importMessage.text}</p>
							{/if}
						</div>
					</div>
				{/if}
				
				<div class="flex items-center justify-end gap-3">
					<button 
						type="button"
						onclick={saveCVData} 
						disabled={isSaving}
						class="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
					>
						{#if isSaving}
							<svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
							</svg>
							Saving...
						{:else}
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
							Save Changes
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

