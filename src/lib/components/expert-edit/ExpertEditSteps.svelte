<script lang="ts">
	import Step2Confirmation from '$lib/components/expert-wizard/Step2Confirmation.svelte';
	import Step3Services from '$lib/components/expert-wizard/Step3Services.svelte';
	import Step4Experience from '$lib/components/expert-wizard/Step4Experience.svelte';
	import Step5Education from '$lib/components/expert-wizard/Step5Education.svelte';

	interface Props {
		userDataResult: any;
		availableServices: any[];
		selectedServices: any[];
		serviceRoles: any;
		experience: any[];
		education: any[];
		expertEditState: any;
		serviceVersions: any;
		organizationApprovals: any;
		handleToggleRole: (serviceName: string) => void;
		handleUpdateExperience: (experience: any[]) => void;
		handleUpdateEducation: (education: any[]) => void;
	}

	let { 
		userDataResult, 
		availableServices, 
		selectedServices = $bindable(),
		serviceRoles = $bindable(),
		experience,
		education,
		expertEditState, 
		serviceVersions,
		organizationApprovals,
		handleToggleRole, 
		handleUpdateExperience, 
		handleUpdateEducation 
	}: Props = $props();
</script>


<!-- STEP 2: Expert Confirmation -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
	<div class="mb-4">
		<h2 class="text-xl font-bold text-gray-800 mb-2">Step 2: Expert Confirmation</h2>
		<p class="text-gray-600">Verify expert information and invitation status</p>
	</div>
	<Step2Confirmation
		userData={userDataResult}
		isDraftMode={!userDataResult?.isActive}
		invitedUserEmail={userDataResult?.email}
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
		bind:selectedServices={selectedServices}
		bind:serviceRoles={serviceRoles}
		currentOrgId={expertEditState.validOrgId}
		isLoadingServices={serviceVersions?.isLoading || organizationApprovals?.isLoading}
		isDraftMode={!userDataResult?.isActive}
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
		experience={experience}
		on:updateExperience={(e) => handleUpdateExperience(e.detail)}
	/>
</div>

<!-- STEP 5: Education -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
	<div class="mb-4">
		<h2 class="text-xl font-bold text-gray-800 mb-2">Step 5: Education & Certifications</h2>
		<p class="text-gray-600">Add educational background and relevant certifications</p>
	</div>
	<Step5Education education={education} on:updateEducation={(e) => handleUpdateEducation(e.detail)} />
</div>