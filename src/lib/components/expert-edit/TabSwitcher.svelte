<script lang="ts">
	interface Props {
		tabs: string[];
		activeTab: string;
		onTabChange: (tab: string) => void;
	}

	let { tabs, activeTab, onTabChange }: Props = $props();

	// Get icon and label for each tab
	function getTabInfo(tab: string) {
		const info: Record<string, { icon: string; label: string }> = {
			services: { icon: '🔧', label: 'Services' },
			experience: { icon: '💼', label: 'Experience' },
			education: { icon: '🎓', label: 'Education' },
			training: { icon: '📚', label: 'Training' },
			approvals: { icon: '📋', label: 'Other Approvals' }
		};
		return info[tab] || { icon: '📄', label: tab };
	}
</script>

<!-- Enhanced Tab Switcher -->
<div class="mb-6">
	<div class="bg-white border border-gray-200 rounded-lg p-1 inline-flex shadow-sm">
		{#each tabs as tab}
			{@const tabInfo = getTabInfo(tab)}
			<button 
				onclick={() => onTabChange(tab)}
				class="px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 {activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
			>
				<span class="text-base">{tabInfo.icon}</span>
				<span class="capitalize">{tabInfo.label}</span>
				{#if activeTab === tab}
					<span class="w-1.5 h-1.5 bg-white rounded-full"></span>
				{/if}
			</button>
		{/each}
	</div>
</div>
