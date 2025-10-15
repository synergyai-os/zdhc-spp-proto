<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	
	// Get Convex client
	const client = useConvexClient();
	
	// ==========================================
	// STATE
	// ==========================================
	
	let testResults = $state('');
	let isLoading = $state(false);
	
	// ==========================================
	// FUNCTIONS
	// ==========================================
	
	async function handleTestBasic() {
		try {
			isLoading = true;
			testResults = 'Testing basic functionality...\n';
			
			// Test getting organizations (we know this works)
			const orgs = await client.query(api.expertAssignments.getOrganizations, {});
			testResults += `✅ Organizations: ${orgs?.length || 0} found\n`;
			
			// Test getting users
			const users = await client.query(api.expertAssignments.getUsers, {});
			testResults += `✅ Users: ${users?.length || 0} found\n`;
			
			testResults += '\n🎉 Basic functionality working!';
		} catch (error) {
			testResults += `❌ Error: ${error}\n`;
		} finally {
			isLoading = false;
		}
	}
	
	async function handleTestServiceVersions() {
		try {
			isLoading = true;
			testResults = 'Testing service versions...\n';
			
			// Try to access serviceVersions functions
			testResults += 'Attempting to call serviceVersions functions...\n';
			
			// Test getting service parents
			const parents = await client.query((api as any).serviceVersions.getServiceParents, {});
			testResults += `✅ Service Parents: ${JSON.stringify(parents, null, 2)}\n`;
			
			// Test getting service versions
			const versions = await client.query((api as any).serviceVersions.getServiceVersions, {});
			testResults += `✅ Service Versions: ${JSON.stringify(versions, null, 2)}\n`;
			
		} catch (error) {
			testResults += `❌ Error testing service versions: ${error}\n`;
		} finally {
			isLoading = false;
		}
	}
	
	async function handleSeedData() {
		try {
			isLoading = true;
			testResults = 'Seeding data...\n';
			
			// Seed service data first
			const serviceResult = await client.mutation((api as any).serviceVersions.seedServiceData, {});
			testResults += `✅ Service data seeded: ${JSON.stringify(serviceResult, null, 2)}\n`;
			
			// Seed initial data
			const initialResult = await client.mutation(api.expertAssignments.seedInitialData, {});
			testResults += `✅ Initial data seeded: ${JSON.stringify(initialResult, null, 2)}\n`;
			
			testResults += '\n🎉 All data seeded successfully!';
		} catch (error) {
			testResults += `❌ Error seeding data: ${error}\n`;
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">🧪 Service Versioning Test</h1>
	
	<div class="space-y-6">
		<!-- Test Buttons -->
		<div class="bg-white p-4 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">🧪 Tests</h2>
			<div class="space-y-2">
				<button 
					onclick={handleTestBasic}
					disabled={isLoading}
					class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
				>
					{isLoading ? 'Testing...' : 'Test Basic Functions'}
				</button>
				
				<button 
					onclick={handleTestServiceVersions}
					disabled={isLoading}
					class="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
				>
					{isLoading ? 'Testing...' : 'Test Service Versions'}
				</button>
				
				<button 
					onclick={handleSeedData}
					disabled={isLoading}
					class="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
				>
					{isLoading ? 'Seeding...' : 'Seed Data'}
				</button>
			</div>
		</div>
		
		<!-- Results -->
		<div class="bg-white p-4 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">🔍 Test Results</h2>
			<pre class="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">{testResults || 'No tests run yet...'}</pre>
		</div>
	</div>
</div>

<style>
	.container {
		font-family: system-ui, -apple-system, sans-serif;
	}
</style>