<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api, type Id } from '$lib';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import ExperienceView from '$lib/components/expert-edit/ExperienceView.svelte';
	import EducationView from '$lib/components/expert-edit/EducationView.svelte';
	import TrainingQualificationView from '$lib/components/expert-edit/TrainingQualificationView.svelte';
	import ApprovalView from '$lib/components/expert-edit/ApprovalView.svelte';
	import { createExperienceEntry, createEducationEntry, createTrainingEntry } from '$lib/utils/cvDataHandlers';
import { canEditCVContent, getCVStatusDisplayName, getCVStatusColor } from '../../../../convex/model/status';

	const userId = $derived($page.params.cvId);
	const orgId = DEFAULT_ORG_ID;
	const client = useConvexClient();
	let isAuthenticated = $state(false);
	let password = $state('password');

	const userData = useQuery(api.utilities.getUserById, () => ({
		id: userId as Id<'users'>
	}));

	const expertCV = useQuery(api.expert.getLatestCV, () => ({
		userId: userId as Id<'users'>,
		organizationId: orgId as Id<'organizations'>
	}));

	const organization = useQuery(api.utilities.getOrganizations, () => ({}));
	const orgName = $derived.by(() => {
		if (!organization?.data) return '';
		const org = organization.data.find(o => o._id === orgId);
		return org?.name || '';
	});

	const assignedServices = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => {
		if (!expertCV?.data || Array.isArray(expertCV.data) || !expertCV.data._id) {
			return { expertCVId: 'dummy' as Id<'expertCVs'> };
		}
		return { expertCVId: expertCV.data._id };
	});

	const email = $derived(userData?.data?.email || '');
	let localCVData = $state<any>(null);

	$effect(() => {
		if (expertCV?.data) {
			localCVData = { ...expertCV.data };
		}
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

	async function saveCVData() {
		if (!localCVData) return;
		await client.mutation(api.expert.updateCV, {
			cvId: localCVData._id,
			organizationId: orgId as Id<'organizations'>,
			experience: localCVData.experience,
			education: localCVData.education,
			trainingQualifications: localCVData.trainingQualifications,
			otherApprovals: localCVData.otherApprovals
		});
	}
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
		<div class="max-w-4xl mx-auto px-6 py-8">
			<div class="space-y-8">
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h1 class="text-2xl font-bold text-gray-900 mb-2">Complete Your Expert CV</h1>
					<p class="text-gray-600">Please fill in the following sections to complete your expert profile.</p>
				</div>

				{#if localCVData && userId && expertCV?.data && !Array.isArray(expertCV.data) && expertCV.data.status}
					{@const cvStatus = expertCV.data.status as any}
					{@const isLocked = !canEditCVContent(cvStatus)}
					
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
										{#if orgName}
											Contact your administrator at {orgName} if changes are needed.
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
					/>

					<!-- Education Section -->
					<EducationView 
						expertId={userId}
						cvStatus={cvStatus}
						{localCVData}
						onRemoveEducation={removeEducation}
						onSave={saveCVData}
					/>

					<!-- Training Section -->
					<TrainingQualificationView 
						expertId={userId}
						cvStatus={cvStatus}
						{localCVData}
						onRemoveTraining={removeTraining}
						onSave={saveCVData}
					/>

					<!-- Other Approvals Section -->
					<ApprovalView 
						expertId={userId}
						cvStatus={cvStatus}
						{localCVData}
						onRemoveApproval={removeApproval}
						onSave={saveCVData}
					/>
				{/if}
			</div>
		</div>
	</div>

	<!-- Save Button - Fixed at bottom -->
	{#if localCVData}
		<div class="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 shadow-lg z-50">
			<div class="max-w-4xl mx-auto px-6 py-4">
				<div class="flex items-center justify-end gap-3">
					<button 
						type="button"
						onclick={saveCVData} 
						class="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
						</svg>
						Save Changes
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

