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
	
	async function migrateExpertRoles() {
		isLoading = true;
		testResults = 'Running expert role migration...\n';
		
		try {
			const result = await client.mutation(api.expertAssignments.migrateExistingExpertRoles, {});
			testResults += `✅ ${result.message}\n`;
			testResults += `📊 Updated ${result.updatedCount} expert assignments\n`;
			testResults += '🎉 Migration completed successfully!';
			
		} catch (error: any) {
			testResults += `❌ Error: ${error.message}\n`;
			console.error('Migration error:', error);
		}
		
		isLoading = false;
	}
	
	async function seedServiceData() {
		isLoading = true;
		testResults = 'Seeding service data...\n';
		
		try {
			const result = await client.mutation(api.serviceVersions.seedServiceData, {});
			testResults += `✅ Created service parent with ID: ${result.parentId}\n`;
			testResults += `✅ Created ${result.versionIds.length} service versions\n`;
			testResults += '🎉 Service data seeded successfully!';
			
		} catch (error: any) {
			testResults += `❌ Error: ${error.message}\n`;
			console.error('Service seeding error:', error);
		}
		
		isLoading = false;
	}
	
	async function createTestExpertAssignments() {
		isLoading = true;
		testResults = 'Creating test expert assignments...\n';
		
		try {
			// First get some users and organizations
			const users = await client.query(api.expertAssignments.getUsers, {});
			const organizations = await client.query(api.expertAssignments.getOrganizations, {});
			const serviceVersions = await client.query(api.serviceVersions.getServiceVersions, {});
			
			if (users.length === 0 || organizations.length === 0 || serviceVersions.length === 0) {
				testResults += '❌ Need users, organizations, and service versions first!\n';
				testResults += 'Please run "Seed Test Data" and "Seed Service Data" first.\n';
				return;
			}
			
			// Create some test expert assignments
			const assignments = [];
			for (let i = 0; i < Math.min(3, users.length); i++) {
				const user = users[i];
				const org = organizations[i % organizations.length];
				const serviceVersion = serviceVersions[i % serviceVersions.length];
				
				const assignmentId = await client.mutation(api.expertAssignments.createExpertAssignment, {
					userId: user._id,
					organizationId: org._id,
					serviceVersionId: serviceVersion._id,
					role: i === 0 ? 'lead' : 'regular',
					experience: [{
						title: 'Senior Consultant',
						company: 'Test Company',
						location: 'Amsterdam',
						startDate: '2020-01-01',
						endDate: '2023-12-31',
						current: false,
						description: 'Test experience'
					}],
					education: [{
						school: 'Test University',
						degree: 'MSc Environmental Science',
						field: 'Environmental Science',
						startDate: '2018-09-01',
						endDate: '2020-06-30',
						description: 'Test education'
					}],
					assignedBy: 'test-user',
					notes: 'Test assignment for prototype'
				});
				
				assignments.push(assignmentId);
				testResults += `✅ Created assignment ${i + 1}: ${user.firstName} ${user.lastName} → ${serviceVersion.name}\n`;
			}
			
			testResults += `🎉 Created ${assignments.length} test expert assignments!`;
			
		} catch (error: any) {
			testResults += `❌ Error: ${error.message}\n`;
			console.error('Assignment creation error:', error);
		}
		
		isLoading = false;
	}
</script>

<div class="max-w-4xl mx-auto p-6">
	<h1 class="text-3xl font-bold text-gray-900 mb-6">Convex Database Test</h1>
	
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Database Management</h2>
		<p class="text-gray-600 mb-4">
			This page helps you manage your Convex database, test connections, and run migrations.
		</p>
		
		<div class="flex gap-4 mb-4 flex-wrap">
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
				onclick={seedServiceData}
				disabled={isLoading}
				class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Seeding...' : 'Seed Service Data'}
			</button>
			
			<button
				onclick={createTestExpertAssignments}
				disabled={isLoading}
				class="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Creating...' : 'Create Test Assignments'}
			</button>
			
			<button
				onclick={migrateExpertRoles}
				disabled={isLoading}
				class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Migrating...' : 'Migrate Expert Roles'}
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
		<h3 class="font-semibold text-yellow-800 mb-2">Available Operations:</h3>
		<ul class="text-yellow-700 text-sm space-y-1">
			<li>• <strong>Test Connection:</strong> Verify Convex is working</li>
			<li>• <strong>Seed Test Data:</strong> Create sample users and organizations</li>
			<li>• <strong>Seed Service Data:</strong> Create service parents and versions</li>
			<li>• <strong>Create Test Assignments:</strong> Create expert assignments with real service versions</li>
			<li>• <strong>Migrate Expert Roles:</strong> Set existing experts to "regular" role</li>
			<li>• <strong>Clear Test Data:</strong> Remove all test data</li>
		</ul>
		<div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
			<p class="text-blue-800 text-sm font-medium">💡 For checkout testing:</p>
			<p class="text-blue-700 text-sm">Run operations in order: Test Connection → Seed Test Data → Seed Service Data → Create Test Assignments</p>
		</div>
	</div>
</div>
