<script lang="ts">
	interface EducationEntry {
		school: string;
		degree: string;
		field: string;
		startDate: string;
		endDate: string;
		description?: string;
	}

	interface Props {
		education: EducationEntry;
		showEditButton?: boolean;
		onEdit?: () => void;
		onRemove?: () => void;
		readOnly?: boolean;
	}

	let { education, showEditButton = false, onEdit, onRemove, readOnly = false }: Props = $props();
</script>

<div class="border-l-4 border-green-500 pl-4 py-4 bg-white rounded-r-lg border border-gray-200 hover:shadow-sm transition-shadow">
	<div class="flex justify-between items-start">
		<div class="flex-1">
			<h3 class="font-semibold text-gray-900">
				{education.degree}
				{#if education.field}
					<span class="text-gray-600 font-normal"> in {education.field}</span>
				{/if}
			</h3>
			<p class="text-gray-600">{education.school}</p>
			<p class="text-sm text-gray-500 mt-1">
				{education.startDate} - {education.endDate}
			</p>
		</div>
		{#if (showEditButton && !readOnly) || onRemove}
			<div class="flex items-center gap-2 ml-4 flex-shrink-0">
				{#if showEditButton && !readOnly && onEdit}
					<button
						onclick={onEdit}
						class="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
						title="Edit education"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
						</svg>
					</button>
				{/if}
				{#if onRemove && !readOnly}
					<button
						onclick={onRemove}
						class="inline-flex items-center px-2 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
						title="Delete education"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				{/if}
			</div>
		{/if}
	</div>
	{#if education.description}
		<p class="text-gray-700 mt-3">{education.description}</p>
	{/if}
</div>
