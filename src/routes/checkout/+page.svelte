<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import { organizationStore } from '$lib/stores/organization.svelte';
	import { checkoutStore, type CheckoutExpert } from '$lib/stores/checkout.svelte';
	import ExpertCheckoutCard from '$lib/components/ExpertCheckoutCard.svelte';
	import PaymentMethodSelector from '$lib/components/PaymentMethodSelector.svelte';
	import PaymentSummary from '$lib/components/PaymentSummary.svelte';
	
	// Organization context
	let currentOrgId = $state<string | null>(null);
	let orgContext = $derived($organizationStore);
	
	// Update currentOrgId when organization changes
	$effect(() => {
		currentOrgId = orgContext.currentOrganization?._id || null;
	});
	
	// Get draft experts for current organization with full details
	const draftExperts = useQuery(
		api.expertAssignments.getExpertAssignmentsByStatusWithDetails,
		() => currentOrgId ? { organizationId: currentOrgId as any, status: "draft" as const } : { organizationId: "" as any, status: "draft" as const }
	);
	
	// Store state
	let storeState = $derived($checkoutStore);
	let isLoading = $derived(storeState.isLoading);
	let error = $derived(storeState.error);
	
	// Group experts by user for display
	let groupedExperts = $derived.by(() => {
		if (!draftExperts?.data) return [];
		
		// Group assignments by user ID
		const userGroups = new Map();
		
		draftExperts.data.forEach((assignment: any) => {
			if (!assignment.user) return;
			
			const userId = assignment.user._id;
			if (!userGroups.has(userId)) {
				userGroups.set(userId, {
					userId: assignment.userId,
					userName: assignment.user 
						? `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim() || assignment.user.email
						: 'Unknown User',
					userEmail: assignment.user?.email || 'unknown@example.com',
					isUserVerified: assignment.user?.isActive || false,
					isProfileComplete: assignment.isProfileComplete || false,
					profileCompletionStep: assignment.profileCompletionStep || 0,
					assignments: [],
					totalPrice: 0
				});
			}
			
			const serviceAssignment = {
				assignmentId: assignment._id,
				serviceVersionName: assignment.serviceVersion?.name || 'Unknown Service',
				serviceParentName: assignment.serviceParent?.name || 'Unknown Category',
				role: assignment.role || 'regular',
				price: 100, // Hardcoded €100 per service version
			};
			
			userGroups.get(userId).assignments.push(serviceAssignment);
			userGroups.get(userId).totalPrice += serviceAssignment.price;
		});
		
		return Array.from(userGroups.values());
	});
	
	// Separate complete and incomplete profiles
	let completeProfiles = $derived(groupedExperts.filter(expert => expert.isProfileComplete));
	let incompleteProfiles = $derived(groupedExperts.filter(expert => !expert.isProfileComplete));
	
	// Initialize checkout store with flattened experts data for selection logic (only complete profiles)
	$effect(() => {
		if (draftExperts?.data && currentOrgId) {
			// Only include assignments with complete profiles
			const completeAssignments = draftExperts.data.filter((assignment: any) => assignment.isProfileComplete);
			
			const checkoutExperts: CheckoutExpert[] = completeAssignments.map((assignment: any) => ({
				assignmentId: assignment._id,
				userId: assignment.userId,
				userName: assignment.user 
					? `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim() || assignment.user.email
					: 'Unknown User',
				userEmail: assignment.user?.email || 'unknown@example.com',
				serviceVersionName: assignment.serviceVersion?.name || 'Unknown Service',
				serviceParentName: assignment.serviceParent?.name || 'Unknown Category',
				role: assignment.role || 'regular',
				price: 100, // Hardcoded €100 per service version
				isUserVerified: assignment.user?.isActive || false,
			}));
			
			checkoutStore.initializeExperts(checkoutExperts);
		}
	});
	
	// Navigation functions
	function proceedToPayment() {
		if (storeState.selectedExpertIds.length > 0) {
			window.location.href = '/checkout/payment';
		}
	}
	
	function goBack() {
		window.history.back();
	}
	
	// Get verification summary
	let verificationSummary = $derived(checkoutStore.getVerificationSummary());
</script>

<div class="bg-gray-50 min-h-screen py-8">
	<div class="max-w-6xl mx-auto px-6">
		
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
					<p class="text-gray-600">Select experts and process payment for service assignments</p>
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

		{#if !currentOrgId}
			<!-- No Organization Selected -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
				</svg>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">No Organization Selected</h2>
				<p class="text-gray-600 mb-4">Please select an organization to view and pay for experts</p>
				<a href="/user-management" class="text-blue-600 hover:text-blue-800 font-medium">
					Go to User Management →
				</a>
			</div>
		{:else if draftExperts?.isLoading}
			<!-- Loading State -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p class="text-gray-600">Loading draft experts...</p>
			</div>
		{:else if draftExperts?.error}
			<!-- Error State -->
			<div class="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
				<svg class="w-12 h-12 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<h2 class="text-xl font-semibold text-red-800 mb-2">Error Loading Experts</h2>
				<p class="text-red-600 mb-4">{draftExperts.error.message}</p>
				<button
					type="button"
					onclick={() => window.location.reload()}
					class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
				>
					Try Again
				</button>
			</div>
		{:else if !draftExperts?.data || draftExperts.data.length === 0}
			<!-- No Draft Experts -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
				</svg>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">No Draft Experts</h2>
				<p class="text-gray-600 mb-4">You don't have any experts in draft status ready for payment</p>
				<a href="/user-management/add-expert" class="text-blue-600 hover:text-blue-800 font-medium">
					Add New Expert →
				</a>
			</div>
		{:else if completeProfiles.length === 0}
			<!-- No Complete Profiles -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<svg class="w-12 h-12 mx-auto mb-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">No Complete Profiles</h2>
				<p class="text-gray-600 mb-4">You have {incompleteProfiles.length} expert{incompleteProfiles.length !== 1 ? 's' : ''} with incomplete profiles. Complete their profiles before proceeding to payment.</p>
				<a href="/user-management" class="text-blue-600 hover:text-blue-800 font-medium">
					Complete Profiles →
				</a>
			</div>
		{:else}
			<!-- Main Checkout Content -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				
				<!-- Left Column: Expert Selection -->
				<div class="lg:col-span-2 space-y-6">
					
					<!-- Verification Summary -->
					{#if verificationSummary.unverified > 0}
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div class="flex items-start">
								<svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
								</svg>
								<div>
									<h3 class="text-sm font-medium text-yellow-800">Account Verification Required</h3>
									<p class="text-sm text-yellow-700 mt-1">
										{verificationSummary.unverified} expert{verificationSummary.unverified !== 1 ? 's' : ''} need{verificationSummary.unverified === 1 ? 's' : ''} to verify their account before payment can be processed.
									</p>
								</div>
							</div>
						</div>
					{/if}
					
					<!-- Incomplete Profiles Warning -->
					{#if incompleteProfiles.length > 0}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div class="flex items-start">
								<svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
								</svg>
								<div>
									<h3 class="text-sm font-medium text-blue-800">Incomplete Profiles</h3>
									<p class="text-sm text-blue-700 mt-1">
										{incompleteProfiles.length} expert{incompleteProfiles.length !== 1 ? 's' : ''} have incomplete profiles and cannot proceed to payment. Complete their profiles first.
									</p>
									<div class="mt-2">
										<a href="/user-management" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
											Complete Profiles →
										</a>
									</div>
								</div>
							</div>
						</div>
					{/if}
					
					<!-- Expert Selection Header -->
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-xl font-semibold text-gray-900">Select Experts for Payment</h2>
							{#if verificationSummary.verified > 0}
								<div class="flex items-center space-x-2">
									<button
										type="button"
											onclick={() => {
												// Select all verified expert groups
												groupedExperts.forEach((expertGroup: any) => {
													if (expertGroup.isUserVerified) {
														expertGroup.assignments.forEach((assignment: any) => {
															if (!storeState.selectedExpertIds.includes(assignment.assignmentId)) {
																checkoutStore.toggleExpertSelection(assignment.assignmentId);
															}
														});
													}
												});
											}}
										class="text-sm text-blue-600 hover:text-blue-800 font-medium"
									>
										Select All Verified
									</button>
									<span class="text-gray-300">|</span>
									<button
										type="button"
										onclick={() => checkoutStore.clearAllSelections()}
										class="text-sm text-gray-600 hover:text-gray-800 font-medium"
									>
										Clear All
									</button>
								</div>
							{/if}
						</div>
						
						<div class="text-sm text-gray-600 mb-4">
							{groupedExperts.filter(g => g.isUserVerified).length} verified expert{groupedExperts.filter(g => g.isUserVerified).length !== 1 ? 's' : ''}, {groupedExperts.filter(g => !g.isUserVerified).length} pending verification
						</div>
					</div>
					
					<!-- Expert Cards (Grouped by User) -->
					<div class="space-y-4">
						{#each groupedExperts as expertGroup (expertGroup.userId)}
							<div class="border border-gray-200 rounded-lg p-4 transition-all duration-200 {
								!expertGroup.isUserVerified ? 'bg-gray-50 border-gray-300 opacity-60' : 
								expertGroup.assignments.some((a: any) => storeState.selectedExpertIds.includes(a.assignmentId)) ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300 hover:bg-gray-50'
							}">
								<div class="flex items-start space-x-4">
									<!-- Checkbox for entire user group -->
									<div class="flex-shrink-0 pt-1">
										<input
											type="checkbox"
											checked={expertGroup.assignments.every((a: any) => storeState.selectedExpertIds.includes(a.assignmentId))}
											disabled={!expertGroup.isUserVerified}
											onchange={() => {
												const allSelected = expertGroup.assignments.every((a: any) => storeState.selectedExpertIds.includes(a.assignmentId));
												if (allSelected) {
													// Deselect all assignments for this user
													expertGroup.assignments.forEach((a: any) => {
														if (storeState.selectedExpertIds.includes(a.assignmentId)) {
															checkoutStore.toggleExpertSelection(a.assignmentId);
														}
													});
												} else {
													// Select all assignments for this user
													expertGroup.assignments.forEach((a: any) => {
														if (!storeState.selectedExpertIds.includes(a.assignmentId)) {
															checkoutStore.toggleExpertSelection(a.assignmentId);
														}
													});
												}
											}}
											class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
										/>
									</div>
									
									<!-- Expert Info -->
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<!-- Expert Name and Email -->
												<div class="mb-2">
													<h3 class="text-lg font-semibold text-gray-900 {
														!expertGroup.isUserVerified ? 'text-gray-500' : ''
													}">
														{expertGroup.userName}
													</h3>
													<p class="text-sm text-gray-600 {!expertGroup.isUserVerified ? 'text-gray-400' : ''}">
														{expertGroup.userEmail}
													</p>
												</div>
												
												<!-- Service Assignments -->
												<div class="mb-3">
													<div class="text-sm font-medium text-gray-700 mb-2 {!expertGroup.isUserVerified ? 'text-gray-500' : ''}">
														Service Assignments ({expertGroup.assignments.length}):
													</div>
													<div class="space-y-2">
														{#each expertGroup.assignments as assignment}
															<div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg {
																!expertGroup.isUserVerified ? 'bg-gray-100' : ''
															}">
																<div class="flex items-center space-x-2">
																	<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium {
																		!expertGroup.isUserVerified ? 'bg-gray-200 text-gray-600' : ''
																	}">
																		{assignment.serviceVersionName}
																	</span>
																	{#if assignment.role === 'lead'}
																		<span class="px-1.5 py-0.5 text-xs rounded-full bg-yellow-200 text-yellow-800 font-semibold {
																			!expertGroup.isUserVerified ? 'opacity-50' : ''
																		}">
																			LEAD
																		</span>
																	{/if}
																</div>
																<span class="text-sm font-medium text-gray-900 {
																	!expertGroup.isUserVerified ? 'text-gray-500' : ''
																}">
																	€{assignment.price.toFixed(2)}
																</span>
															</div>
														{/each}
													</div>
												</div>
												
												<!-- Verification Status -->
												{#if !expertGroup.isUserVerified}
													<div class="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
														<svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
														</svg>
														<span class="text-sm font-medium text-yellow-800">
															Expert account not verified
														</span>
													</div>
												{/if}
											</div>
											
											<!-- Total Price for this user -->
											<div class="flex-shrink-0 text-right">
												<div class="text-lg font-bold text-gray-900 {
													!expertGroup.isUserVerified ? 'text-gray-500' : ''
												}">
													€{expertGroup.totalPrice.toFixed(2)}
												</div>
												<div class="text-xs text-gray-500 {!expertGroup.isUserVerified ? 'text-gray-400' : ''}">
													total
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				
				<!-- Right Column: Payment Summary & Method -->
				<div class="space-y-6">
					
					<!-- Payment Summary -->
					<PaymentSummary />
					
					<!-- Payment Method Selection -->
					{#if storeState.selectedExpertIds.length > 0}
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<PaymentMethodSelector />
						</div>
					{/if}
					
					<!-- Proceed Button -->
					{#if storeState.selectedExpertIds.length > 0}
						<button
							type="button"
							onclick={proceedToPayment}
							disabled={isLoading}
							class="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
						>
							{isLoading ? 'Processing...' : 'Proceed to Payment'}
						</button>
					{:else}
						<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
							<p class="text-sm text-gray-500">Select experts to proceed</p>
						</div>
					{/if}
					
					<!-- Pricing Info -->
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div class="flex items-start">
							<svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
							</svg>
							<div>
								<h3 class="text-sm font-medium text-blue-800">Pricing Information</h3>
								<p class="text-sm text-blue-700 mt-1">
									€100 per service version per expert. This covers training, certification, and ongoing support.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
