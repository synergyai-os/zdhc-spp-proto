<script lang="ts">
	import TabSwitcher from '$lib/components/expert-edit/TabSwitcher.svelte';
	import ExpertTableView from '$lib/components/ExpertTableView.svelte';
	import ServicesView from '$lib/components/ServicesView.svelte';

	let activeTab = $state('experts');

	const handleTabChange = (tab: string) => {
		activeTab = tab;
	};
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-900 mb-8">User Management</h1>
		
	<!-- Action Buttons -->
	<div class="mt-8 flex space-x-4">
		<a href="/user-management/add-expert" 
		   class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
			Add Expert
		</a>
		<a href="/checkout" 
		   class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
			Go to Checkout
		</a>
	</div>

	<!-- Tab Switcher -->
	<div class="mt-8">
		<TabSwitcher 
			tabs={['staff', 'experts', 'services']} 
			{activeTab} 
			onTabChange={handleTabChange} 
		/>
	</div>

	<!-- Content Area -->
	<div class="mt-8">
		{#if activeTab === 'staff'}
			<div class="text-center py-12">
				<p class="text-gray-500 text-lg">Staff</p>
			</div>
		{:else if activeTab === 'experts'}
			<ExpertTableView />
		{:else if activeTab === 'services'}
			<ServicesView />
		{/if}
	</div>

</div>
