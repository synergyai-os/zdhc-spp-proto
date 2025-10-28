<script lang="ts">
	interface Props {
		tabName: string;
		onFillData: () => void;
	}
	
	let { tabName, onFillData }: Props = $props();
	
	// Only show in development mode
	let showButton = $derived(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
</script>

{#if showButton}
	<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
		<div class="flex items-center justify-between">
			<p class="text-sm text-yellow-800">
				Development Mode: Generate test data for {tabName}
			</p>
			<button
				type="button"
				onclick={onFillData}
				class="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-sm font-medium rounded-md text-yellow-900 bg-white hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				Fill {tabName}
			</button>
		</div>
	</div>
{/if}

