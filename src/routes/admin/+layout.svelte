<script lang="ts">
	import type { LayoutProps } from './$types';
	import AdminHeader from '$lib/components/AdminHeader.svelte';

	let { children }: LayoutProps = $props();
</script>

<AdminHeader />

<main>
	{@render children()}
</main>

