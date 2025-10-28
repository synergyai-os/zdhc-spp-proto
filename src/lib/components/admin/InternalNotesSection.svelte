<script lang="ts">
	// Example internal notes data (hardcoded for now)
	const notes = [
		{ author: 'Sarah Johnson', note: 'CV looks good overall, but need to verify experience in chemical engineering.', timestamp: Date.now() - 3600000 },
		{ author: 'Mike Chen', note: 'Waiting for additional documentation from the expert.', timestamp: Date.now() - 7200000 }
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
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-xl font-bold text-gray-900 flex items-center">
			<svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
			</svg>
			Internal Notes
		</h2>
		<button class="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
			Add Note
		</button>
	</div>
	<div class="space-y-3">
		{#each notes as note}
			<div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
				<div class="flex justify-between items-start">
					<div class="flex-1">
						<p class="text-sm text-gray-900">{note.note}</p>
						<p class="text-xs text-gray-600 mt-1">
							by {note.author} • {formatDate(note.timestamp)}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

