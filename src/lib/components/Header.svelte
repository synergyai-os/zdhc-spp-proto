<script lang="ts">
	// Header component with navigation
	import type { ComponentProps } from 'svelte';
	import OrganizationSwitcher from './OrganizationSwitcher.svelte';
	import {
		organizationStore,
		currentOrganizationName,
		currentUserRole
	} from '$lib/stores/organization.svelte';

	interface Props {
		// No specific props needed for now, but structure for future props
	}

	let { ...props }: Props = $props();

	// Reactive stores with error handling
	let currentOrgName = $derived($currentOrganizationName || 'No Organization Selected');
	let userRole = $derived($currentUserRole || null);
	let orgContext = $derived(
		$organizationStore || { currentOrganization: null, isLoading: false, error: null }
	);
</script>

<!-- Header -->
<header class="bg-gray-100 border-b border-gray-200 px-6 py-4">
	<div class="flex items-center justify-between">
		<!-- Logo and Brand -->
		<div class="flex items-center space-x-3">
			<div class="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
				<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
					<path
						d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12zm0 1a5 5 0 00-5 5c0 1.38.56 2.63 1.46 3.54L10 16l3.54-3.46A5 5 0 0010 5z"
					/>
				</svg>
			</div>
			<div>
				<h1 class="text-lg font-semibold text-gray-800">Solution Provider Platform</h1>
				<p class="text-sm text-gray-600">ZDHC</p>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="hidden md:flex items-center space-x-6">
			<a href="/admin" class="text-gray-700 hover:text-gray-900">Admin</a>
			<a href="/approved-services" class="text-gray-700 hover:text-gray-900">Approved Services</a>
			<a href="/user-management" class="text-gray-700 hover:text-gray-900">User Management</a>
			<!-- <div class="flex items-center space-x-1">
				<a href="/organisation" class="text-gray-700 hover:text-gray-900">Organisation</a>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
				</svg>
			</div>
			<div class="flex items-center space-x-1">
				<a href="/applications" class="text-gray-700 hover:text-gray-900">Applications</a>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
				</svg>
			</div>
			<a href="/training-nomination" class="text-gray-700 hover:text-gray-900">Training Nomination</a>
			<a href="/partner-badges" class="text-gray-700 hover:text-gray-900">Solution Provider Partner Badges</a>
			
			<div class="flex items-center space-x-1">
				<a href="/find-expert" class="text-gray-700 hover:text-gray-900">Find your Expert</a>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
				</svg>
			</div> -->
		</nav>

		<!-- Organization Switcher and User Info -->
		<div class="flex items-center space-x-4">
			<!-- Organization Switcher -->
			<OrganizationSwitcher />

			<!-- User Info -->
			<div class="flex items-center space-x-3">
				<div class="text-right">
					<p class="text-sm font-medium text-gray-800">
						{#if orgContext.currentOrganization}
							{orgContext.currentOrganization.name}
						{:else}
							No Organization Selected
						{/if}
					</p>
					<p class="text-sm text-gray-600">
						{#if userRole}
							{userRole === 'admin'
								? 'Administrator'
								: userRole === 'manager'
									? 'Manager'
									: 'Viewer'}
						{:else}
							Test User
						{/if}
					</p>
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
