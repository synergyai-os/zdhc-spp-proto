<script lang="ts">
	// Example audit trail data (hardcoded for now)
	const entries = [
		{ action: 'CV Status Changed', from: 'paid', to: 'locked_for_review', by: 'System', timestamp: Date.now() - 86400000 },
		{ action: 'Payment Completed', from: 'payment_pending', to: 'paid', by: 'Payment Gateway', timestamp: Date.now() - 172800000 },
		{ action: 'CV Submitted', from: 'completed', to: 'payment_pending', by: 'John Doe', timestamp: Date.now() - 259200000 }
	];

	const formatDate = (timestamp: number): string => {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};
</script>

<div class="bg-white border border-gray-200 rounded-lg p-6">
	<h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
		<svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
		</svg>
		Audit Trail
	</h2>
	<div class="space-y-3">
		{#each entries as entry}
			<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
				<div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
				<div class="flex-1">
					<p class="text-sm font-medium text-gray-900">{entry.action}</p>
					<p class="text-xs text-gray-600">
						{#if entry.from && entry.to}
							{entry.from} → {entry.to}
						{/if}
						by {entry.by} • {formatDate(entry.timestamp)}
					</p>
				</div>
			</div>
		{/each}
	</div>
</div>

