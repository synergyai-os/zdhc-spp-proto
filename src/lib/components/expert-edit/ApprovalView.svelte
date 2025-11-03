<script lang="ts">
	import { goto } from '$app/navigation';
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';
	import ApprovalCard from '$lib/components/shared/ApprovalCard.svelte';

	interface OtherApprovalEntry {
		organisationName: string;
		role: string;
		dateIssued: string;
	}

	interface Props {
		expertId: string;
		cvStatus: CVStatus;
		localCVData: { otherApprovals?: OtherApprovalEntry[] } | null;
		onRemoveApproval: (index: number) => void;
		onSave?: () => Promise<void>;
	}

	let { 
		expertId,
		cvStatus,
		localCVData,
		onRemoveApproval,
		onSave
	}: Props = $props();

	// Component handles its own read-only state based on CV status
	let readOnly = $derived(!canEditCVContent(cvStatus));

	// Navigate to new approval page
	async function addNewApproval() {
		// Save any pending changes (e.g., deleted approvals) before navigating
		if (onSave) {
			try {
				await onSave();
			} catch (error) {
				console.error('Failed to save before navigation:', error);
				alert('Failed to save changes. Please try again.');
				return; // Don't navigate if save failed
			}
		}
		goto(`/experts/${expertId}/cv/new-approval`);
	}

	// Navigate to edit approval page
	async function editApproval(index: number) {
		// Save any pending changes before navigating
		if (onSave) {
			try {
				await onSave();
			} catch (error) {
				console.error('Failed to save before navigation:', error);
				alert('Failed to save changes. Please try again.');
				return; // Don't navigate if save failed
			}
		}
		goto(`/experts/${expertId}/cv/new-approval?index=${index}`);
	}
</script>

<!-- Other Approvals Section -->
<div>
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-800">Other Approvals</h3>
			<p class="text-sm text-gray-500">
				{readOnly ? 'View other approvals for this expert' : 'Record approvals from other likeminded organizations (optional)'}
			</p>
		</div>
		{#if !readOnly}
			<button
				type="button"
				onclick={addNewApproval}
				class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Add Approval
			</button>
		{/if}
	</div>

	<div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
		<p class="text-sm text-gray-700">
			<strong>Note:</strong> This section is optional. If you have been approved by another likeminded organization (like Cascale), you can record that information here. This may help speed up your approval process.
		</p>
	</div>

	{#if !localCVData?.otherApprovals || localCVData.otherApprovals.length === 0}
		<div class="text-center py-8">
			<svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No other approvals added yet</h3>
			<p class="text-gray-500 mb-4">
				{readOnly ? 'No other approvals have been recorded for this expert' : 'Add approvals from other organizations to help speed up your approval process'}
			</p>
			{#if !readOnly}
				<button
					type="button"
					onclick={addNewApproval}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Add First Approval
				</button>
			{/if}
		</div>
	{:else}
		<div class="space-y-4">
			{#each localCVData.otherApprovals as entry, index}
				<ApprovalCard
					approval={entry}
					showEditButton={!readOnly}
					onEdit={() => editApproval(index)}
					onRemove={() => onRemoveApproval(index)}
					{readOnly}
				/>
			{/each}
		</div>
	{/if}
</div>
