<script lang="ts">
	import CVStageAdvancer from './CVStageAdvancer.svelte';
	import PaymentConfirmationButton from './PaymentConfirmationButton.svelte';
	import AcademyTrainingController from './AcademyTrainingController.svelte';
	import PayAnnualFeeController from './PayAnnualFeeController.svelte';
	import type { CVStatus, TrainingStatus } from '../../../convex/model/status';
	import type { Id } from '$lib';

	interface Props {
		cvStatus: CVStatus;
		cvId: Id<'expertCVs'>;
		assignmentId?: string;
		trainingStatus?: TrainingStatus;
		organizationId?: Id<'organizations'>;
		serviceVersionId?: Id<'serviceVersions'>;
		onActionCompleted?: () => void;
	}

	let { cvStatus, cvId, assignmentId, trainingStatus, organizationId, serviceVersionId, onActionCompleted }: Props = $props();

	const handleActionCompleted = () => {
		if (onActionCompleted) {
			onActionCompleted();
		}
	};
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4">
	<div class="mb-4">
		<h3 class="text-sm font-semibold text-gray-900 flex items-center">
			<svg class="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			Development Tools
		</h3>
		<p class="text-xs text-gray-500 mt-1">Quick access tools for CV management</p>
	</div>
	
	<div class="space-y-4">
		<!-- CV MANAGEMENT Section -->
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<span class="text-xs font-medium text-gray-600 flex items-center">
					<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					CV MANAGEMENT
				</span>
			</div>
			
			<div class="flex items-center gap-2">
				<CVStageAdvancer 
					cvStatus={cvStatus}
					cvId={cvId}
					onStageAdvanced={handleActionCompleted}
				/>
				<PaymentConfirmationButton 
					cvStatus={cvStatus}
					cvId={cvId}
					onPaymentConfirmed={handleActionCompleted}
				/>
			</div>
		</div>

		<!-- EXPERT SERVICE APPROVAL Section -->
		{#if assignmentId}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="text-xs font-medium text-gray-600 flex items-center">
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
						</svg>
						EXPERT SERVICE APPROVAL
					</span>
				</div>
				
				<div class="flex items-center gap-2">
					<AcademyTrainingController 
						assignmentId={assignmentId}
						currentTrainingStatus={trainingStatus}
						onTrainingStatusUpdated={handleActionCompleted}
					/>
				</div>
			</div>
		{/if}

		<!-- APPROVED SERVICES (ORG LEVEL) Section -->
		{#if organizationId && serviceVersionId}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="text-xs font-medium text-gray-600 flex items-center">
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
						APPROVED SERVICES (ORG LEVEL)
					</span>
				</div>
				
				<div class="flex items-center gap-2">
					<PayAnnualFeeController 
						{organizationId}
						{serviceVersionId}
						onPaymentCompleted={handleActionCompleted}
					/>
				</div>
			</div>
		{/if}
	</div>
</div>
