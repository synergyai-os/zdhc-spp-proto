<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import type { Id } from '../../../../convex/_generated/dataModel';

	const client = useConvexClient();

	// Get pending invoices (need to be sent)
	const pendingInvoices = useQuery(api.invoices.getPendingInvoices, {});

	let isLoading = $derived(!pendingInvoices || pendingInvoices.isLoading);

	// State for sending invoice
	let sendingInvoice = $state<Id<'organizationServiceApprovals'> | null>(null);
	let isProcessing = $state(false);

	function formatDate(timestamp?: number): string {
		if (!timestamp) return 'N/A';
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatDateWithTime(timestamp?: number): string {
		if (!timestamp) return 'N/A';
		return new Date(timestamp).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function sendInvoice(approvalId: Id<'organizationServiceApprovals'>) {
		if (isProcessing) return;

		const invoice = pendingInvoices?.data?.find((inv) => inv.approval._id === approvalId);
		if (!invoice) return;

		isProcessing = true;
		try {
			// Generate invoice reference (in production this would come from invoice generation system)
			const invoiceReference = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

			await client.mutation(api.invoices.setInvoicePaymentReference, {
				approvalId,
				paymentReference: invoiceReference
			});

			sendingInvoice = null;
		} catch (error) {
			console.error('Failed to send invoice:', error);
			alert(`Failed to send invoice: ${error}`);
		} finally {
			isProcessing = false;
		}
	}
</script>

<div class="space-y-6">
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="text-gray-500">Loading pending invoices...</div>
		</div>
	{:else if !pendingInvoices?.data || pendingInvoices.data.length === 0}
		<div class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
			<p class="text-gray-600">No pending invoices to send</p>
			<p class="text-sm text-gray-500 mt-1">All invoices have been sent or payments are confirmed</p>
		</div>
	{:else}
		<!-- Annual Fees Table -->
		<div>
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Annual Fees</h2>
			<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Organization
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Service
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Qualified Lead Expert
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Qualified Since
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Amount
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Action
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each pendingInvoices.data as invoice (invoice.approval._id)}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">
										{invoice.organization.name}
									</div>
									<div class="text-sm text-gray-500">{invoice.organization.email || 'No email'}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{invoice.serviceParent?.name || 'Unknown Service'}
									</div>
									<div class="text-sm text-gray-500">
										{invoice.serviceVersion.name}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if invoice.qualifiedLeadExpert}
										<div class="text-sm text-gray-900">
											{invoice.qualifiedLeadExpert.userName}
										</div>
										<div class="text-sm text-gray-500">
											{invoice.qualifiedLeadExpert.userEmail}
										</div>
									{:else}
										<span class="text-sm text-gray-400">N/A</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(invoice.qualifiedLeadExpert?.qualifiedAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">€2,500</div>
									<div class="text-xs text-gray-500">Annual fee</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<button
										type="button"
										onclick={() => sendInvoice(invoice.approval._id)}
										disabled={isProcessing}
										class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{#if isProcessing && sendingInvoice === invoice.approval._id}
											<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Sending...
										{:else}
											<svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
											</svg>
											Send Invoice
										{/if}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

