<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '$lib';

	interface Props {
		userId: Id<'users'>;
		currentStatus: boolean; // true = active, false = inactive
		onStatusChanged?: () => void;
	}

	let { userId, currentStatus, onStatusChanged }: Props = $props();

	const client = useConvexClient();

	// State for confirmation dialog
	let showConfirmation = $state(false);
	let isProcessing = $state(false);
	let errorMessage = $state('');

	const handleClick = (e: Event) => {
		e.stopPropagation();
		if (userId) {
			showConfirmation = true;
		}
	};

	const confirmToggle = async () => {
		if (!userId) return;

		isProcessing = true;
		errorMessage = '';

		try {
			await client.mutation(api.utilities.toggleUserActiveStatus, {
				userId: userId
			});

			showConfirmation = false;
			onStatusChanged?.();
		} catch (error) {
			errorMessage = `Failed to ${currentStatus ? 'deactivate' : 'activate'} user: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const cancelConfirmation = () => {
		showConfirmation = false;
		errorMessage = '';
	};
</script>

<button
	type="button"
	onclick={handleClick}
	class="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 {currentStatus
		? 'text-green-600 hover:text-green-800 hover:bg-green-50'
		: 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}"
	title="{currentStatus ? 'Deactivate user profile' : 'Activate user profile'}"
>
	{#if currentStatus}
		<!-- Active: Green checkmark -->
		<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
			<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
		</svg>
	{:else}
		<!-- Inactive: Gray X -->
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
		</svg>
	{/if}
</button>

<!-- Confirmation Dialog -->
{#if showConfirmation}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<div class="flex items-center mb-4">
				<div class="w-10 h-10 {currentStatus ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center mr-3">
					{#if currentStatus}
						<!-- Deactivate -->
						<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					{:else}
						<!-- Activate -->
						<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
						</svg>
					{/if}
				</div>
				<h3 class="text-lg font-medium text-gray-900">
					{currentStatus ? 'Deactivate User' : 'Activate User'}
				</h3>
			</div>
			
			<div class="mb-6">
				<p class="text-sm text-gray-600 mb-3">
					{#if currentStatus}
						Are you sure you want to deactivate this user profile?
						<br><br>
						The user will be marked as inactive and may not be able to log in or access their account.
					{:else}
						Are you sure you want to activate this user profile?
						<br><br>
						The user will be marked as active and will be able to log in and access their account.
					{/if}
				</p>
				<div class="bg-gray-50 rounded-lg p-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">Current status:</span>
						<span class="text-sm font-semibold {currentStatus ? 'text-green-600' : 'text-gray-500'}">
							{currentStatus ? 'Active' : 'Inactive'}
						</span>
					</div>
					<div class="flex items-center justify-between mt-1">
						<span class="text-sm font-medium text-gray-700">New status:</span>
						<span class="text-sm font-semibold {currentStatus ? 'text-gray-500' : 'text-green-600'}">
							{currentStatus ? 'Inactive' : 'Active'}
						</span>
					</div>
				</div>
			</div>

			{#if errorMessage}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
					<p class="text-sm text-red-600">{errorMessage}</p>
				</div>
			{/if}

			<div class="flex justify-end space-x-3">
				<button
					type="button"
					onclick={cancelConfirmation}
					disabled={isProcessing}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmToggle}
					disabled={isProcessing}
					class="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed {currentStatus 
						? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
						: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}"
				>
					{#if isProcessing}
						<svg class="w-4 h-4 mr-2 animate-spin inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
					{/if}
					{currentStatus ? 'Deactivate User' : 'Activate User'}
				</button>
			</div>
		</div>
	</div>
{/if}

