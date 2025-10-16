<script lang="ts">
	import ActionCard from '$lib/components/ActionCard.svelte';

	function handleGetApproved() {
		console.log('Navigate to approval process');
	}

	function handleMarketServices() {
		console.log('Navigate to market services');
	}

	function handleManageRequests() {
		console.log('Navigate to manage requests');
	}
</script>

<!-- Hero Section -->
<section
	class="relative h-96 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 overflow-hidden"
>
	<!-- Background Image Placeholder (using CSS gradient for now) -->
	<div
		class="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 opacity-90"
	></div>

	<!-- Hero Content -->
	<div class="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
		<h2 class="text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wide">
			ZDHC APPROVED SOLUTION PROVIDER PLATFORM
		</h2>
		<p class="text-xl text-blue-100 max-w-3xl">
			Welcome to the SPP, your portal to becoming a ZDHC Approved Solution Provider.
		</p>
	</div>
</section>

<!-- Main Content -->
<main class="bg-white py-8">
	<div class="max-w-7xl mx-auto px-6">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Column - Action Cards -->
			<div class="lg:col-span-2 space-y-6">
				<ActionCard
					number={1}
					title="Get Approved"
					description="Input your profile and start your application to become a ZDHC Approved Solution Provider"
					onClick={handleGetApproved}
				/>

				<ActionCard
					number={2}
					title="Market Your Services"
					description="Describe your services in the Find your Expert Platform and reach out to potential customers."
					onClick={handleMarketServices}
				/>

				<ActionCard
					number={3}
					title="Manage Find your Expert Requests"
					description="See incoming requests, assign and complete your projects."
					onClick={handleManageRequests}
				/>
			</div>

			<!-- Right Column - Sidebar -->
			<div class="space-y-6">
				<!-- Important News Section -->
				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-3">IMPORTANT NEWS</h3>
					<p class="text-gray-600 text-sm mb-4">
						Stay informed with timely updates on crucial communications from ZDHC
					</p>
					<button
						class="w-full bg-blue-100 text-gray-700 py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
					>
						You've read all the latest news.
					</button>
					<a href="/news" class="text-blue-500 text-sm mt-3 inline-block hover:text-blue-600">
						read previous News >
					</a>
				</div>

				<!-- Feedback Section -->
				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h3 class="text-lg font-bold text-gray-800 mb-3">Feedback</h3>
					<a href="/survey" class="text-blue-500 text-sm hover:text-blue-600 flex items-center">
						<span>ZDHC Solution Provider Platform Survey</span>
						<svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"
							/>
							<path
								d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H5zm0 2h6v6H5V7z"
							/>
						</svg>
					</a>
				</div>
			</div>
		</div>
	</div>
</main>
