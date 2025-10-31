<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import type { Id } from '../../../../convex/_generated/dataModel';

	const client = useConvexClient();

	// Get pending annual fees and CV payments
	const pendingAnnualFees = useQuery(api.invoices.getPendingAnnualFees, {});
	const pendingCVPayments = useQuery(api.invoices.getPendingCVPayments, {});

	let isLoading = $derived(
		!pendingAnnualFees || pendingAnnualFees.isLoading || !pendingCVPayments || pendingCVPayments.isLoading
	);

	// State for confirmation modals
	let confirmingAnnualFee = $state<Id<'organizationServiceApprovals'> | null>(null);
	let confirmingCVPayment = $state<Id<'expertCVs'> | null>(null);
	let isProcessing = $state(false);

	async function confirmAnnualFeePayment(approvalId: Id<'organizationServiceApprovals'>) {
		if (isProcessing) return;

		const approval = pendingAnnualFees?.data?.find((f) => f.approval._id === approvalId);
		if (!approval) return;

		isProcessing = true;
		try {
			// Generate payment reference
			const paymentReference = `ANNUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			const paymentAmount = 2500; // €2,500 annual fee

			await client.mutation(api.serviceApproval.payAnnualFee, {
				organizationId: approval.approval.organizationId,
				serviceVersionId: approval.approval.serviceVersionId,
				paymentReference,
				paymentAmount,
				triggeredBy: 'finance_team'
			});

			confirmingAnnualFee = null;
		} catch (error) {
			console.error('Failed to confirm annual fee payment:', error);
			alert(`Failed to confirm payment: ${error}`);
		} finally {
			isProcessing = false;
		}
	}

	async function confirmCVPayment(cvId: Id<'expertCVs'>) {
		if (isProcessing) return;

		isProcessing = true;
		try {
			await client.mutation(api.expert.updateCVStatus, {
				cvId,
				newStatus: 'paid'
			});

			confirmingCVPayment = null;
		} catch (error) {
			console.error('Failed to confirm CV payment:', error);
			alert(`Failed to confirm payment: ${error}`);
		} finally {
			isProcessing = false;
		}
	}

	function formatDate(timestamp?: number): string {
		if (!timestamp) return '—';
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

{#if isLoading}
	<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
		<div class="text-gray-500">Loading pending payments...</div>
	</div>
{:else}
	<div class="space-y-8">
		<!-- Annual Fees Section -->
		<div>
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Annual Fees</h2>
			{#if !pendingAnnualFees?.data || pendingAnnualFees.data.length === 0}
				<div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
					<div class="text-gray-500">No pending annual fee payments</div>
				</div>
			{:else}
				<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
									Amount
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Payment Reference
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each pendingAnnualFees.data as fee}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">{fee.organization?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{fee.serviceVersion?.name || '—'}</div>
										<div class="text-xs text-gray-500">{fee.serviceParent?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if fee.qualifiedLeadExpert}
											<div class="text-sm text-gray-900">{fee.qualifiedLeadExpert.userName}</div>
											<div class="text-xs text-gray-500">{fee.qualifiedLeadExpert.userEmail}</div>
										{:else}
											<div class="text-sm text-gray-400">—</div>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">€2,500</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-mono text-gray-600">
											{fee.approval.paymentReference || '—'}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if fee.isExpired}
											<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
												Expired
											</span>
										{:else}
											<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
												Pending
											</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right">
										<button
											type="button"
											onclick={() => (confirmingAnnualFee = fee.approval._id)}
											disabled={isProcessing}
											class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Confirm Payment
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- CV Payments Section -->
		<div>
			<h2 class="text-lg font-semibold text-gray-900 mb-4">CV Review Payments</h2>
			{#if !pendingCVPayments?.data || pendingCVPayments.data.length === 0}
				<div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
					<div class="text-gray-500">No pending CV review payments</div>
				</div>
			{:else}
				<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Expert Name
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Organization
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Services
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Amount
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Submitted Date
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each pendingCVPayments.data as cvPayment}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">
											{cvPayment.user
												? `${cvPayment.user.firstName} ${cvPayment.user.lastName}`
												: '—'}
										</div>
										<div class="text-xs text-gray-500">{cvPayment.user?.email || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{cvPayment.organization?.name || '—'}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-900">{cvPayment.servicesCount} service{cvPayment.servicesCount !== 1 ? 's' : ''}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">
											€{cvPayment.paymentAmount.toFixed(2)}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-gray-500">{formatDate(cvPayment.submittedAt)}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right">
										<button
											type="button"
											onclick={() => (confirmingCVPayment = cvPayment.cv._id)}
											disabled={isProcessing}
											class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Confirm Payment
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Annual Fee Confirmation Modal -->
{#if confirmingAnnualFee}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		onclick={() => !isProcessing && (confirmingAnnualFee = null)}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Confirm Annual Fee Payment</h3>
			{#if pendingAnnualFees?.data}
				{@const fee = pendingAnnualFees.data.find((f) => f.approval._id === confirmingAnnualFee)}
				{#if fee}
					<div class="space-y-3 mb-6">
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Organization:</span>
							<span class="text-sm font-medium text-gray-900">{fee.organization?.name || '—'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Service:</span>
							<span class="text-sm font-medium text-gray-900">{fee.serviceVersion?.name || '—'}</span>
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
					onclick={() => (confirmingAnnualFee = null)}
					disabled={isProcessing}
					class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => confirmAnnualFeePayment(confirmingAnnualFee!)}
					disabled={isProcessing}
					class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
				>
					{isProcessing ? 'Processing...' : 'Confirm Payment'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- CV Payment Confirmation Modal -->
{#if confirmingCVPayment}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		onclick={() => !isProcessing && (confirmingCVPayment = null)}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Confirm CV Review Payment</h3>
			{#if pendingCVPayments?.data}
				{@const cvPayment = pendingCVPayments.data.find((p) => p.cv._id === confirmingCVPayment)}
				{#if cvPayment}
					<div class="space-y-3 mb-6">
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Expert:</span>
							<span class="text-sm font-medium text-gray-900">
								{cvPayment.user
									? `${cvPayment.user.firstName} ${cvPayment.user.lastName}`
									: '—'}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Organization:</span>
							<span class="text-sm font-medium text-gray-900">{cvPayment.organization?.name || '—'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Services:</span>
							<span class="text-sm font-medium text-gray-900">{cvPayment.servicesCount} service{cvPayment.servicesCount !== 1 ? 's' : ''}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Amount:</span>
							<span class="text-sm font-medium text-gray-900">€{cvPayment.paymentAmount.toFixed(2)}</span>
						</div>
					</div>
				{/if}
			{/if}
			<div class="flex space-x-3">
				<button
					type="button"
					onclick={() => (confirmingCVPayment = null)}
					disabled={isProcessing}
					class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => confirmCVPayment(confirmingCVPayment!)}
					disabled={isProcessing}
					class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
				>
					{isProcessing ? 'Processing...' : 'Confirm Payment'}
				</button>
			</div>
		</div>
	</div>
{/if}

