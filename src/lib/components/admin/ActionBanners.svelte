<script lang="ts">
	interface Props {
		currentCVStatus: string;
		canLockCV: boolean;
		isProcessing: boolean;
		onStartReview: () => Promise<void>;
		onLockCV: () => Promise<void>;
		onUnlockCV: () => Promise<void>;
	}

	let { currentCVStatus, canLockCV, isProcessing, onStartReview, onLockCV, onUnlockCV }: Props = $props();
</script>

<!-- Start Review Banner (when CV is paid and awaiting review) -->
{#if currentCVStatus === 'paid' || currentCVStatus === 'payment_pending'}
	<div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="flex-shrink-0">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-medium text-blue-900">Ready for Review</h3>
					<p class="text-sm text-blue-700 mt-1">
						This CV is ready to be reviewed. Click "Start Review" to begin the approval process.
					</p>
				</div>
			</div>
			<button
				type="button"
				onclick={onStartReview}
				disabled={isProcessing}
				class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
			>
				{#if isProcessing}
					Processing...
				{:else}
					Start Review
				{/if}
			</button>
		</div>
	</div>
{/if}

<!-- Ready to Finalize Banner (when all services are reviewed) -->
{#if canLockCV}
	<div class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="flex-shrink-0">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-medium text-green-900">Review Complete</h3>
					<p class="text-sm text-green-700 mt-1">
						All service applications have been reviewed. Lock the CV to finalize the review process.
					</p>
				</div>
			</div>
			<button
				type="button"
				onclick={onLockCV}
				disabled={isProcessing}
				class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
			>
				{#if isProcessing}
					Processing...
				{:else}
					🔒 Lock CV & Finalize Review
				{/if}
			</button>
		</div>
	</div>
{/if}

<!-- Unlock for Edits Banner (when CV is in locked_for_review) -->
{#if currentCVStatus === 'locked_for_review' && !canLockCV}
	<div class="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="flex-shrink-0">
					<svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-medium text-orange-900">Needs Changes</h3>
					<p class="text-sm text-orange-700 mt-1">
						Unlock this CV to allow the expert to make requested changes.
					</p>
				</div>
			</div>
			<button
				type="button"
				onclick={onUnlockCV}
				disabled={isProcessing}
				class="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
			>
				{#if isProcessing}
					Processing...
				{:else}
					Unlock CV for Edits
				{/if}
			</button>
		</div>
	</div>
{/if}

