<script lang="ts">
	import ExperienceCard from '$lib/components/shared/ExperienceCard.svelte';
	import EducationCard from '$lib/components/shared/EducationCard.svelte';
	import TrainingCard from '$lib/components/shared/TrainingCard.svelte';
	import ApprovalCard from '$lib/components/shared/ApprovalCard.svelte';
	import type { ExperienceEntry, EducationEntry, TrainingQualificationEntry, OtherApprovalEntry } from '../../../convex/model/types';
	import type { CVStatus } from '../../../convex/model/status';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '$lib';

	interface Props {
		cvId?: Id<'expertCVs'>;
		cvStatus?: CVStatus;
		experience?: ExperienceEntry[];
		education?: EducationEntry[];
		trainingQualifications?: TrainingQualificationEntry[];
		otherApprovals?: OtherApprovalEntry[];
		onItemsUpdated?: () => void;
	}

	let { 
		cvId, 
		cvStatus, 
		experience = [], 
		education = [], 
		trainingQualifications = [], 
		otherApprovals = [],
		onItemsUpdated
	}: Props = $props();

	const client = useConvexClient();

	// Selection state per section
	let selectedExperience = $state<Set<number>>(new Set());
	let selectedEducation = $state<Set<number>>(new Set());
	let selectedTraining = $state<Set<number>>(new Set());
	let selectedApprovals = $state<Set<number>>(new Set());

	// Processing state
	let isProcessing = $state(false);
	let processingMessage = $state('');

	// Check if review controls should be shown (only in review states)
	const showReviewControls = $derived(
		cvId && cvStatus && (cvStatus === 'locked_for_review' || cvStatus === 'unlocked_for_edits')
	);

	// Toggle selection
	function toggleSelection(section: 'experience' | 'education' | 'training' | 'approvals', index: number) {
		let set: Set<number>;
		switch (section) {
			case 'experience':
				set = selectedExperience;
				break;
			case 'education':
				set = selectedEducation;
				break;
			case 'training':
				set = selectedTraining;
				break;
			case 'approvals':
				set = selectedApprovals;
				break;
		}
		
		if (set.has(index)) {
			set.delete(index);
		} else {
			set.add(index);
		}
		
		// Trigger reactivity
		switch (section) {
			case 'experience':
				selectedExperience = new Set(selectedExperience);
				break;
			case 'education':
				selectedEducation = new Set(selectedEducation);
				break;
			case 'training':
				selectedTraining = new Set(selectedTraining);
				break;
			case 'approvals':
				selectedApprovals = new Set(selectedApprovals);
				break;
		}
	}

	async function lockItems(section: 'experience' | 'education' | 'training' | 'approvals') {
		if (!cvId) return;
		
		let indices: number[];
		switch (section) {
			case 'experience':
				indices = Array.from(selectedExperience);
				break;
			case 'education':
				indices = Array.from(selectedEducation);
				break;
			case 'training':
				indices = Array.from(selectedTraining);
				break;
			case 'approvals':
				indices = Array.from(selectedApprovals);
				break;
		}

		if (indices.length === 0) return;

		isProcessing = true;
		processingMessage = `Locking ${indices.length} item(s)...`;

		try {
			await client.mutation((api as any).adminCVReview.setItemsUnderReview, {
				cvId,
				section,
				itemIndices: indices,
				lock: true
			});

			// Clear selection
			switch (section) {
				case 'experience':
					selectedExperience = new Set();
					break;
				case 'education':
					selectedEducation = new Set();
					break;
				case 'training':
					selectedTraining = new Set();
					break;
				case 'approvals':
					selectedApprovals = new Set();
					break;
			}

			processingMessage = `Locked ${indices.length} item(s)`;
			onItemsUpdated?.();
			
			setTimeout(() => {
				processingMessage = '';
				isProcessing = false;
			}, 2000);
		} catch (error) {
			processingMessage = `Failed: ${error}`;
			setTimeout(() => {
				processingMessage = '';
				isProcessing = false;
			}, 3000);
		}
	}

	async function unlockItems(section: 'experience' | 'education' | 'training' | 'approvals') {
		if (!cvId) return;
		
		let indices: number[];
		switch (section) {
			case 'experience':
				indices = Array.from(selectedExperience);
				break;
			case 'education':
				indices = Array.from(selectedEducation);
				break;
			case 'training':
				indices = Array.from(selectedTraining);
				break;
			case 'approvals':
				indices = Array.from(selectedApprovals);
				break;
		}

		if (indices.length === 0) return;

		isProcessing = true;
		processingMessage = `Unlocking ${indices.length} item(s)...`;

		try {
			await client.mutation((api as any).adminCVReview.setItemsUnderReview, {
				cvId,
				section,
				itemIndices: indices,
				lock: false
			});

			// Clear selection
			switch (section) {
				case 'experience':
					selectedExperience = new Set();
					break;
				case 'education':
					selectedEducation = new Set();
					break;
				case 'training':
					selectedTraining = new Set();
					break;
				case 'approvals':
					selectedApprovals = new Set();
					break;
			}

			processingMessage = `Unlocked ${indices.length} item(s)`;
			onItemsUpdated?.();
			
			setTimeout(() => {
				processingMessage = '';
				isProcessing = false;
			}, 2000);
		} catch (error) {
			processingMessage = `Failed: ${error}`;
			setTimeout(() => {
				processingMessage = '';
				isProcessing = false;
			}, 3000);
		}
	}
</script>

{#if experience && experience.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold text-gray-900">Professional Experience</h2>
			{#if showReviewControls}
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => lockItems('experience')}
						disabled={isProcessing || selectedExperience.size === 0}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
						Lock Selected ({selectedExperience.size})
					</button>
					<button
						type="button"
						onclick={() => unlockItems('experience')}
						disabled={isProcessing || selectedExperience.size === 0}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
						</svg>
						Unlock Selected ({selectedExperience.size})
					</button>
				</div>
			{/if}
		</div>
		<div class="space-y-4">
			{#each experience as exp, index}
				<div class="flex items-start gap-3">
					{#if showReviewControls}
						<input
							type="checkbox"
							checked={selectedExperience.has(index)}
							onchange={() => toggleSelection('experience', index)}
							class="mt-2 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
							title="Select for review"
						/>
					{/if}
					<div class="flex-1">
						<ExperienceCard experience={exp} readOnly={true} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if education && education.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold text-gray-900">Education</h2>
			{#if showReviewControls}
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => lockItems('education')}
						disabled={isProcessing || selectedEducation.size === 0}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
						Lock Selected ({selectedEducation.size})
					</button>
					<button
						type="button"
						onclick={() => unlockItems('education')}
						disabled={isProcessing || selectedEducation.size === 0}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
						</svg>
						Unlock Selected ({selectedEducation.size})
					</button>
				</div>
			{/if}
		</div>
		<div class="space-y-4">
			{#each education as edu, index}
				<div class="flex items-start gap-3">
					{#if showReviewControls}
						<input
							type="checkbox"
							checked={selectedEducation.has(index)}
							onchange={() => toggleSelection('education', index)}
							class="mt-2 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
							title="Select for review"
						/>
					{/if}
					<div class="flex-1">
						<EducationCard education={edu} readOnly={true} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if trainingQualifications && trainingQualifications.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold text-gray-900">Training & Qualifications</h2>
			{#if showReviewControls}
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => lockItems('training')}
						disabled={isProcessing || selectedTraining.size === 0}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
						Lock Selected ({selectedTraining.size})
					</button>
					<button
						type="button"
						onclick={() => unlockItems('training')}
						disabled={isProcessing || selectedTraining.size === 0}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
						</svg>
						Unlock Selected ({selectedTraining.size})
					</button>
				</div>
			{/if}
		</div>
		<div class="space-y-4">
			{#each trainingQualifications as qual, index}
				<div class="flex items-start gap-3">
					{#if showReviewControls}
						<input
							type="checkbox"
							checked={selectedTraining.has(index)}
							onchange={() => toggleSelection('training', index)}
							class="mt-2 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
							title="Select for review"
						/>
					{/if}
					<div class="flex-1">
						<TrainingCard training={qual} readOnly={true} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if otherApprovals && otherApprovals.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold text-gray-900">Other Approvals</h2>
			{#if showReviewControls}
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => lockItems('approvals')}
						disabled={isProcessing || selectedApprovals.size === 0}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
						Lock Selected ({selectedApprovals.size})
					</button>
					<button
						type="button"
						onclick={() => unlockItems('approvals')}
						disabled={isProcessing || selectedApprovals.size === 0}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
						</svg>
						Unlock Selected ({selectedApprovals.size})
					</button>
				</div>
			{/if}
		</div>
		<div class="space-y-4">
			{#each otherApprovals as approval, index}
				<div class="flex items-start gap-3">
					{#if showReviewControls}
						<input
							type="checkbox"
							checked={selectedApprovals.has(index)}
							onchange={() => toggleSelection('approvals', index)}
							class="mt-2 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
							title="Select for review"
						/>
					{/if}
					<div class="flex-1">
						<ApprovalCard approval={approval} readOnly={true} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if processingMessage}
	<div class="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50">
		<p class="text-sm font-medium text-blue-800">{processingMessage}</p>
	</div>
{/if}

