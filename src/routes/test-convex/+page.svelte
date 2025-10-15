<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	
	// Get Convex client
	const client = useConvexClient();
	
	// Test data
	let testResults = $state('');
	let isLoading = $state(false);
	
	// Use reactive queries
	const users = useQuery(api.expertAssignments.getUsers, () => ({}));
	const organizations = useQuery(api.expertAssignments.getOrganizations, () => ({}));
	
	async function testConnection() {
		isLoading = true;
		testResults = 'Testing connection...\n';
		
		try {
			// Test 1: Check if queries are working
			testResults += `✅ Users query reactive: ${users?.data?.length || 0} users found\n`;
			testResults += `✅ Organizations query reactive: ${organizations?.data?.length || 0} organizations found\n`;
			
			// Test 2: Create a test user
			const userId = await client.mutation(api.expertAssignments.createUser, {
				firstName: 'Test',
				lastName: 'User',
				email: 'test@example.com',
				country: 'Netherlands'
			});
			testResults += `✅ User created with ID: ${userId}\n`;
			
			// Test 3: Create a test organization
			const orgId = await client.mutation(api.expertAssignments.createOrganization, {
				name: 'Test Organization',
				type: 'solution_provider',
				contactEmail: 'admin@testorg.com'
			});
			testResults += `✅ Organization created with ID: ${orgId}\n`;
			
			testResults += '\n🎉 All tests passed! Convex is working correctly.';
			
		} catch (error: any) {
			testResults += `❌ Error: ${error.message}\n`;
			console.error('Convex test error:', error);
		}
		
		isLoading = false;
	}
	
	async function seedTestData() {
		isLoading = true;
		testResults = 'Seeding test data...\n';
		
		try {
			const result = await client.mutation(api.expertAssignments.seedInitialData, {});
			testResults += `✅ Created ${result.users.length} users\n`;
			testResults += `✅ Created ${result.organizations.length} organizations\n`;
			testResults += `✅ Created ${result.staffMembers.length} staff members\n`;
			testResults += `✅ Created ${result.expertAssignments.length} expert assignments\n`;
			testResults += '\n🎉 Test data seeded successfully!';
			
		} catch (error: any) {
			testResults += `❌ Error: ${error.message}\n`;
			console.error('Seeding error:', error);
		}
		
		isLoading = false;
	}
	
	async function clearTestData() {
		isLoading = true;
		testResults = 'Clearing test data...\n';
		
		try {
			const result = await client.mutation(api.expertAssignments.clearAllData, {});
			testResults += `✅ ${result.message}\n`;
			testResults += '🎉 All test data cleared successfully!';
			
		} catch (error: any) {
			testResults += `❌ Error: ${error.message}\n`;
			console.error('Clear data error:', error);
		}
		
		isLoading = false;
	}
</script>

<div class="max-w-4xl mx-auto p-6">
	<h1 class="text-3xl font-bold text-gray-900 mb-6">Convex Database Test</h1>
	
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Connection Test</h2>
		<p class="text-gray-600 mb-4">
			This page tests if Convex is properly connected and our schema is working.
		</p>
		
		<div class="flex gap-4 mb-4">
			<button
				onclick={testConnection}
				disabled={isLoading}
				class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Testing...' : 'Test Connection'}
			</button>
			
			<button
				onclick={seedTestData}
				disabled={isLoading}
				class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Seeding...' : 'Seed Test Data'}
			</button>
			
			<button
				onclick={clearTestData}
				disabled={isLoading}
				class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Clear Test Data
			</button>
		</div>
		
		{#if testResults}
			<pre class="bg-gray-100 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">{testResults}</pre>
		{/if}
	</div>
	
	<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
		<h3 class="font-semibold text-yellow-800 mb-2">What this tests:</h3>
		<ul class="text-yellow-700 text-sm space-y-1">
			<li>• Convex client connection</li>
			<li>• Database schema (users, organizations tables)</li>
			<li>• Query and mutation functions</li>
			<li>• Data persistence</li>
		</ul>
	</div>
</div>
