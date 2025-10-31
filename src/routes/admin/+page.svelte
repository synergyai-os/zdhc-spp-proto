<script lang="ts">
	// Placeholder data for dashboard UI/UX testing
	const cvReadyForReview = 12;
	const cvInReview = 5;
	const cvResubmitted = 3;
	const pendingAnnualPayments = 8;
	const expiringPayments90 = 4;
	const expiringPayments30 = 7;
	const expiringPayments7 = 2;
	const unreadCommunications = 15;

	const totalPending = cvReadyForReview + cvInReview + cvResubmitted;
	const urgentTotal = cvResubmitted + expiringPayments7;
</script>

<svelte:head>
	<title>Admin Dashboard | Solution Provider Platform</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
		<p class="text-sm text-gray-500">Overview of tasks requiring your attention</p>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
		<div class="bg-white rounded-lg border border-gray-200 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500 mb-1">Total Pending</p>
					<p class="text-2xl font-semibold text-gray-900">{totalPending}</p>
				</div>
				<div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
			</div>
		</div>
		<div class="bg-white rounded-lg border border-gray-200 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500 mb-1">Urgent</p>
					<p class="text-2xl font-semibold text-gray-900">{urgentTotal}</p>
				</div>
				<div class="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
			</div>
		</div>
		<div class="bg-white rounded-lg border border-gray-200 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500 mb-1">Payments</p>
					<p class="text-2xl font-semibold text-gray-900">{pendingAnnualPayments}</p>
				</div>
				<div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
		</div>
		<div class="bg-white rounded-lg border border-gray-200 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500 mb-1">Messages</p>
					<p class="text-2xl font-semibold text-gray-900">{unreadCommunications}</p>
				</div>
				<div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- CV Reviews Section -->
	<a href="/admin/cv" class="block mb-6 group">
		<div class="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<div class="flex items-center space-x-3 mb-3">
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<h3 class="text-base font-semibold text-gray-900">CV Reviews</h3>
					</div>
					<div class="flex items-center space-x-6 text-sm">
						<div>
							<span class="text-gray-500">Ready:</span>
							<span class="ml-1 font-medium text-gray-900">{cvReadyForReview}</span>
						</div>
						<div>
							<span class="text-gray-500">In Review:</span>
							<span class="ml-1 font-medium text-gray-900">{cvInReview}</span>
						</div>
						{#if cvResubmitted > 0}
							<div>
								<span class="text-red-600">Priority:</span>
								<span class="ml-1 font-medium text-red-700">{cvResubmitted}</span>
							</div>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-2">
					<span class="text-2xl font-semibold text-gray-900">{totalPending}</span>
					<svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>
		</div>
	</a>

	<!-- Annual Payment Confirmations -->
	<a href="/admin/payments" class="block mb-6 group">
		<div class="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<div class="flex items-center space-x-3 mb-3">
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<h3 class="text-base font-semibold text-gray-900">Annual Payment Confirmations</h3>
					</div>
					<p class="text-sm text-gray-500">Manually confirm annual payments to activate services</p>
				</div>
				<div class="flex items-center space-x-2">
					<span class="text-2xl font-semibold text-gray-900">{pendingAnnualPayments}</span>
					<svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>
		</div>
	</a>

	<!-- Expiring Payments -->
	<a href="/admin/payments?filter=expiring" class="block mb-6 group">
		<div class="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<div class="flex items-center space-x-3 mb-3">
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<h3 class="text-base font-semibold text-gray-900">Expiring Payments</h3>
					</div>
					<div class="flex items-center space-x-6 text-sm">
						<div>
							<span class="text-gray-500">90 days:</span>
							<span class="ml-1 font-medium text-gray-900">{expiringPayments90}</span>
						</div>
						<div>
							<span class="text-amber-600">30 days:</span>
							<span class="ml-1 font-medium text-amber-700">{expiringPayments30}</span>
						</div>
						{#if expiringPayments7 > 0}
							<div>
								<span class="text-red-600">7 days:</span>
								<span class="ml-1 font-medium text-red-700">{expiringPayments7}</span>
							</div>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-2">
					<span class="text-2xl font-semibold text-gray-900">{expiringPayments90 + expiringPayments30 + expiringPayments7}</span>
					<svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>
		</div>
	</a>

	<!-- Communications -->
	<a href="/admin/communications" class="block mb-6 group">
		<div class="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<div class="flex items-center space-x-3 mb-3">
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
						<h3 class="text-base font-semibold text-gray-900">Communications</h3>
					</div>
					<p class="text-sm text-gray-500">View all messages between SPP Managers and Admin</p>
				</div>
				<div class="flex items-center space-x-2">
					<span class="text-2xl font-semibold text-gray-900">{unreadCommunications}</span>
					<svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>
		</div>
	</a>
</div>
