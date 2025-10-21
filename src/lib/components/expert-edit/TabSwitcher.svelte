<script lang="ts">
	interface Props {
		activeTab: 'services' | 'cv-details';
		onTabChange: (tab: 'services' | 'cv-details') => void;
	}

	let { activeTab, onTabChange }: Props = $props();
</script>

<!-- Toggle Switcher -->
<div class="mt-6 mb-6">
	<div class="bg-white border border-gray-200 rounded-lg p-1 inline-flex">
		<button 
			onclick={() => onTabChange('services')}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'}"
		>
			Services
		</button>
		<button 
			onclick={() => onTabChange('cv-details')}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'cv-details' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'}"
		>
			CV Details
		</button>
	</div>
</div>
