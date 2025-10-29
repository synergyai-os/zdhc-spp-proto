<script lang="ts">
	// Admin header component with admin-specific navigation
	import type { ComponentProps } from 'svelte';

	interface Props {
		// No specific props needed for now, but structure for future props
	}

	let { ...props }: Props = $props();
</script>

<!-- Admin Header -->
<header class="sticky top-0 z-50 bg-gray-100 border-b border-gray-200 px-6 py-4">
	<div class="flex items-center justify-between">
		<!-- Logo and Brand -->
		<div class="flex items-center space-x-3">
			<a href="/admin" class="flex items-center space-x-3">
				<div class="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12zm0 1a5 5 0 00-5 5c0 1.38.56 2.63 1.46 3.54L10 16l3.54-3.46A5 5 0 0010 5z"
						/>
					</svg>
				</div>
				<div>
					<h1 class="text-lg font-semibold text-gray-800">Admin Dashboard</h1>
					<p class="text-sm text-gray-600">Solution Provider Platform</p>
				</div>
			</a>
		</div>

		<!-- Admin Navigation -->
		<nav class="hidden md:flex items-center space-x-6">
			<a href="/admin" class="text-gray-700 hover:text-gray-900 font-medium">CV Review</a>
			<!-- More admin pages can be added here in the future -->
		</nav>

		<!-- Back to Platform and User Info -->
		<div class="flex items-center space-x-4">
			<a
				href="/"
				class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				<span>Back to Platform</span>
			</a>
			<div class="flex items-center space-x-3">
				<div class="text-right">
					<p class="text-sm font-medium text-gray-800">Admin User</p>
					<p class="text-sm text-gray-600">Admin Panel</p>
				</div>
				<div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
					<svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
					</svg>
				</div>
			</div>
		</div>
	</div>
</header>

