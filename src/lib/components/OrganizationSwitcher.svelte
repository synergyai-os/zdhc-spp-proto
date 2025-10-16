<script lang="ts">
	import {
		organizationStore,
		currentOrganizationName,
		organizationOptions
	} from '$lib/stores/organization.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';

	// Convex client for mutations
	const client = useConvexClient();

	// Local state
	let isOpen = $state(false);
	let isLoading = $state(false);

	// Reactive stores with error handling
	let currentOrgName = $derived($currentOrganizationName || 'No Organization Selected');
	let availableOrgs = $derived($organizationOptions || []);
	let orgContext = $derived(
		$organizationStore || { currentOrganization: null, isLoading: false, error: null }
	);

	// Handle organization switching
	async function switchOrganization(organizationId: string) {
		if (isLoading) return;

		isLoading = true;
		isOpen = false;

		try {
			// Update the organization store
			organizationStore.switchOrganization(organizationId);

			// In a real app, you might also update the user session in the database
			// For now, we'll just update the local store

			console.log(`Switched to organization: ${organizationId}`);
		} catch (error) {
			console.error('Error switching organization:', error);
			organizationStore.setError('Failed to switch organization');
		} finally {
			isLoading = false;
		}
	}

	// Handle dropdown toggle
	function toggleDropdown() {
		if (isLoading) return;
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.organization-switcher')) {
			isOpen = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="organization-switcher relative">
	<!-- Current Organization Display -->
	<button
		onclick={toggleDropdown}
		disabled={isLoading || orgContext.isLoading}
		class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
	>
		<!-- Organization Icon -->
		<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
			/>
		</svg>

		<!-- Organization Name -->
		<span class="truncate max-w-32">
			{#if orgContext.isLoading}
				Loading...
			{:else if orgContext.error}
				Error
			{:else if currentOrgName === 'No Organization Selected'}
				Select Organization
			{:else}
				{currentOrgName}
			{/if}
		</span>

		<!-- Dropdown Arrow -->
		<svg
			class="w-4 h-4 text-gray-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
		>
			<div class="p-3 border-b border-gray-100">
				<h3 class="text-sm font-semibold text-gray-800">Switch Organization</h3>
				<p class="text-xs text-gray-600 mt-1">Select which organization you're working as</p>
			</div>

			<div class="max-h-64 overflow-y-auto">
				{#if orgContext.isLoading}
					<div class="p-4 text-center text-gray-500">
						<div
							class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"
						></div>
						<p class="text-sm">Loading organizations...</p>
					</div>
				{:else if orgContext.error}
					<div class="p-4 text-center text-red-500">
						<p class="text-sm font-medium">Error loading organizations</p>
						<p class="text-xs mt-1">{orgContext.error}</p>
					</div>
				{:else if availableOrgs.length === 0}
					<div class="p-4 text-center text-gray-500">
						<p class="text-sm">No organizations available</p>
					</div>
				{:else}
					{#each availableOrgs as org (org.id)}
						{@const isCurrentOrg = orgContext.currentOrganization?._id === org.id}
						{@const isActive = org.status === 'active'}

						<button
							onclick={() => switchOrganization(org.id)}
							disabled={!isActive || isLoading}
							class="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed {isCurrentOrg
								? 'bg-blue-50 border-l-4 border-blue-500'
								: ''}"
						>
							<div class="flex items-center justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center space-x-2">
										<!-- Organization Type Badge -->
										<span
											class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {org.type ===
											'solution_provider'
												? 'bg-green-100 text-green-800'
												: 'bg-blue-100 text-blue-800'}"
										>
											{org.type === 'solution_provider' ? 'SPP' : 'ZDHC'}
										</span>

										<!-- Status Indicator -->
										{#if !isActive}
											<span
												class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
											>
												{org.status}
											</span>
										{/if}
									</div>

									<!-- Organization Name -->
									<p class="text-sm font-medium text-gray-900 mt-1 truncate">
										{org.name}
									</p>

									<!-- Current Indicator -->
									{#if isCurrentOrg}
										<p class="text-xs text-blue-600 font-medium">Currently selected</p>
									{/if}
								</div>

								<!-- Selection Indicator -->
								{#if isCurrentOrg}
									<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="p-3 border-t border-gray-100 bg-gray-50">
				<p class="text-xs text-gray-600">
					{#if orgContext.currentOrganization}
						Working as: <span class="font-medium">{orgContext.currentOrganization.name}</span>
					{:else}
						No organization selected
					{/if}
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.organization-switcher {
		/* Ensure dropdown appears above other elements */
		z-index: 50;
	}
</style>
