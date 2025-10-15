<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import type { LayoutProps } from './$types';
	import Header from '$lib/components/Header.svelte';
	import { setupConvex, useQuery } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { organizationStore } from '$lib/stores/organization.svelte';
	import { api } from '../convex/_generated/api';

	let { children }: LayoutProps = $props();

	// Initialize Convex client
	try {
		if (PUBLIC_CONVEX_URL) {
			setupConvex(PUBLIC_CONVEX_URL);
			console.log('Convex client initialized with URL:', PUBLIC_CONVEX_URL);
		} else {
			console.error('PUBLIC_CONVEX_URL is not set. Please create a .env.local file with your Convex URL.');
		}
	} catch (error) {
		console.error('Error initializing Convex client:', error);
	}

	// Load organizations and initialize organization context
	const organizations = PUBLIC_CONVEX_URL ? useQuery(api.expertAssignments.getOrganizations, () => ({})) : { data: [], isLoading: false, error: null };
	
	// Initialize organization store when organizations are loaded
	$effect(() => {
		try {
			if (organizations.data && organizations.data.length > 0) {
				organizationStore.setAvailableOrganizations(organizations.data);
			}
		} catch (error) {
			console.error('Error initializing organization store:', error);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header />

<main>
	{@render children()}
</main>
