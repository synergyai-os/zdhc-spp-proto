/// file: src/lib/components/experts/ExpertSection.svelte
<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { expertStore, expertsGroupedByUser, expertsTableData } from '$lib/stores/experts.svelte';
	import ExpertCardView from './ExpertCardView.svelte';
	import ExpertTableView from './ExpertTableView.svelte';
	
	interface Props {
		organizationId: string | null;
		onAddExpert?: () => void;
		onContinueToPayment?: () => void;
	}
	
	let { organizationId, onAddExpert, onContinueToPayment }: Props = $props();
	
	// View state
	let viewMode = $state<'cards' | 'table'>('cards');
	
	// Get expert assignments data
	const expertAssignments = useQuery(
		api.expertAssignments.getExpertAssignmentsByOrganizationWithDetails, 
		() => ({ organizationId: (organizationId || "j1j1j1j1j1j1j1j1j1j1j1j1") as any })
	);
	
	// Get service versions and parents for display
	const serviceVersions = useQuery((api as any).serviceVersions.getServiceVersions, {});
	const serviceParents = useQuery((api as any).serviceVersions.getServiceParents, {});
	
	// Update expert store when data changes
	$effect(() => {
		if (expertAssignments?.data) {
			expertStore.setExpertAssignments(expertAssignments.data);
		}
		if (serviceVersions?.data) {
			expertStore.setServiceVersions(serviceVersions.data);
		}
		if (serviceParents?.data) {
			expertStore.setServiceParents(serviceParents.data);
		}
		
		// Set loading state
		expertStore.setLoading(
			expertAssignments?.isLoading || 
			serviceVersions?.isLoading || 
			serviceParents?.isLoading || 
			false
		);
		
		// Set error state
		const error = expertAssignments?.error || serviceVersions?.error || serviceParents?.error;
		expertStore.setError(error);
	});
	
	// Derived data
	let expertsForCards = $derived($expertsGroupedByUser);
	let expertsForTable = $derived($expertsTableData);
	let isLoading = $derived(expertAssignments?.isLoading || serviceVersions?.isLoading || serviceParents?.isLoading || false);
	let error = $derived(expertAssignments?.error || serviceVersions?.error || serviceParents?.error || null);
	
	// Event handlers
	function handleEditExpert(expertId: string) {
		console.log('Edit expert:', expertId);
		// TODO: Implement edit functionality
	}
	
	function handleAddExpert() {
		onAddExpert?.();
	}
	
	function handleContinueToPayment() {
		onContinueToPayment?.();
	}
	
	function toggleViewMode() {
		viewMode = viewMode === 'cards' ? 'table' : 'cards';
	}
</script>

<div class="space-y-6">
	<!-- Header with Actions -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-xl font-bold text-gray-800">Saved Experts</h2>
			<p class="text-gray-600">
				{#if organizationId}
					Experts for your organization
				{:else}
					Select an organization to view experts
				{/if}
			</p>
		</div>
		
		<div class="flex items-center space-x-3">
			<!-- View Toggle -->
			<div class="bg-white border border-gray-200 rounded-lg p-1 inline-flex">
				<button
					type="button"
					onclick={() => viewMode = 'cards'}
					class="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 {
						viewMode === 'cards' 
							? 'bg-blue-500 text-white shadow-sm' 
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
					}"
					title="Card View"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
					</svg>
				</button>
				<button
					type="button"
					onclick={() => viewMode = 'table'}
					class="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 {
						viewMode === 'table' 
							? 'bg-blue-500 text-white shadow-sm' 
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
					}"
					title="Table View"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
					</svg>
				</button>
			</div>
			
			<!-- Action Buttons -->
			{#if organizationId && expertsForCards.length > 0}
				<button 
					onclick={handleContinueToPayment}
					class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
				>
					Continue to Payment
				</button>
			{/if}
			<button 
				onclick={handleAddExpert}
				class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
			>
				Add Expert
			</button>
		</div>
	</div>
	
	<!-- Expert Count Info -->
	{#if organizationId && !isLoading && !error}
		<div class="text-sm text-gray-500">
			{#if viewMode === 'cards'}
				Total: {expertsForCards.length} expert{expertsForCards.length !== 1 ? 's' : ''}
			{:else}
				Total: {expertsForTable.length} expert{expertsForTable.length !== 1 ? 's' : ''}
			{/if}
		</div>
	{/if}
	
	<!-- Expert Views -->
	{#if !organizationId}
		<div class="text-center py-8 text-gray-500">
			<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
			</svg>
			<p class="text-lg font-medium mb-2">No Organization Selected</p>
			<p class="text-sm">Use the organization switcher in the header to select an organization</p>
		</div>
	{:else if viewMode === 'cards'}
		<ExpertCardView 
			experts={expertsForCards}
			isLoading={isLoading}
			error={error}
			onEditExpert={handleEditExpert}
		/>
	{:else}
		<ExpertTableView 
			experts={expertsForTable}
			isLoading={isLoading}
			error={error}
			onEditExpert={handleEditExpert}
		/>
	{/if}
</div>
