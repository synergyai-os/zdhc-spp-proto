<script lang="ts">
	interface Props {
		number: number;
		title: string;
		description: string;
		onClick?: () => void;
	}

	let { number, title, description, onClick }: Props = $props();
</script>

<div
	class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
	onclick={onClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && onClick?.()}
>
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<h3 class="text-xl font-bold text-gray-800 mb-3">{number}. {title}</h3>
			<p class="text-gray-600 leading-relaxed">
				{description}
			</p>
		</div>
		<svg class="w-6 h-6 text-gray-400 ml-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
			<path
				d="M8.293 14.707a1 1 0 001.414 0L15 9.414V16a1 1 0 102 0V7a1 1 0 00-1-1H8a1 1 0 100 2h5.586L8.293 12.293a1 1 0 000 1.414z"
			/>
		</svg>
	</div>
</div>
