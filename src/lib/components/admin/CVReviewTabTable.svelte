<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { CVStatus } from '../../../convex/model/status';
	import { CV_STATUS_VALUES, getCVStatusColor, getCVStatusDisplayName } from '../../../convex/model/status';
	import PaymentConfirmationButton from './PaymentConfirmationButton.svelte';
	import CVStageAdvancer from './CVStageAdvancer.svelte';

	interface ExpertForReview {
		userId: string;
		user: {
			_id: string;
			firstName: string;
			lastName: string;
			email: string;
			country: string;
		};
		cvs: Array<{
			_id: string;
			version: number;
			status: CVStatus;
			createdAt: number;
			submittedAt?: number;
			lockedAt?: number;
			assignments: Array<{
				_id: string;
				status: 'pending_review' | 'approved' | 'rejected' | 'inactive';
				serviceVersion: {
					name: string;
					version: string;
				};
				organization: {
					name: string;
				};
			}>;
			pendingAssignments: Array<any>;
			approvedAssignments: Array<any>;
			rejectedAssignments: Array<any>;
		}>;
		organizations: string[];
		pendingCount: number;
		lastUpdated: number;
		totalCVs: number;
		latestCV: any;
	}

	interface Props {
		onViewCV: (userId: string) => void;
		statusFilter?: CVStatus | CVStatus[];
		tabName: string;
	}

	let { onViewCV, statusFilter, tabName }: Props = $props();

	const client = useConvexClient();

	// Filter state (only used when statusFilter is not provided - i.e., "All CVs" tab)
	let localStatusFilter = $state<CVStatus | ''>('');
	let organizationFilter = $state<string>('');
	let searchTerm = $state<string>('');

	// Query data - pass filters to backend when on "All CVs" tab
	const expertsData = useQuery(api.adminCVReview.getExpertsForCVReview, () => {
		// If statusFilter prop is provided (from parent), don't use local filters
		// Otherwise, use local filters for "All CVs" tab
		if (statusFilter) {
			return {};
		}
		return {
			status: localStatusFilter || undefined,
			organizationId: organizationFilter ? (organizationFilter as any) : undefined,
			searchTerm: searchTerm || undefined
		};
	});

	console.log(`🔍 ${tabName} experts data:`, expertsData?.data);

	// Get organizations for filter dropdown
	const organizationsData = useQuery(api.adminCVReview.getOrganizationsForFilter, {});

	const organizations = $derived(organizationsData?.data || []);

	// Clear filters function
	const clearFilters = () => {
		localStatusFilter = '';
		organizationFilter = '';
		searchTerm = '';
	};

	// Filter experts based on status
	// Backend already returns one row per user-organization combination
	// When filtering, we show the matching CV (not necessarily the latest)
	let experts = $derived(() => {
		const allExperts = expertsData?.data || [];
		if (!statusFilter) return allExperts;
		
		const statusArray = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
		
		// Filter and update latestCV to show the matching CV
		return allExperts
			.filter(expert => {
				// Check if any CV matches the status filter
				return expert.cvs.some((cv: any) => statusArray.includes(cv.status));
			})
			.map(expert => {
				// Find the matching CVs and use the latest matching CV as the display CV
				const matchingCVs = expert.cvs.filter((cv: any) => statusArray.includes(cv.status));
				if (matchingCVs.length > 0) {
					const latestMatchingCV = matchingCVs.sort((a: any, b: any) => b.version - a.version)[0];
					return {
						...expert,
						latestCV: latestMatchingCV,
						// Update pending count for the matching CV
						pendingCount: latestMatchingCV.pendingAssignments?.length || 0,
						// Update lastUpdated to matching CV's timestamp
						lastUpdated: Math.max(
							latestMatchingCV.createdAt || 0,
							latestMatchingCV.submittedAt || 0,
							latestMatchingCV.paidAt || 0,
							latestMatchingCV.lockedAt || 0
						)
					};
				}
				return expert;
			});
	});

	const formatDate = (timestamp: number): string => {
		return new Date(timestamp).toLocaleDateString();
	};

	const handleRowClick = (userId: string) => {
		onViewCV(userId);
	};

	const getStatusColor = (status: string): string => {
		return getCVStatusColor(status as CVStatus);
	};

	const handlePaymentConfirmed = () => {
		console.log('Payment confirmed, data will refresh automatically');
	};

	const handleStageAdvanced = () => {
		console.log('Stage advanced, data will refresh automatically');
	};
</script>

<div class="space-y-6">
	<!-- Filters (only show on "All CVs" tab when no statusFilter prop) -->
	{#if !statusFilter}
		<div class="bg-white border border-gray-200 rounded-lg p-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-900">Filters</h3>
				{#if localStatusFilter || organizationFilter || searchTerm}
					<button
						type="button"
						onclick={clearFilters}
						class="text-sm text-gray-500 hover:text-gray-700 underline"
					>
						Clear All Filters
					</button>
				{/if}
			</div>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<!-- Status Filter -->
				<div>
					<label for="status-filter" class="block text-sm font-medium text-gray-700 mb-2">
						Status
					</label>
					<select
						id="status-filter"
						bind:value={localStatusFilter}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">All Statuses</option>
						{#each CV_STATUS_VALUES as status}
							<option value={status}>{getCVStatusDisplayName(status)}</option>
						{/each}
					</select>
				</div>

				<!-- Organization Filter -->
				<div>
					<label for="org-filter" class="block text-sm font-medium text-gray-700 mb-2">
						Organization
					</label>
					<select
						id="org-filter"
						bind:value={organizationFilter}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">All Organizations</option>
						{#each organizations as org}
							<option value={org._id}>{org.name}</option>
						{/each}
					</select>
				</div>

				<!-- Search -->
				<div>
					<label for="search" class="block text-sm font-medium text-gray-700 mb-2">
						Search Expert
					</label>
					<input
						id="search"
						type="text"
						bind:value={searchTerm}
						placeholder="Name or email..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Clear Filters Button -->
				<div class="flex items-end">
					{#if localStatusFilter || organizationFilter || searchTerm}
						<button
							type="button"
							onclick={clearFilters}
							class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Clear Filters
						</button>
					{/if}
				</div>
			</div>

			<!-- Active Filter Indicator -->
			{#if localStatusFilter || organizationFilter || searchTerm}
				<div class="mt-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
					</svg>
					<span>
						Filtered by:
						{#if localStatusFilter}
							<strong>Status: {getCVStatusDisplayName(localStatusFilter)}</strong>
						{/if}
						{#if organizationFilter}
							{localStatusFilter ? ', ' : ''}
							<strong>Organization: {organizations.find(o => o._id === organizationFilter)?.name || 'Unknown'}</strong>
						{/if}
						{#if searchTerm}
							{(localStatusFilter || organizationFilter) ? ', ' : ''}
							<strong>Search: "{searchTerm}"</strong>
						{/if}
					</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Loading State -->
	{#if expertsData?.isLoading}
		<div class="text-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p class="text-gray-500">Loading experts...</p>
		</div>
	{:else if expertsData?.error}
		<div class="text-center py-12">
			<svg
				class="w-12 h-12 text-red-300 mx-auto mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
				/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
			<p class="text-gray-500">{expertsData.error}</p>
		</div>
	{:else if experts().length === 0}
		<div class="text-center py-12">
			<svg
				class="w-12 h-12 text-gray-300 mx-auto mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No Experts Found</h3>
			<p class="text-gray-500">No experts in {tabName}.</p>
		</div>
	{:else}
		<!-- Experts Table -->
		<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Expert
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Organization
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Services
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Pending
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Last Updated
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each experts() as expert (expert.userId + '-' + (expert.latestCV?._id || 'no-cv'))}
							<tr
								class="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
								onclick={() => handleRowClick(expert.userId)}
							>
								<!-- Expert Info -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div
											class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"
										>
											<span class="text-sm font-medium text-gray-700">
												{expert.user.firstName[0]}{expert.user.lastName[0]}
											</span>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">
												{expert.user.firstName}
												{expert.user.lastName}
											</div>
											<div class="text-sm text-gray-500">{expert.user.email}</div>
											<div class="text-xs text-gray-400">{expert.user.country}</div>
										</div>
									</div>
								</td>

								<!-- Organization -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{expert.organizations.join(', ')}
									</div>
								</td>

								<!-- Services -->
								<td class="px-6 py-4">
									<div class="flex flex-wrap gap-1">
										{#each expert.latestCV?.assignments || [] as assignment}
											<span
												class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(
													assignment.status
												)}"
											>
												{assignment.serviceVersion?.name || 'Unknown Service'}
											</span>
										{/each}
									</div>
								</td>

								<!-- Pending Count -->
								<td class="px-6 py-4 whitespace-nowrap">
									{#if expert.pendingCount > 0}
										<span
											class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
										>
											{expert.pendingCount} pending
										</span>
									{:else}
										<span class="text-sm text-gray-500">None</span>
									{/if}
								</td>

								<!-- Last Updated -->
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(expert.lastUpdated)}
								</td>

								<!-- Actions -->
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div class="flex items-center gap-2">
										<button
											type="button"
											onclick={(e) => {
												e.stopPropagation();
												handleRowClick(expert.userId);
											}}
											class="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
										>
											View CV
										</button>
										<PaymentConfirmationButton 
											cvStatus={expert.latestCV?.status}
											cvId={expert.latestCV?._id}
											onPaymentConfirmed={handlePaymentConfirmed}
										/>
										<CVStageAdvancer 
											cvStatus={expert.latestCV?.status}
											cvId={expert.latestCV?._id}
											onStageAdvanced={handleStageAdvanced}
										/>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Results Summary -->
		<div class="text-sm text-gray-500 text-center py-4">
			Showing {experts().length} expert{experts().length !== 1 ? 's' : ''} in {tabName}
		</div>
	{/if}
</div>

