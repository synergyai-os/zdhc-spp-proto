<script lang="ts">
	interface Props {
		tabs: string[];
		activeTab: string;
		onTabChange: (tab: string) => void;
	}

	let { tabs, activeTab, onTabChange }: Props = $props();
</script>

<!-- Toggle Switcher -->
<div class="mt-6 mb-6">
	<div class="bg-white border border-gray-200 rounded-lg p-1 inline-flex">
		{#each tabs as tab}
			<button 
				onclick={() => onTabChange(tab)}
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'}"
			>
				{tab}
			</button>
		{/each}
	</div>
</div>
