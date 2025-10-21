<script lang="ts">
	import { canEditCVContent, type CVStatus } from '../../../convex/model/status';

	interface Props {
		isSaving: boolean;
		cvStatus: CVStatus;
		onSave: () => void;
	}

	let { isSaving, cvStatus, onSave }: Props = $props();
	
	// Check if editing is allowed based on CV status
	let canEdit = $derived(canEditCVContent(cvStatus));
</script>

<!-- Save Button -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	<div class="flex items-center justify-center">
		{#if !canEdit}
			<div class="text-center">
				<div class="flex items-center justify-center space-x-2 mb-2">
					<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
					</svg>
					<span class="text-yellow-800 font-medium">CV editing is locked</span>
				</div>
				<p class="text-sm text-gray-600">CV status prevents editing at this time</p>
			</div>
		{:else}
			<button
				type="button"
				onclick={onSave}
				disabled={isSaving}
				class="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg font-medium"
			>
				{#if isSaving}
					Saving CV...
				{:else}
					Save CV
				{/if}
			</button>
		{/if}
	</div>
</div>