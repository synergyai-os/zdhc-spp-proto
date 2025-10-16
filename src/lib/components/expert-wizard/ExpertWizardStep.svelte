<script lang="ts">
	interface Props {
		step: number;
		title: string;
		description?: string;
		isActive: boolean;
		isCompleted: boolean;
		children: any;
		actions: any;
	}
	
	let { step, title, description, isActive, isCompleted, children, actions }: Props = $props();
</script>

<div class="wizard-step">
	{#if isActive}
		<div class="step-content">
			<div class="step-header">
				<h2 class="text-xl font-bold text-gray-800 mb-4">{title}</h2>
				{#if description}
					<p class="text-gray-600 mb-6">{description}</p>
				{/if}
			</div>
			
			<div class="step-body">
				{@render children?.()}
			</div>
			
			<div class="step-actions">
				{@render actions?.()}
			</div>
		</div>
	{/if}
</div>

<style>
	.wizard-step {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
	
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.step-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}
</style>
