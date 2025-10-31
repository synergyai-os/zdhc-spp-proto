<script lang="ts">
	// Placeholder badge counts - these would come from queries in real implementation
	const inboxCount = 15;
	const applicationReviewCount = 12;
	const applicationReviewUrgent = 2;
	const organizationsCount = 8;
	const cvReviewsCount = 20;
	const cvUrgentCount = 3;

	let sidebarOpen = $state(true);
	let legacyOpen = $state(false);
	let systemSettingsOpen = $state(false);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function toggleLegacy() {
		legacyOpen = !legacyOpen;
	}

	function toggleSystemSettings() {
		systemSettingsOpen = !systemSettingsOpen;
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
			<!-- Primary Navigation -->
			<div class="px-3 space-y-1">
				<!-- Dashboard -->
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

				<!-- Inbox -->
				<a
					href="/admin/inbox"
					class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 group"
				>
					<div class="flex items-center space-x-3">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						{#if sidebarOpen}
							<span>Inbox</span>
						{/if}
					</div>
					{#if sidebarOpen && inboxCount > 0}
						<span
							class="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
						>
							{inboxCount}
						</span>
					{:else if !sidebarOpen && inboxCount > 0}
						<span
							class="absolute left-12 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700"
						>
							{inboxCount}
						</span>
					{/if}
				</a>

				<!-- Application Review -->
				<a
					href="/admin/review"
					class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 group"
				>
					<div class="flex items-center space-x-3">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
							/>
						</svg>
						{#if sidebarOpen}
							<span>Application Review</span>
						{/if}
					</div>
					{#if sidebarOpen && applicationReviewCount > 0}
						<span
							class="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium {applicationReviewUrgent > 0
								? 'bg-red-100 text-red-700'
								: 'bg-gray-100 text-gray-700'}"
						>
							{applicationReviewCount}
						</span>
					{:else if !sidebarOpen && applicationReviewCount > 0}
						<span
							class="absolute left-12 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 {applicationReviewUrgent > 0 ? 'bg-red-100 text-red-700' : ''}"
						>
							{applicationReviewCount}
						</span>
					{/if}
				</a>

				<!-- CV Reviews -->
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

				<!-- Organizations -->
				<a
					href="/admin/organizations"
					class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 group"
				>
					<div class="flex items-center space-x-3">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
						{#if sidebarOpen}
							<span>Organizations</span>
						{/if}
					</div>
					{#if sidebarOpen && organizationsCount > 0}
						<span
							class="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
						>
							{organizationsCount}
						</span>
					{:else if !sidebarOpen && organizationsCount > 0}
						<span
							class="absolute left-12 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700"
						>
							{organizationsCount}
						</span>
					{/if}
				</a>

				<!-- Users -->
				<a
					href="/admin/users"
					class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
					{#if sidebarOpen}
						<span>Users</span>
					{/if}
				</a>
			</div>

			{#if sidebarOpen}
				<!-- Invoices -->
				<div class="px-3 mt-1">
					<a
						href="/admin/invoices"
						class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<span>Invoices</span>
					</a>
				</div>

				<!-- Legacy Section (Collapsible) -->
				<div class="mt-4 border-t border-gray-200 pt-4">
					<button
						onclick={toggleLegacy}
						class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
					>
						<div class="flex items-center space-x-3">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Legacy</span>
						</div>
						<svg
							class="w-4 h-4 text-gray-400 {legacyOpen ? 'rotate-90' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					{#if legacyOpen}
						<div class="pl-8 mt-1 space-y-1">
							<a
								href="/admin/legacy/applications"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									/>
								</svg>
								<span>Legacy Applications</span>
							</a>
							<a
								href="/admin/legacy/nominations"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
									/>
								</svg>
								<span>Nomination Area</span>
							</a>
						</div>
					{/if}
				</div>

				<!-- System Settings Section (Collapsible) -->
				<div class="mt-4 border-t border-gray-200 pt-4">
					<button
						onclick={toggleSystemSettings}
						class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
					>
						<div class="flex items-center space-x-3">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							<span>System Settings</span>
						</div>
						<svg
							class="w-4 h-4 text-gray-400 {systemSettingsOpen ? 'rotate-90' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					{#if systemSettingsOpen}
						<div class="pl-8 mt-1 space-y-1">
							<a
								href="/admin/services"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
									/>
								</svg>
								<span>Services</span>
							</a>
							<a
								href="/admin/services/requirements"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									/>
								</svg>
								<span>Service Requirements</span>
							</a>
							<a
								href="/admin/find-your-expert"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
								<span>Find Your Expert</span>
							</a>
							<a
								href="/admin/settings/questionnaires"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
									/>
								</svg>
								<span>Questionnaires</span>
							</a>
							<a
								href="/admin/settings/substances"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
									/>
								</svg>
								<span>Substances</span>
							</a>
							<a
								href="/admin/settings/methods-categories"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
								<span>Methods & Categories</span>
							</a>
							<a
								href="/admin/settings/translator"
								class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
									/>
								</svg>
								<span>Translator</span>
							</a>
						</div>
					{/if}
				</div>

				<!-- Administration -->
				<div class="mt-4 border-t border-gray-200 pt-4 px-3 space-y-1">
					<a
						href="/admin/administration/admins"
						class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
						<span>Admin List</span>
					</a>
					<a
						href="/admin/administration/logs"
						class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<span>Logs & Reports</span>
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
