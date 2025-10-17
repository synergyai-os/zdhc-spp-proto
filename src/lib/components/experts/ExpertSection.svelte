<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import {
		expertStore,
		expertsTableData,
		pendingVerificationData
	} from '$lib/stores/experts.svelte';
	import ExpertTableView from './ExpertTableView.svelte';
	import PendingVerificationSection from './PendingVerificationSection.svelte';

	interface Props {
		organizationId: string | null;
		onAddExpert?: () => void;
		onContinueToPayment?: () => void;
		onChatExpert?: (expertId: string) => void;
		onSendReminder?: (expertId: string) => void;
		onViewDetails?: (expertId: string) => void;
		onEditExpert?: (expertId: string) => void;
		onCompleteProfile?: (expertId: string) => void;
	}

	let {
		organizationId,
		onAddExpert,
		onContinueToPayment,
		onChatExpert,
		onSendReminder,
		onViewDetails,
		onEditExpert,
		onCompleteProfile
	}: Props = $props();

	// View state - always table view
	let viewMode = $state<'table'>('table');

	// Get expert CVs data (new schema)
	const expertCVs = useQuery(
		api.expertCVs.getExpertCVs,
		() => ({ organizationId: organizationId as any })
	);

	// Get expert service assignments data
	const expertServiceAssignments = useQuery(
		api.expertServiceAssignments.getExpertServiceAssignmentsByOrg,
		() => organizationId ? { organizationId: organizationId as any } : { organizationId: 'j1j1j1j1j1j1j1j1j1j1j1j1' as any }
	);

	// Get service versions and parents for display
	const serviceVersions = useQuery((api as any).serviceVersions.getServiceVersions, {});
	const serviceParents = useQuery((api as any).serviceVersions.getServiceParents, {});

	// Update expert store when data changes (updated for new schema)
	$effect(() => {
		if (expertCVs?.data) {
			expertStore.setExpertCVs(expertCVs.data as any);
		}
		if (expertServiceAssignments?.data) {
			expertStore.setExpertServiceAssignments(expertServiceAssignments.data as any);
		}
		if (serviceVersions?.data) {
			expertStore.setServiceVersions(serviceVersions.data);
		}
		if (serviceParents?.data) {
			expertStore.setServiceParents(serviceParents.data);
		}

		// Set loading state
		expertStore.setLoading(
			expertCVs?.isLoading ||
				expertServiceAssignments?.isLoading ||
				serviceVersions?.isLoading ||
				serviceParents?.isLoading ||
				false
		);

		// Set error state
		const error =
			expertCVs?.error?.message ||
			expertServiceAssignments?.error?.message ||
			serviceVersions?.error?.message ||
			serviceParents?.error?.message ||
			null;
		expertStore.setError(error);
	});

	// Derived data
	let expertsForTable = $derived($expertsTableData);
	let pendingExperts = $derived($pendingVerificationData);
	let isLoading = $derived(
		expertCVs?.isLoading || expertServiceAssignments?.isLoading || serviceVersions?.isLoading || serviceParents?.isLoading || false
	);
	let error = $derived(
		expertCVs?.error?.message ||
			expertServiceAssignments?.error?.message ||
			serviceVersions?.error?.message ||
			serviceParents?.error?.message ||
			null
	);

	// Event handlers
	function handleEditExpert(expertId: string) {
		console.log('Edit expert:', expertId);
		// TODO: Implement edit functionality
	}

	function handleChatExpert(expertId: string) {
		console.log('Chat with expert:', expertId);
		onChatExpert?.(expertId);
		// TODO: Implement chat functionality
	}

	function handleSendReminder(expertId: string) {
		console.log('Send verification reminder to expert:', expertId);
		onSendReminder?.(expertId);
		// TODO: Implement reminder functionality
	}

	function handleViewDetails(expertId: string) {
		console.log('View details for expert:', expertId);
		onViewDetails?.(expertId);
		// TODO: Implement view details functionality
	}

	function handleAddExpert() {
		onAddExpert?.();
	}

	function handleContinueToPayment() {
		onContinueToPayment?.();
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
			<!-- Action Buttons -->
			{#if organizationId && expertsForTable.length > 0}
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
			Active: {expertsForTable.length} expert{expertsForTable.length !== 1 ? 's' : ''}
			{#if pendingExperts.length > 0}
				• Pending Verification: {pendingExperts.length} expert{pendingExperts.length !== 1
					? 's'
					: ''}
			{/if}
		</div>
	{/if}

	<!-- Expert Views -->
	{#if !organizationId}
		<div class="text-center py-8 text-gray-500">
			<svg
				class="w-12 h-12 mx-auto mb-4 text-gray-300"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
				/>
			</svg>
			<p class="text-lg font-medium mb-2">No Organization Selected</p>
			<p class="text-sm">Use the organization switcher in the header to select an organization</p>
		</div>
	{:else}
		<!-- Pending Verification Section -->
		<PendingVerificationSection
			experts={pendingExperts}
			{isLoading}
			onSendReminder={handleSendReminder}
			onViewDetails={handleViewDetails}
			{onCompleteProfile}
		/>

		<!-- Active Experts Table -->
		<ExpertTableView
			experts={expertsForTable}
			{isLoading}
			{error}
			{onEditExpert}
			onChatExpert={handleChatExpert}
		/>
	{/if}
</div>
