<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';

	interface Requirement {
		_id: Id<'serviceVersionRequirements'>;
		title: string;
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
</script>

<div class="mt-3 pt-3 border-t border-gray-200">
	<div class="flex items-center justify-between mb-2">
		<h5 class="text-sm font-medium text-gray-700">Requirements</h5>
		{#if totalCount > 0}
			<span class="text-xs text-gray-500">{checkedCount}/{totalCount} checked</span>
		{/if}
	</div>

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
					<label
						for="req-{requirement._id}"
						class="text-sm text-gray-700 cursor-pointer flex-1 {!isEditable ? 'opacity-50' : ''}"
					>
						{requirement.title}
					</label>
				</li>
			{/each}
		</ul>
	{/if}
</div>

