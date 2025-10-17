<script lang="ts">
	interface Props {
		isSaving: boolean;
		onSave: () => void;
	}

	let { isSaving, onSave }: Props = $props();
</script>

<!-- Save Button -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	<div class="flex items-center justify-center">
		<button
			type="button"
			onclick={onSave}
			disabled={isSaving}
			class="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg font-medium"
		>
			{#if isSaving}
				Saving Profile...
			{:else}
				Save Complete Profile
			{/if}
		</button>
	</div>
</div>