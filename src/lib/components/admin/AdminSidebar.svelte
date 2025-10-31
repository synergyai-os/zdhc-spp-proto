<script lang="ts">
	// Placeholder badge counts - these would come from queries in real implementation
	const cvReviewsCount = 20;
	const cvUrgentCount = 3;
	const paymentsCount = 8;
	const communicationsCount = 15;

	let sidebarOpen = $state(true);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<div class="flex h-screen bg-white border-r border-gray-200">
	<!-- Sidebar -->
	<aside class="transition-all duration-300 {sidebarOpen ? 'w-64' : 'w-16'} flex flex-col">
		<!-- Logo/Brand -->
		<div class="flex items-center justify-between p-4 border-b border-gray-200">
			{#if sidebarOpen}
				<div class="flex items-center space-x-3">
					<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12zm0 1a5 5 0 00-5 5c0 1.38.56 2.63 1.46 3.54L10 16l3.54-3.46A5 5 0 0010 5z"
							/>
						</svg>
					</div>
					<div>
						<h2 class="text-sm font-semibold text-gray-900">Admin</h2>
						<p class="text-xs text-gray-500">Dashboard</p>
					</div>
				</div>
			{:else}
				<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
					<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12zm0 1a5 5 0 00-5 5c0 1.38.56 2.63 1.46 3.54L10 16l3.54-3.46A5 5 0 0010 5z"
						/>
					</svg>
				</div>
			{/if}
			<button
				onclick={toggleSidebar}
				aria-label="Toggle sidebar"
				class="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
			>
				<svg
					class="w-5 h-5 {!sidebarOpen ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
					/>
				</svg>
			</button>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto py-4">
			<div class="px-3 space-y-1">
				<a
					href="/admin"
					class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-900 bg-gray-100"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					{#if sidebarOpen}
						<span>Dashboard</span>
					{/if}
				</a>
				<a
					href="/admin/cv"
					class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 group"
				>
					<div class="flex items-center space-x-3">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						{#if sidebarOpen}
							<span>CV Reviews</span>
						{/if}
					</div>
					{#if sidebarOpen && cvReviewsCount > 0}
						<span
							class="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium {cvUrgentCount > 0
								? 'bg-red-100 text-red-700'
								: 'bg-gray-100 text-gray-700'}"
						>
							{cvReviewsCount}
						</span>
					{:else if !sidebarOpen && cvReviewsCount > 0}
						<span
							class="absolute left-12 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 {cvUrgentCount > 0 ? 'bg-red-100 text-red-700' : ''}"
						>
							{cvReviewsCount}
						</span>
					{/if}
				</a>
				<a
					href="/admin/services/requirements"
					class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
					{#if sidebarOpen}
						<span>Service Requirements</span>
					{/if}
				</a>
			</div>

			{#if sidebarOpen}
				<div class="px-4 pt-6 pb-2">
					<p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</p>
				</div>
				<div class="px-3 pt-2 space-y-1">
					<a
						href="/admin/payments"
						class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 group relative"
					>
						<div class="flex items-center space-x-3">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Payments</span>
						</div>
						{#if paymentsCount > 0}
							<span
								class="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
							>
								{paymentsCount}
							</span>
						{/if}
					</a>
					<a
						href="/admin/communications"
						class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 group relative"
					>
						<div class="flex items-center space-x-3">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/>
							</svg>
							<span>Communications</span>
						</div>
						{#if communicationsCount > 0}
							<span
								class="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
							>
								{communicationsCount}
							</span>
						{/if}
					</a>
				</div>
			{/if}
		</nav>

		<!-- Footer -->
		<div class="p-4 border-t border-gray-200">
			<a
				href="/"
				class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				{#if sidebarOpen}
					<span>Back to Platform</span>
				{/if}
			</a>
		</div>
	</aside>
</div>

