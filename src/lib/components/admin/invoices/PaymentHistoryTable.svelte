<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import type { Id } from '../../../../convex/_generated/dataModel';

	// Filter state
	let startDate = $state<number | undefined>(undefined);
	let endDate = $state<number | undefined>(undefined);
	let selectedOrgId = $state<Id<'organizations'> | undefined>(undefined);
	let paymentType = $state<'annual_fee' | 'cv_review' | undefined>(undefined);

	// Get payment history with filters
	const historyData = useQuery(api.invoices.getPaymentHistory, () => ({
		startDate,
		endDate,
		organizationId: selectedOrgId,
		paymentType
	}));

	// Get organizations for filter dropdown
	const organizationsData = useQuery(api.utilities.getOrganizations, {});

	let isLoading = $derived(!historyData || historyData.isLoading);

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDateShort(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function handleStartDateChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.value) {
			startDate = new Date(target.value).getTime();
		} else {
			startDate = undefined;
		}
	}

	function handleEndDateChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.value) {
			// Set to end of day
			endDate = new Date(target.value).setHours(23, 59, 59, 999);
		} else {
			endDate = undefined;
		}
	}

	function clearFilters() {
		startDate = undefined;
		endDate = undefined;
		selectedOrgId = undefined;
		paymentType = undefined;
	}
</script>

<div class="space-y-4">
	<!-- Filters -->
	<div class="bg-white rounded-lg border border-gray-200 p-4">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<!-- Start Date -->
			<div>
				<label class="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
				<input
					type="date"
					onchange={handleStartDateChange}
					class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- End Date -->
			<div>
				<label class="block text-xs font-medium text-gray-700 mb-1">End Date</label>
				<input
					type="date"
					onchange={handleEndDateChange}
					class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Organization Filter -->
			<div>
				<label class="block text-xs font-medium text-gray-700 mb-1">Organization</label>
				<select
					bind:value={selectedOrgId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value={undefined}>All Organizations</option>
					{#if organizationsData?.data}
						{#each organizationsData.data as org}
							<option value={org._id}>{org.name}</option>
						{/each}
					{/if}
				</select>
			</div>

			<!-- Payment Type Filter -->
			<div>
				<label class="block text-xs font-medium text-gray-700 mb-1">Payment Type</label>
				<select
					bind:value={paymentType}
					class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value={undefined}>All Types</option>
					<option value="annual_fee">Annual Fee</option>
					<option value="cv_review">CV Review</option>
				</select>
			</div>
		</div>

		<!-- Clear Filters Button -->
		{#if startDate || endDate || selectedOrgId || paymentType}
			<div class="mt-4">
				<button
					type="button"
					onclick={clearFilters}
					class="text-sm text-blue-600 hover:text-blue-800 font-medium"
				>
					Clear Filters
				</button>
			</div>
		{/if}
	</div>

	<!-- History Table -->
	{#if isLoading}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
			<div class="text-gray-500">Loading payment history...</div>
		</div>
	{:else if !historyData?.data || historyData.data.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
			<div class="text-gray-500">No payment history found</div>
		</div>
	{:else}
		<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Date Paid
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Type
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Organization/Expert
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Service/Details
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Amount
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Payment Reference
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each historyData.data as payment}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{formatDate(payment.paidAt)}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if payment.type === 'annual_fee'}
									<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
										Annual Fee
									</span>
								{:else}
									<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
										CV Review
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if payment.type === 'annual_fee'}
									<div class="text-sm font-medium text-gray-900">{payment.organization?.name || '—'}</div>
								{:else}
									<div class="text-sm font-medium text-gray-900">
										{payment.user
											? `${payment.user.firstName} ${payment.user.lastName}`
											: '—'}
									</div>
									<div class="text-xs text-gray-500">{payment.organization?.name || '—'}</div>
								{/if}
							</td>
							<td class="px-6 py-4">
								{#if payment.type === 'annual_fee'}
									<div class="text-sm text-gray-900">{payment.serviceVersion?.name || '—'}</div>
									<div class="text-xs text-gray-500">{payment.serviceParent?.name || '—'}</div>
								{:else}
									<div class="text-sm text-gray-900">
										{payment.servicesCount || 0} service{(payment.servicesCount || 0) !== 1 ? 's' : ''}
									</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">
									€{payment.paymentAmount.toFixed(2)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-mono text-gray-600">
									{payment.paymentReference || '—'}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if payment.type === 'annual_fee'}
									{#if payment.status === 'expired'}
										<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
											Expired
										</span>
									{:else}
										<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
											Active
										</span>
									{/if}
								{:else}
									<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
										Paid
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

