<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import type { LayoutProps } from './$types';
	import Header from '$lib/components/Header.svelte';
	import { setupConvex, useQuery } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { DEFAULT_ORG_ID } from '$lib/config';
	import { setContext } from 'svelte';
	import { page } from '$app/stores';

	let { children }: LayoutProps = $props();

	// Check if we're on an admin route or CV completion page to conditionally show header
	let isAdminRoute = $derived($page.url.pathname.startsWith('/admin'));
	let isCVCompletionRoute = $derived($page.url.pathname.startsWith('/experts/cv-completion'));
	let shouldShowHeader = $derived(!isAdminRoute && !isCVCompletionRoute);

	// Set organization ID in context for all child components
	setContext('orgId', DEFAULT_ORG_ID);

	// Initialize Convex client
	try {
		if (PUBLIC_CONVEX_URL) {
			setupConvex(PUBLIC_CONVEX_URL);
			console.log('Convex client initialized with URL:', PUBLIC_CONVEX_URL);
		} else {
			console.error(
				'PUBLIC_CONVEX_URL is not set. Please create a .env.local file with your Convex URL.'
			);
		}
	} catch (error) {
		console.error('Error initializing Convex client:', error);
	}

	// Using hardcoded organization ID instead of dynamic organization selection
	console.log('Using DEFAULT_ORG_ID:', DEFAULT_ORG_ID);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if shouldShowHeader}
	<Header />
{/if}

<main>
	{@render children()}
</main>
