<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const expertId = $derived($page.params.expertId);

	// Redirect to new route location
	$effect(() => {
		if (expertId) {
			goto(`/experts/${expertId}/cv`, { replaceState: true });
		}
	});
</script>

<div class="bg-gray-50 min-h-screen flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
		<p class="text-gray-600">Redirecting...</p>
	</div>
</div>
