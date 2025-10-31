<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import PendingInvoiceTable from '$lib/components/admin/invoices/PendingInvoiceTable.svelte';
	import PendingPaymentTable from '$lib/components/admin/invoices/PendingPaymentTable.svelte';
	import RenewalsTable from '$lib/components/admin/invoices/RenewalsTable.svelte';
	import PaymentHistoryTable from '$lib/components/admin/invoices/PaymentHistoryTable.svelte';

	let activeTab = $state<'pending-invoice' | 'pending' | 'renewals' | 'history'>('pending-invoice');

	function setTab(tab: 'pending-invoice' | 'pending' | 'renewals' | 'history') {
		activeTab = tab;
	}
</script>

<svelte:head>
	<title>Invoices | Admin</title>
</svelte:head>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-2xl font-semibold text-gray-900 mb-1">Invoices</h1>
		<p class="text-sm text-gray-500">Manage annual fee payments and CV review payments</p>
	</div>

	<!-- Tab Navigation -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="-mb-px flex space-x-8">
			<button
				type="button"
				onclick={() => setTab('pending-invoice')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'pending-invoice'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Pending Invoice
			</button>
			<button
				type="button"
				onclick={() => setTab('pending')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'pending'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Pending Payment
			</button>
			<button
				type="button"
				onclick={() => setTab('renewals')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'renewals'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Renewals Coming Up
			</button>
			<button
				type="button"
				onclick={() => setTab('history')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'history'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Payment History
			</button>
		</nav>
	</div>

	<!-- Tab Content -->
	<div>
		{#if activeTab === 'pending-invoice'}
			<PendingInvoiceTable />
		{:else if activeTab === 'pending'}
			<PendingPaymentTable />
		{:else if activeTab === 'renewals'}
			<RenewalsTable />
		{:else if activeTab === 'history'}
			<PaymentHistoryTable />
		{/if}
	</div>
</div>

