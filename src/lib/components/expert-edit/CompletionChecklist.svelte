<script lang="ts">
	interface CriteriaItem {
		id: string;
		label: string;
		isComplete: boolean;
		value?: string | number; // Optional value to display
	}

	interface Props {
		userIsActive: boolean;
		experienceCount: number;
		educationCount: number;
		serviceCount: number;
		totalAssessments?: number; // Optional: total assessments
		totalAssessmentsLast12m?: number; // Optional: assessments in last 12 months
		cvStatus?: string;
	}

	let { 
		userIsActive, 
		experienceCount, 
		educationCount, 
		serviceCount, 
		totalAssessments,
		totalAssessmentsLast12m,
		cvStatus
	}: Props = $props();

	// Calculate completion criteria
	const criteria = $derived.by((): CriteriaItem[] => {
		return [
			{
				id: 'account',
				label: 'Expert account is active',
				isComplete: userIsActive,
				value: userIsActive ? 'Active' : 'Inactive'
			},
			{
				id: 'experience',
				label: '1 or more Work Experiences',
				isComplete: experienceCount >= 1,
				value: experienceCount
			},
			{
				id: 'education',
				label: '1 or more Educations',
				isComplete: educationCount >= 1,
				value: educationCount
			},
			{
				id: 'services',
				label: '1 or more Services selected',
				isComplete: serviceCount >= 1,
				value: serviceCount
			}
		];
	});

	const allComplete = $derived(criteria.every(item => item.isComplete));
	const completionPercentage = $derived(Math.round((criteria.filter(c => c.isComplete).length / criteria.length) * 100));
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	<div class="mb-4">
		<h3 class="text-lg font-semibold text-gray-900 flex items-center">
			<svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			Completion Checklist
		</h3>
		<div class="mt-1 flex items-center justify-between">
			<p class="text-sm text-gray-600">
				{cvStatus === 'draft' ? 'To complete your CV' : 'CV Requirements'}
			</p>
			<span class="text-lg font-bold {allComplete ? 'text-green-600' : 'text-gray-500'}">
				{completionPercentage}%
			</span>
		</div>
	</div>

	<div class="space-y-3">
		{#each criteria as item}
			<div class="flex items-start space-x-3">
				<div class="flex-shrink-0 pt-0.5">
					{#if item.isComplete}
						<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
						</svg>
					{:else}
						<svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
						</svg>
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<span class="text-sm {item.isComplete ? 'text-gray-900 font-medium' : 'text-gray-600'}">
						{item.label}
					</span>
					{#if item.value !== undefined}
						<span class="ml-2 text-sm font-semibold {item.isComplete ? 'text-green-600' : 'text-gray-400'}">
							({item.value})
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Informational Messages -->
	<div class="mt-6 pt-6 border-t border-gray-200 space-y-3">
		{#if totalAssessments !== undefined}
			<div class="flex items-start space-x-3">
				<svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<div>
					<p class="text-sm text-gray-900">
						<strong>Assessments:</strong> {totalAssessments} total
						{#if totalAssessmentsLast12m !== undefined}
							, {totalAssessmentsLast12m} in last 12 months
						{/if}
					</p>
					<p class="text-sm text-gray-600 mt-0.5">
						ZDHC will review your assessment history. Regular roles require 10+ assessments in the last 12 months. Lead roles require 30+ total assessments.
					</p>
				</div>
			</div>
		{/if}

		<div class="flex items-start space-x-3">
			<svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			<div>
				<p class="text-sm text-gray-900">
					<strong>Training Qualifications:</strong>
				</p>
				<p class="text-sm text-gray-600 mt-0.5">
					Lead experts: ISO 19011 training qualification is required and will be verified during review.
				</p>
			</div>
		</div>
	</div>
</div>

