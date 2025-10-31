<script lang="ts">
	import type { LayoutProps } from './$types';
	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';

	let { children }: LayoutProps = $props();
</script>

<div class="flex h-screen bg-gray-50">
	<AdminSidebar />
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>

