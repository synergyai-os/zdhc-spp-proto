<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';

	interface Requirement {
		_id: Id<'serviceVersionRequirements'>;
		title: string;
		description?: string;
		isChecked: boolean;
		checkedAt?: number;
		checkedBy?: string;
	}

	interface Props {
		assignmentId: Id<'expertServiceAssignments'>;
		requirements: Requirement[];
		isEditable: boolean;
		checkedBy?: string; // Admin ID
	}

	let { assignmentId, requirements, isEditable, checkedBy = 'admin-user' }: Props = $props();

	const client = useConvexClient();

	let isProcessing = $state(false);
	let errorMessage = $state('');
	let isExpanded = $state(false);

	const handleToggleCheck = async (requirementId: Id<'serviceVersionRequirements'>, currentChecked: boolean) => {
		if (!isEditable || isProcessing) return;

		isProcessing = true;
		errorMessage = '';

		try {
			await client.mutation((api as any).serviceVersionRequirements.checkOffRequirement, {
				assignmentId,
				requirementId,
				isChecked: !currentChecked,
				checkedBy
			});
		} catch (error) {
			errorMessage = `Failed to update requirement: ${error}`;
			console.error('Error checking off requirement:', error);
		} finally {
			isProcessing = false;
		}
	};

	// Compute checked count
	const checkedCount = $derived(
		requirements.filter((r) => r.isChecked).length
	);
	const totalCount = $derived(requirements.length);

	const toggleAccordion = () => {
		isExpanded = !isExpanded;
	};
</script>

<div class="mt-3 pt-3 border-t border-gray-200">
	<button
		type="button"
		onclick={toggleAccordion}
		class="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-1 px-1 py-2 rounded transition-colors"
	>
		<h5 class="text-sm font-medium text-gray-700">
			Requirements
			{#if totalCount > 0}
				<span class="text-gray-500 font-normal">({checkedCount}/{totalCount} completed)</span>
			{/if}
		</h5>
		<svg
			class="w-5 h-5 text-gray-500 transition-transform {isExpanded ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isExpanded}
		<div class="mt-2">
			{#if errorMessage}
				<div class="mb-2 text-xs text-red-600">{errorMessage}</div>
			{/if}

			{#if requirements.length === 0}
				<p class="text-xs text-gray-500 italic">No requirements defined for this service version</p>
			{:else}
				<ul class="space-y-2">
					{#each requirements as requirement (requirement._id)}
						<li class="flex items-center space-x-2">
							<input
								type="checkbox"
								id="req-{requirement._id}"
								checked={requirement.isChecked}
								onchange={() => handleToggleCheck(requirement._id, requirement.isChecked)}
								disabled={!isEditable || isProcessing}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							<div class="flex items-center gap-1">
								<label
									for="req-{requirement._id}"
									class="text-sm text-gray-700 cursor-pointer {!isEditable ? 'opacity-50' : ''}"
								>
									{requirement.title}
								</label>
								{#if requirement.description}
									<div class="relative group inline-block align-middle">
										<!-- info icon -->
										<svg class="w-4 h-4 text-gray-400 hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.5a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5zM10 6.25a.875.875 0 100 1.75.875.875 0 000-1.75z" clip-rule="evenodd"/>
										</svg>
										<!-- tooltip -->
										<div class="pointer-events-none absolute left-0 z-10 hidden translate-y-2 group-hover:block">
											<div class="w-[28rem] sm:w-[32rem] md:w-[36rem] max-w-[90vw] bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg break-words whitespace-pre-line">
												{requirement.description}
											</div>
										</div>
									</div>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

