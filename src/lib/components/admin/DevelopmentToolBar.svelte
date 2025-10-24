<script lang="ts">
	import CVStageAdvancer from './CVStageAdvancer.svelte';
	import PaymentConfirmationButton from './PaymentConfirmationButton.svelte';
	import AcademyTrainingController from './AcademyTrainingController.svelte';
	import type { CVStatus, TrainingStatus } from '../../../convex/model/status';
	import type { Id } from '$lib';

	interface Props {
		cvStatus: CVStatus;
		cvId: Id<'expertCVs'>;
		assignmentId?: string;
		trainingStatus?: TrainingStatus;
		onActionCompleted?: () => void;
	}

	let { cvStatus, cvId, assignmentId, trainingStatus, onActionCompleted }: Props = $props();

	const handleActionCompleted = () => {
		if (onActionCompleted) {
			onActionCompleted();
		}
	};
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4">
	<div class="mb-3">
		<h3 class="text-sm font-semibold text-gray-900 flex items-center">
			<svg class="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			Development Tools
		</h3>
		<p class="text-xs text-gray-500 mt-1">Quick access tools for CV management</p>
	</div>
	
	<div class="flex items-center gap-3">
		<!-- CV Stage Advancer -->
		<div class="flex items-center gap-2">
			<CVStageAdvancer 
				cvStatus={cvStatus}
				cvId={cvId}
				onStageAdvanced={handleActionCompleted}
			/>
		</div>

		<!-- Divider -->
		<div class="w-px h-6 bg-gray-300"></div>

		<!-- Payment Confirmation -->
		<div class="flex items-center gap-2">
			<PaymentConfirmationButton 
				cvStatus={cvStatus}
				cvId={cvId}
				onPaymentConfirmed={handleActionCompleted}
			/>
		</div>

		<!-- Divider -->
		<div class="w-px h-6 bg-gray-300"></div>

		<!-- Academy Training Controller -->
		{#if assignmentId}
			<div class="flex items-center gap-2">
				<AcademyTrainingController 
					assignmentId={assignmentId}
					currentTrainingStatus={trainingStatus}
					onTrainingStatusUpdated={handleActionCompleted}
				/>
			</div>
		{/if}
	</div>
</div>
