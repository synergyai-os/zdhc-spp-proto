<script lang="ts">
	import { organizationStore } from '$lib/stores/organization.svelte';
	import { validateOrganizationContext } from '$lib/utils/organization-context';

	let orgContext = $derived($organizationStore);
	let validation = $derived(validateOrganizationContext());

	// Show this component when organization context is not valid
	let showComponent = $derived(!validation.isValid);
</script>

{#if showComponent}
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
			<div class="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
				<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
				</svg>
			</div>
			
			<div class="text-center">
				<h3 class="text-lg font-medium text-gray-900 mb-2">
					Organization Required
				</h3>
				
				{#if orgContext.isLoading}
					<p class="text-sm text-gray-600 mb-4">
						Loading organization context...
					</p>
				{:else if orgContext.error}
					<p class="text-sm text-red-600 mb-4">
						{orgContext.error}
					</p>
				{:else if !orgContext.currentOrganization}
					<p class="text-sm text-gray-600 mb-4">
						No organization selected. Please select an organization to continue.
					</p>
					
					{#if orgContext.availableOrganizations.length > 0}
						<div class="space-y-2">
							<p class="text-xs text-gray-500">Available organizations:</p>
							<div class="space-y-1">
								{#each orgContext.availableOrganizations as org}
									<button
										onclick={() => organizationStore.setCurrentOrganization(org)}
										class="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
									>
										<div class="font-medium text-blue-900">{org.name}</div>
										<div class="text-xs text-blue-600 capitalize">{org.type.replace('_', ' ')}</div>
									</button>
								{/each}
							</div>
						</div>
					{:else}
						<p class="text-xs text-gray-500">
							No organizations available. Please contact an administrator.
						</p>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}
