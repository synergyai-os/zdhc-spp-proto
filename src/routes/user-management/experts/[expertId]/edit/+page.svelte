<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../../../convex/_generated/api';
	import { page } from '$app/stores';
	
	// Get expert ID from URL params
	const expertId = $derived($page.params.expertId);
	
	// Get Convex client
	const client = useConvexClient();
	
	// Query expert assignment data
	const expertAssignment = useQuery(
		api.expertAssignments.getExpertAssignmentById,
		() => expertId ? { id: expertId as any } : { id: "" as any }
	);
	
	// Cast the data to our interface type
	let assignmentData = $derived(expertAssignment?.data as any);
	
	// Query user data if assignment exists
	const userData = useQuery(
		api.expertAssignments.getUserById,
		() => expertAssignment?.data?.userId ? { id: expertAssignment.data.userId } : { id: "" as any }
	);
	
	// Loading and error states
	let isLoading = $derived(expertAssignment?.isLoading || userData?.isLoading || false);
	let hasError = $derived(expertAssignment?.error || userData?.error || false);
	
	function goBack() {
		window.history.back();
	}
	
	function handleSave() {
		console.log('Save functionality will be implemented');
		// TODO: Implement save functionality
	}
</script>

<svelte:head>
	<title>Edit Expert Profile - SPP</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
	<div class="max-w-4xl mx-auto px-6">
		
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">Edit Expert Profile</h1>
					<p class="text-gray-600">Complete or update expert profile information</p>
				</div>
				<button
					type="button"
					onclick={goBack}
					class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
				>
					← Back
				</button>
			</div>
		</div>

		{#if isLoading}
			<!-- Loading State -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p class="text-gray-600">Loading expert profile...</p>
			</div>
		{:else if hasError}
			<!-- Error State -->
			<div class="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
				<svg class="w-12 h-12 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<h2 class="text-xl font-semibold text-red-800 mb-2">Error Loading Profile</h2>
				<p class="text-red-600 mb-4">Could not load expert profile data</p>
				<button
					type="button"
					onclick={() => window.location.reload()}
					class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
				>
					Try Again
				</button>
			</div>
		{:else if !assignmentData}
			<!-- Not Found -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
				</svg>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">Expert Not Found</h2>
				<p class="text-gray-600 mb-4">The requested expert profile could not be found</p>
				<a href="/user-management" class="text-blue-600 hover:text-blue-800 font-medium">
					Back to User Management →
				</a>
			</div>
		{:else}
			<!-- Edit Form Content -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
				
				<!-- Expert Info Header -->
				<div class="mb-8">
					<div class="flex items-center">
						<div class="flex-shrink-0 h-16 w-16">
							<div class="h-16 w-16 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl">
								{userData?.data ? `${userData.data.firstName?.[0] || ''}${userData.data.lastName?.[0] || ''}` : '?'}
							</div>
						</div>
						<div class="ml-6">
							<h2 class="text-2xl font-bold text-gray-900">
								{userData?.data ? `${userData.data.firstName || ''} ${userData.data.lastName || ''}`.trim() || userData.data.email : 'Unknown User'}
							</h2>
							<p class="text-gray-600">{userData?.data?.email}</p>
							<div class="mt-2 flex items-center space-x-4">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
									assignmentData.isProfileComplete 
										? 'bg-green-100 text-green-800' 
										: 'bg-blue-100 text-blue-800'
								}">
									{assignmentData.isProfileComplete ? 'Complete' : `Draft - Step ${assignmentData.profileCompletionStep || 0}/5`}
								</span>
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
									userData?.data?.isActive 
										? 'bg-green-100 text-green-800' 
										: 'bg-red-100 text-red-800'
								}">
									{userData?.data?.isActive ? 'Active' : 'Invited'}
								</span>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Placeholder Content -->
				<div class="space-y-8">
					
					<!-- Basic Information Section -->
					<div class="border-b border-gray-200 pb-8">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
								<input 
									id="firstName"
									type="text" 
									value={userData?.data?.firstName || ''} 
									disabled 
									class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
								/>
								<p class="text-xs text-gray-500 mt-1">This information is managed in PDC</p>
							</div>
							<div>
								<label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
								<input 
									id="lastName"
									type="text" 
									value={userData?.data?.lastName || ''} 
									disabled 
									class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
								/>
								<p class="text-xs text-gray-500 mt-1">This information is managed in PDC</p>
							</div>
							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
								<input 
									id="email"
									type="email" 
									value={userData?.data?.email || ''} 
									disabled 
									class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
								/>
								<p class="text-xs text-gray-500 mt-1">This information is managed in PDC</p>
							</div>
							<div>
								<label for="country" class="block text-sm font-medium text-gray-700 mb-2">Country</label>
								<input 
									id="country"
									type="text" 
									value={userData?.data?.country || ''} 
									disabled 
									class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
								/>
								<p class="text-xs text-gray-500 mt-1">This information is managed in PDC</p>
							</div>
						</div>
					</div>
					
					<!-- Services Section -->
					<div class="border-b border-gray-200 pb-8">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Service Assignments</h3>
						<div class="space-y-3">
							{#if assignmentData.serviceVersion}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<span class="font-medium text-gray-900">{assignmentData.serviceVersion.name}</span>
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
										assignmentData.role === 'lead' 
											? 'bg-yellow-100 text-yellow-800' 
											: 'bg-blue-100 text-blue-800'
									}">
										{assignmentData.role === 'lead' ? 'Lead Expert' : 'Regular Expert'}
									</span>
								</div>
							{:else}
								<p class="text-gray-500 italic">No service assignment found</p>
							{/if}
						</div>
					</div>
					
					<!-- Experience Section -->
					<div class="border-b border-gray-200 pb-8">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Professional Experience</h3>
						{#if assignmentData.experience && assignmentData.experience.length > 0}
							<div class="space-y-4">
								{#each assignmentData.experience as exp}
									<div class="p-4 bg-gray-50 rounded-lg">
										<div class="font-medium text-gray-900">{exp.title}</div>
										<div class="text-sm text-gray-600">{exp.company} • {exp.location}</div>
										<div class="text-sm text-gray-500">
											{exp.startDate} - {exp.current ? 'Present' : exp.endDate}
										</div>
										{#if exp.description}
											<div class="text-sm text-gray-700 mt-2">{exp.description}</div>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-gray-500 italic">No experience information available</p>
						{/if}
					</div>
					
					<!-- Education Section -->
					<div class="pb-8">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Education</h3>
						{#if assignmentData.education && assignmentData.education.length > 0}
							<div class="space-y-4">
								{#each assignmentData.education as edu}
									<div class="p-4 bg-gray-50 rounded-lg">
										<div class="font-medium text-gray-900">{edu.school}</div>
										{#if edu.degree}
											<div class="text-sm text-gray-600">{edu.degree} in {edu.field}</div>
										{/if}
										{#if edu.endDate}
											<div class="text-sm text-gray-500">Graduated: {edu.endDate}</div>
										{/if}
										{#if edu.description}
											<div class="text-sm text-gray-700 mt-2">{edu.description}</div>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-gray-500 italic">No education information available</p>
						{/if}
					</div>
				</div>
				
				<!-- Action Buttons -->
				<div class="flex items-center justify-between pt-8 border-t border-gray-200">
					<div class="text-sm text-gray-500">
						{#if !assignmentData.isProfileComplete}
							<span class="text-blue-600 font-medium">Profile is incomplete</span> - Complete all sections to enable payment processing
						{:else}
							<span class="text-green-600 font-medium">Profile is complete</span> - Ready for payment processing
						{/if}
					</div>
					<div class="flex items-center space-x-4">
						<button
							type="button"
							onclick={goBack}
							class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onclick={handleSave}
							class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							{#if !assignmentData.isProfileComplete}
								Complete Profile
							{:else}
								Update Profile
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
