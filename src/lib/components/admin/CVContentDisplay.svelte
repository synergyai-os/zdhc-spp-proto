<script lang="ts">
	import ExperienceCard from '$lib/components/shared/ExperienceCard.svelte';
	import EducationCard from '$lib/components/shared/EducationCard.svelte';
	import TrainingCard from '$lib/components/shared/TrainingCard.svelte';
	import ApprovalCard from '$lib/components/shared/ApprovalCard.svelte';
	import type { ExperienceEntry, EducationEntry, TrainingQualificationEntry, OtherApprovalEntry } from '../../../convex/model/types';

	interface Props {
		experience?: ExperienceEntry[];
		education?: EducationEntry[];
		trainingQualifications?: TrainingQualificationEntry[];
		otherApprovals?: OtherApprovalEntry[];
	}

	let { experience = [], education = [], trainingQualifications = [], otherApprovals = [] }: Props = $props();
</script>

{#if experience && experience.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">Professional Experience</h2>
		<div class="space-y-4">
			{#each experience as exp}
				<ExperienceCard experience={exp} readOnly={true} />
			{/each}
		</div>
	</div>
{/if}

{#if education && education.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">Education</h2>
		<div class="space-y-4">
			{#each education as edu}
				<EducationCard education={edu} readOnly={true} />
			{/each}
		</div>
	</div>
{/if}

{#if trainingQualifications && trainingQualifications.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">Training & Qualifications</h2>
		<div class="space-y-4">
			{#each trainingQualifications as qual}
				<TrainingCard training={qual} readOnly={true} />
			{/each}
		</div>
	</div>
{/if}

{#if otherApprovals && otherApprovals.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">Other Approvals</h2>
		<div class="space-y-4">
			{#each otherApprovals as approval}
				<ApprovalCard approval={approval} readOnly={true} />
			{/each}
		</div>
	</div>
{/if}

