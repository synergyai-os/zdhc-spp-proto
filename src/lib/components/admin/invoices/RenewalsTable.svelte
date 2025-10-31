<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import type { Id } from '../../../../convex/_generated/dataModel';

	const client = useConvexClient();

	// Get upcoming renewals
	const renewalsData = useQuery(api.invoices.getUpcomingRenewals, {});

	let isLoading = $derived(!renewalsData || renewalsData.isLoading);

	// Group renewals by urgency
	let renewalsByUrgency = $derived.by(() => {
		if (!renewalsData?.data) return { urgent: [], warning: [], upcoming: [] };

		return {
			urgent: renewalsData.data.filter((r) => r.urgency === 'urgent'),
			warning: renewalsData.data.filter((r) => r.urgency === 'warning'),
			upcoming: renewalsData.data.filter((r) => r.urgency === 'upcoming')
		};
	});

	// State for actions
	let sendingInvoice = $state<Id<'organizationServiceApprovals'> | null>(null);
	let confirmingPayment = $state<Id<'organizationServiceApprovals'> | null>(null);
	let isProcessing = $state(false);

	function formatDate(timestamp?: number): string {
		if (!timestamp) return '—';
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getUrgencyBadgeColor(urgency: string): string {
		switch (urgency) {
			case 'urgent':
				return 'bg-red-100 text-red-800';
			case 'warning':
				return 'bg-yellow-100 text-yellow-800';
			case 'upcoming':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getUrgencyLabel(urgency: string): string {
		switch (urgency) {
			case 'urgent':
				return 'Urgent';
			case 'warning':
				return 'Warning';
			case 'upcoming':
				return 'Upcoming';
			default:
				return urgency;
		}
	}

	async function sendInvoice(approvalId: Id<'organizationServiceApprovals'>) {
		if (isProcessing) return;

		isProcessing = true;
		try {
			// Generate payment reference (simulating invoice sent)
			const paymentReference = `RENEWAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			// Set payment reference without processing payment
			await client.mutation(api.invoices.setInvoicePaymentReference, {
				approvalId,
				paymentReference
			});

			sendingInvoice = null;
		} catch (error) {
			console.error('Failed to send invoice:', error);
			alert(`Failed to send invoice: ${error}`);
		} finally {
			isProcessing = false;
		}
	}

	async function confirmRenewalPayment(approvalId: Id<'organizationServiceApprovals'>) {
		if (isProcessing) return;

		const renewal = renewalsData?.data?.find((r) => r.approval._id === approvalId);
		if (!renewal) return;

		isProcessing = true;
		try {
			const paymentReference = renewal.paymentReference || `RENEWAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			const paymentAmount = renewal.approval.paymentAmount || 2500;

			await client.mutation(api.serviceApproval.payAnnualFee, {
				organizationId: renewal.approval.organizationId,
				serviceVersionId: renewal.approval.serviceVersionId,
				paymentReference,
				paymentAmount,
				triggeredBy: 'finance_team'
			});

			confirmingPayment = null;
		} catch (error) {
			console.error('Failed to confirm renewal payment:', error);
			alert(`Failed to confirm payment: ${error}`);
		} finally {
			isProcessing = false;
		}
	}
</script>

{#if isLoading}
	<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
		<div class="text-gray-500">Loading renewals...</div>
	</div>
{:else if !renewalsData?.data || renewalsData.data.length === 0}
	<div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
		<div class="text-gray-500">No upcoming renewals</div>
	</div>
{:else}
	<div class="space-y-8">
		<!-- Urgent Renewals (0-7 days) -->
		{#if renewalsByUrgency.urgent.length > 0}
			<div>
				<div class="flex items-center space-x-2 mb-4">
					<span class="w-3 h-3 bg-red-600 rounded-full"></span>
					<h2 class="text-lg font-semibold text-gray-900">
						Urgent ({renewalsByUrgency.urgent.length})
					</h2>
					<span class="text-xs text-red-600 font-medium">Expiring in 0-7 days</span>
				</div>
				<div class="bg-white rounded-lg border border-red-200 overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-red-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Organization
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Service
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Paid Date
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Expires Date
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Days Left
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Lead Expert
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each renewalsByUrgency.urgent as renewal}
								<tr class="hover:bg-red-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">{renewal.organization?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{renewal.serviceVersion?.name || '—'}</div>
										<div class="text-xs text-gray-500">{renewal.serviceParent?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-500">{formatDate(renewal.paidAt)}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{formatDate(renewal.expiresAt)}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
											{renewal.daysUntilExpiry} day{renewal.daysUntilExpiry !== 1 ? 's' : ''}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if renewal.qualifiedLeadExpert}
											<div class="text-sm text-gray-900">{renewal.qualifiedLeadExpert.userName}</div>
										{:else}
											<div class="text-sm text-gray-400">—</div>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right">
										<div class="flex items-center justify-end space-x-2">
											{#if !renewal.paymentReference}
												<button
													type="button"
													onclick={() => (sendingInvoice = renewal.approval._id)}
													disabled={isProcessing}
													class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
												>
													Send Invoice
												</button>
											{/if}
											<button
												type="button"
												onclick={() => (confirmingPayment = renewal.approval._id)}
												disabled={isProcessing}
												class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
											>
												Mark Paid
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- Warning Renewals (8-30 days) -->
		{#if renewalsByUrgency.warning.length > 0}
			<div>
				<div class="flex items-center space-x-2 mb-4">
					<span class="w-3 h-3 bg-yellow-600 rounded-full"></span>
					<h2 class="text-lg font-semibold text-gray-900">
						Warning ({renewalsByUrgency.warning.length})
					</h2>
					<span class="text-xs text-yellow-600 font-medium">Expiring in 8-30 days</span>
				</div>
				<div class="bg-white rounded-lg border border-yellow-200 overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-yellow-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Organization
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Service
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Expires Date
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Days Left
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Lead Expert
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each renewalsByUrgency.warning as renewal}
								<tr class="hover:bg-yellow-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">{renewal.organization?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{renewal.serviceVersion?.name || '—'}</div>
										<div class="text-xs text-gray-500">{renewal.serviceParent?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{formatDate(renewal.expiresAt)}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
											{renewal.daysUntilExpiry} day{renewal.daysUntilExpiry !== 1 ? 's' : ''}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if renewal.qualifiedLeadExpert}
											<div class="text-sm text-gray-900">{renewal.qualifiedLeadExpert.userName}</div>
										{:else}
											<div class="text-sm text-gray-400">—</div>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right">
										<div class="flex items-center justify-end space-x-2">
											{#if !renewal.paymentReference}
												<button
													type="button"
													onclick={() => (sendingInvoice = renewal.approval._id)}
													disabled={isProcessing}
													class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
												>
													Send Invoice
												</button>
											{/if}
											<button
												type="button"
												onclick={() => (confirmingPayment = renewal.approval._id)}
												disabled={isProcessing}
												class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
											>
												Mark Paid
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- Upcoming Renewals (31-90 days) -->
		{#if renewalsByUrgency.upcoming.length > 0}
			<div>
				<div class="flex items-center space-x-2 mb-4">
					<span class="w-3 h-3 bg-green-600 rounded-full"></span>
					<h2 class="text-lg font-semibold text-gray-900">
						Upcoming ({renewalsByUrgency.upcoming.length})
					</h2>
					<span class="text-xs text-green-600 font-medium">Expiring in 31-90 days</span>
				</div>
				<div class="bg-white rounded-lg border border-green-200 overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-green-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Organization
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Service
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Expires Date
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Days Left
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
									Lead Expert
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each renewalsByUrgency.upcoming as renewal}
								<tr class="hover:bg-green-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">{renewal.organization?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{renewal.serviceVersion?.name || '—'}</div>
										<div class="text-xs text-gray-500">{renewal.serviceParent?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{formatDate(renewal.expiresAt)}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
											{renewal.daysUntilExpiry} day{renewal.daysUntilExpiry !== 1 ? 's' : ''}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if renewal.qualifiedLeadExpert}
											<div class="text-sm text-gray-900">{renewal.qualifiedLeadExpert.userName}</div>
										{:else}
											<div class="text-sm text-gray-400">—</div>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right">
										<div class="flex items-center justify-end space-x-2">
											{#if !renewal.paymentReference}
												<button
													type="button"
													onclick={() => (sendingInvoice = renewal.approval._id)}
													disabled={isProcessing}
													class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
												>
													Send Invoice
												</button>
											{/if}
											<button
												type="button"
												onclick={() => (confirmingPayment = renewal.approval._id)}
												disabled={isProcessing}
												class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
											>
												Mark Paid
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- Send Invoice Confirmation Modal -->
{#if sendingInvoice}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		onclick={() => !isProcessing && (sendingInvoice = null)}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Send Renewal Invoice</h3>
			{#if renewalsData?.data}
				{@const renewal = renewalsData.data.find((r) => r.approval._id === sendingInvoice)}
				{#if renewal}
					<div class="space-y-3 mb-6">
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Organization:</span>
							<span class="text-sm font-medium text-gray-900">{renewal.organization?.name || '—'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Service:</span>
							<span class="text-sm font-medium text-gray-900">{renewal.serviceVersion?.name || '—'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Amount:</span>
							<span class="text-sm font-medium text-gray-900">€2,500</span>
						</div>
					</div>
					<p class="text-sm text-gray-600 mb-6">
						This will generate a payment reference for manual invoice sending.
					</p>
				{/if}
			{/if}
			<div class="flex space-x-3">
				<button
					type="button"
					onclick={() => (sendingInvoice = null)}
					disabled={isProcessing}
					class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => sendInvoice(sendingInvoice!)}
					disabled={isProcessing}
					class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
				>
					{isProcessing ? 'Processing...' : 'Send Invoice'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Confirm Payment Modal -->
{#if confirmingPayment}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		onclick={() => !isProcessing && (confirmingPayment = null)}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Confirm Renewal Payment</h3>
			{#if renewalsData?.data}
				{@const renewal = renewalsData.data.find((r) => r.approval._id === confirmingPayment)}
				{#if renewal}
					<div class="space-y-3 mb-6">
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Organization:</span>
							<span class="text-sm font-medium text-gray-900">{renewal.organization?.name || '—'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Service:</span>
							<span class="text-sm font-medium text-gray-900">{renewal.serviceVersion?.name || '—'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Amount:</span>
							<span class="text-sm font-medium text-gray-900">€2,500</span>
						</div>
					</div>
				{/if}
			{/if}
			<div class="flex space-x-3">
				<button
					type="button"
					onclick={() => (confirmingPayment = null)}
					disabled={isProcessing}
					class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => confirmRenewalPayment(confirmingPayment!)}
					disabled={isProcessing}
					class="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
				>
					{isProcessing ? 'Processing...' : 'Confirm Payment'}
				</button>
			</div>
		</div>
	</div>
{/if}

