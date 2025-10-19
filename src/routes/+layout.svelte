<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import type { LayoutProps } from './$types';
	import Header from '$lib/components/Header.svelte';
	import { setupConvex, useQuery } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { DEFAULT_ORG_ID } from '$lib/config';

	let { children }: LayoutProps = $props();

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

<Header />

<main>
	{@render children()}
</main>
