<script lang="ts">
	interface Props {
		variant: 'yellow' | 'green' | 'blue' | 'red' | 'purple';
		icon: string; // SVG path
		title: string;
		subtitle?: string;
		statusInfo?: string;
		description?: string;
		nextSteps?: string[];
		buttonText: string;
		buttonAction?: () => void;
		buttonDisabled?: boolean;
	}

	let {
		variant,
		icon,
		title,
		subtitle,
		statusInfo,
		description,
		nextSteps,
		buttonText,
		buttonAction,
		buttonDisabled = false
	}: Props = $props();

	const variantStyles = {
		yellow: {
			bg: 'bg-yellow-50',
			border: 'border-yellow-200',
			text: 'text-yellow-800',
			textSecondary: 'text-yellow-700',
			borderInner: 'border-yellow-300',
			button: 'bg-yellow-600 hover:bg-yellow-700'
		},
		green: {
			bg: 'bg-green-50',
			border: 'border-green-200',
			text: 'text-green-800',
			textSecondary: 'text-green-700',
			borderInner: 'border-green-300',
			button: 'bg-green-600 hover:bg-green-700'
		},
		blue: {
			bg: 'bg-blue-50',
			border: 'border-blue-200',
			text: 'text-blue-800',
			textSecondary: 'text-blue-700',
			borderInner: 'border-blue-300',
			button: 'bg-blue-600 hover:bg-blue-700'
		},
		red: {
			bg: 'bg-red-50',
			border: 'border-red-200',
			text: 'text-red-800',
			textSecondary: 'text-red-700',
			borderInner: 'border-red-300',
			button: 'bg-red-600 hover:bg-red-700'
		},
		purple: {
			bg: 'bg-purple-50',
			border: 'border-purple-200',
			text: 'text-purple-800',
			textSecondary: 'text-purple-700',
			borderInner: 'border-purple-300',
			button: 'bg-purple-600 hover:bg-purple-700'
		}
	};

	const styles = $derived(variantStyles[variant]);
</script>

<div class="{styles.bg} border {styles.border} rounded-lg p-6">
	<div class="flex items-start">
		<svg class="w-6 h-6 {styles.textSecondary} mt-1 mr-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
			<path fill-rule="evenodd" d={icon} />
		</svg>
		<div class="flex-1">
			<h3 class="text-lg font-semibold {styles.text} mb-2">{title}</h3>
			{#if subtitle}
				<p class="text-sm {styles.textSecondary} mb-4">{subtitle}</p>
			{/if}

			{#if statusInfo || description || nextSteps}
				<div class="bg-white border {styles.borderInner} rounded-lg p-4">
					{#if statusInfo}
						<h4 class="text-sm font-medium {styles.text} mb-2">{statusInfo}</h4>
					{/if}
					{#if description}
						<p class="text-sm {styles.textSecondary} mb-3">{description}</p>
					{/if}

					{#if nextSteps && nextSteps.length > 0}
						<h4 class="text-sm font-medium {styles.text} mb-2 mt-4">Next Steps:</h4>
						<ul class="text-sm {styles.textSecondary} space-y-1 list-disc list-inside">
							{#each nextSteps as step}
								<li>{step}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			{#if buttonText}
				<div class="mt-4">
					<button
						type="button"
						onclick={buttonAction}
						disabled={buttonDisabled}
						class="px-6 py-2 text-white rounded-lg transition-colors {buttonDisabled
							? 'bg-gray-400 cursor-not-allowed'
							: styles.button}"
					>
						{buttonText}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

