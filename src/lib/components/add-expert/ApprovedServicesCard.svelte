<script lang="ts">
	interface ApprovedService {
		serviceVersion: {
			_id: string;
			name: string;
			version: string;
			serviceParent?: {
				name: string;
			};
		};
		role: 'regular' | 'lead';
	}

	interface Props {
		approvedServices: ApprovedService[];
	}

	let { approvedServices }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-xl font-bold text-gray-800">Approved Services</h3>
	</div>

	{#if approvedServices.length === 0}
		<p class="text-sm text-gray-500">No approved services yet.</p>
	{:else}
		<div class="flex flex-wrap gap-2">
			{#each approvedServices as item}
				<div class="flex items-center gap-1">
					<span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
						{item.serviceVersion.name}
						{#if item.serviceVersion.version}
							<span class="ml-1 text-blue-600">V{item.serviceVersion.version}</span>
						{/if}
					</span>
					{#if item.role === 'lead'}
						<span class="inline-flex items-center px-2 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
							Lead
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

