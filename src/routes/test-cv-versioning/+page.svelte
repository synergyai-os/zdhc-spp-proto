<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import type { Id } from '../../convex/_generated/dataModel';

	// Get Convex client
	const client = useConvexClient();

	// State
	let isSeeding = $state(false);
	let seedResult = $state<any>(null);
	let seedError = $state<string | null>(null);

	// Get existing data to show before/after
	const expertCVs = useQuery(api.expertCVs.getExpertCVs, () => ({}));
	const expertServiceAssignments = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, () => ({}));

	// Seed function
	async function seedTestData() {
		if (isSeeding) return;

		try {
			isSeeding = true;
			seedError = null;
			seedResult = null;

			console.log('🌱 Starting CV versioning seed data creation...');

			const result = await client.mutation(api.expertCVs.seedExpertCVsTestData, {});

			seedResult = result;
			console.log('✅ Seed data created successfully:', result);
		} catch (error) {
			console.error('❌ Error creating seed data:', error);
			seedError = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			isSeeding = false;
		}
	}

	// Clear all data function
	async function clearAllData() {
		if (isSeeding) return;

		try {
			isSeeding = true;
			seedError = null;

			console.log('🗑️ Clearing all CV and assignment data...');

			// Note: In a real implementation, you'd want to delete all CVs and assignments
			// For now, we'll just log this action
			console.log('Clear function would delete all expertCVs and expertServiceAssignments');
			
			alert('Clear function not implemented - would delete all CV and assignment data');
		} catch (error) {
			console.error('❌ Error clearing data:', error);
			seedError = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			isSeeding = false;
		}
	}
</script>

<div class="bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-6">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-4">CV Versioning Test Page</h1>
			<p class="text-gray-600">
				Test page for the new CV versioning system. Create seed data and verify the new schema works correctly.
			</p>
		</div>

		<!-- Current Data Summary -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
			<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
				<h2 class="text-xl font-bold text-gray-800 mb-4">Expert CVs</h2>
				<div class="text-3xl font-bold text-blue-600 mb-2">
					{expertCVs?.data?.length || 0}
				</div>
				<p class="text-gray-600 text-sm">Total CV records</p>
				
				{#if expertCVs?.data?.length > 0}
					<div class="mt-4 space-y-2">
						{#each expertCVs.data.slice(0, 3) as cv}
							<div class="text-sm p-2 bg-gray-50 rounded">
								<div class="font-medium">CV v{cv.version}</div>
								<div class="text-gray-600">{cv.user?.email || 'Unknown user'}</div>
								<div class="text-xs text-gray-500">
									Status: <span class="font-medium {cv.status === 'draft' ? 'text-gray-600' : cv.status === 'submitted' ? 'text-blue-600' : 'text-green-600'}">{cv.status}</span>
								</div>
							</div>
						{/each}
						{#if expertCVs.data.length > 3}
							<div class="text-xs text-gray-500">... and {expertCVs.data.length - 3} more</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
				<h2 class="text-xl font-bold text-gray-800 mb-4">Service Assignments</h2>
				<div class="text-3xl font-bold text-green-600 mb-2">
					{expertServiceAssignments?.data?.length || 0}
				</div>
				<p class="text-gray-600 text-sm">Total assignment records</p>
				
				{#if expertServiceAssignments?.data?.length > 0}
					<div class="mt-4 space-y-2">
						{#each expertServiceAssignments.data.slice(0, 3) as assignment}
							<div class="text-sm p-2 bg-gray-50 rounded">
								<div class="font-medium">{assignment.serviceVersion?.name || 'Unknown service'}</div>
								<div class="text-gray-600">{assignment.user?.email || 'Unknown user'}</div>
								<div class="text-xs text-gray-500">
									Status: <span class="font-medium {assignment.status === 'pending_review' ? 'text-yellow-600' : assignment.status === 'approved' ? 'text-green-600' : 'text-red-600'}">{assignment.status}</span>
								</div>
							</div>
						{/each}
						{#if expertServiceAssignments.data.length > 3}
							<div class="text-xs text-gray-500">... and {expertServiceAssignments.data.length - 3} more</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Actions -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
			<h2 class="text-xl font-bold text-gray-800 mb-4">Test Actions</h2>
			
			<div class="flex flex-wrap gap-4">
				<button
					onclick={seedTestData}
					disabled={isSeeding}
					class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSeeding ? 'Creating...' : 'Create Seed Data'}
				</button>

				<button
					onclick={clearAllData}
					disabled={isSeeding}
					class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSeeding ? 'Clearing...' : 'Clear All Data'}
				</button>
			</div>

			{#if seedError}
				<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<div class="text-red-800 font-medium">Error:</div>
					<div class="text-red-700 text-sm">{seedError}</div>
				</div>
			{/if}

			{#if seedResult}
				<div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
					<div class="text-green-800 font-medium">Success!</div>
					<div class="text-green-700 text-sm mb-2">{seedResult.message}</div>
					<div class="text-xs text-green-600">
						Created: {seedResult.summary.lockedCVs} locked CVs, {seedResult.summary.submittedCVs} submitted CVs, {seedResult.summary.draftCVs} draft CVs
					</div>
				</div>
			{/if}
		</div>

		<!-- Test Scenarios -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 class="text-xl font-bold text-gray-800 mb-4">Test Scenarios</h2>
			
			<div class="space-y-4">
				<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<h3 class="font-medium text-blue-800 mb-2">1. CV Versioning</h3>
					<p class="text-blue-700 text-sm">
						After seeding, you should see multiple CV versions per user (v1, v2, v3) with different statuses (locked, submitted, draft).
					</p>
				</div>

				<div class="p-4 bg-green-50 border border-green-200 rounded-lg">
					<h3 class="font-medium text-green-800 mb-2">2. Service Assignments</h3>
					<p class="text-green-700 text-sm">
						Each CV should have service assignments linking to specific service versions with approval statuses.
					</p>
				</div>

				<div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
					<h3 class="font-medium text-purple-800 mb-2">3. Workflow States</h3>
					<p class="text-purple-700 text-sm">
						CVs should show different workflow states: draft (editable), submitted (under review), locked (immutable).
					</p>
				</div>

				<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<h3 class="font-medium text-yellow-800 mb-2">4. Auto-Copy Feature</h3>
					<p class="text-yellow-700 text-sm">
						New CV versions should auto-copy experience/education from the latest locked CV when created.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
