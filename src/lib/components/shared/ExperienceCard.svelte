<script lang="ts">
	interface FieldExperienceTypes {
		assessment: boolean;
		sampling: boolean;
		training: boolean;
	}

	interface FieldExperienceCounts {
		assessment: { total: number; last12m: number };
		sampling: { total: number; last12m: number };
		training: { total: number; last12m: number };
	}

	interface ExperienceEntry {
		title: string;
		company: string;
		location: string;
		startDate: string;
		endDate: string;
		current: boolean;
		description?: string;
		fieldExperienceTypes?: FieldExperienceTypes;
		fieldExperienceCounts?: FieldExperienceCounts;
		lockedForReviewAt?: number;
	}

	interface Props {
		experience: ExperienceEntry;
		showEditButton?: boolean;
		onEdit?: () => void;
		onRemove?: () => void;
		readOnly?: boolean;
	}

	let { experience, showEditButton = false, onEdit, onRemove, readOnly = false }: Props = $props();
	
	const isLocked = $derived(experience.lockedForReviewAt !== undefined);
</script>

<div class="border-l-4 {isLocked ? 'border-orange-500 bg-orange-50' : 'border-blue-500'} pl-4 py-4 bg-white rounded-r-lg border border-gray-200 hover:shadow-sm transition-shadow">
	<div class="flex justify-between items-start">
		<div class="flex-1">
			<h3 class="font-semibold text-gray-900 inline-flex items-center gap-2">
				{experience.title}
				{#if experience.current}
					<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
						Current
					</span>
				{/if}
				{#if isLocked}
					<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800" title="Locked for review - cannot be edited">
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
						Locked
					</span>
				{/if}
			</h3>
			<p class="text-gray-600">{experience.company} • {experience.location}</p>
			<p class="text-sm text-gray-500 mt-1">
				{experience.startDate} - {experience.current ? 'Present' : experience.endDate}
			</p>
			{#if experience.fieldExperienceTypes && experience.fieldExperienceCounts}
				<div class="mt-2 space-y-1">
					{#if experience.fieldExperienceTypes.assessment && experience.fieldExperienceCounts.assessment}
						<p class="text-xs text-gray-600">
							Assessments: <span class="font-semibold">{experience.fieldExperienceCounts.assessment.total}</span> total, 
							<span class="font-semibold text-blue-600">{experience.fieldExperienceCounts.assessment.last12m}</span> last 12m
						</p>
					{/if}
					{#if experience.fieldExperienceTypes.sampling && experience.fieldExperienceCounts.sampling}
						<p class="text-xs text-gray-600">
							Samplings: <span class="font-semibold">{experience.fieldExperienceCounts.sampling.total}</span> total, 
							<span class="font-semibold text-blue-600">{experience.fieldExperienceCounts.sampling.last12m}</span> last 12m
						</p>
					{/if}
					{#if experience.fieldExperienceTypes.training && experience.fieldExperienceCounts.training}
						<p class="text-xs text-gray-600">
							Trainings: <span class="font-semibold">{experience.fieldExperienceCounts.training.total}</span> total, 
							<span class="font-semibold text-blue-600">{experience.fieldExperienceCounts.training.last12m}</span> last 12m
						</p>
					{/if}
				</div>
			{/if}
		</div>
		{#if (showEditButton && !readOnly && !isLocked) || (onRemove && !isLocked)}
			<div class="flex items-center gap-2 ml-4 flex-shrink-0">
				{#if showEditButton && !readOnly && !isLocked && onEdit}
					<button
						onclick={onEdit}
						class="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
						title="Edit experience"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
						</svg>
					</button>
				{/if}
				{#if onRemove && !readOnly && !isLocked}
					<button
						onclick={onRemove}
						class="inline-flex items-center px-2 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
						title="Delete experience"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				{/if}
			</div>
		{/if}
	</div>
	{#if experience.description}
		<p class="text-gray-700 mt-3">{experience.description}</p>
	{/if}
</div>

