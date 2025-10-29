<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import type { Id } from '../../../../convex/_generated/dataModel';

	const client = useConvexClient();

	// Get all service versions
	const serviceVersions = useQuery(api.serviceVersions.getServiceVersions, {});
	
	// State for UI
	let selectedServiceVersionId = $state<Id<'serviceVersions'> | null>(null);
	let showCreateModal = $state(false);
	let showRetireModal = $state(false);
	let showReplaceModal = $state(false);
	
	let newRequirementTitle = $state('');
	let newRequirementDescription = $state('');
	let newRequirementOrder = $state<number | undefined>(undefined);
	
	let requirementToRetire = $state<Id<'serviceVersionRequirements'> | null>(null);
	let retirementReason = $state('');
	
	let requirementToReplace = $state<Id<'serviceVersionRequirements'> | null>(null);
	let replacementTitle = $state('');
	let replacementDescription = $state('');
	
	let isProcessing = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Get requirements for selected service version
	const requirements = useQuery(
		(api as any).serviceVersionRequirements.getRequirementsForServiceVersion,
		() => selectedServiceVersionId ? { serviceVersionId: selectedServiceVersionId } : 'skip'
	);

	// Get service parents for grouping
	const serviceParents = useQuery(api.serviceVersions.getServiceParents, {});

	// Group service versions by parent
	const groupedServices = $derived.by(() => {
		if (!serviceVersions?.data || !serviceParents?.data) return [];
		
		const parentMap = new Map(serviceParents.data.map(p => [p._id, p]));
		const groups = new Map<Id<'serviceParents'>, { parent: any; versions: any[] }>();

		for (const version of serviceVersions.data) {
			if (!groups.has(version.parentId)) {
				groups.set(version.parentId, {
					parent: parentMap.get(version.parentId),
					versions: []
				});
			}
			groups.get(version.parentId)!.versions.push(version);
		}

		return Array.from(groups.values());
	});

	// Select first service version by default
	$effect(() => {
		if (serviceVersions?.data && serviceVersions.data.length > 0 && !selectedServiceVersionId) {
			selectedServiceVersionId = serviceVersions.data[0]._id;
		}
	});

	const handleCreateRequirement = async () => {
		if (!selectedServiceVersionId || !newRequirementTitle.trim()) {
			errorMessage = 'Please select a service version and enter a requirement title';
			return;
		}

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).serviceVersionRequirements.createRequirement, {
				serviceVersionId: selectedServiceVersionId,
				title: newRequirementTitle.trim(),
				description: newRequirementDescription.trim() || undefined,
				order: newRequirementOrder,
				createdBy: 'admin-user' // TODO: Get actual admin user ID
			});

			successMessage = 'Requirement created successfully';
			newRequirementTitle = '';
			newRequirementDescription = '';
			newRequirementOrder = undefined;
			showCreateModal = false;
		} catch (error) {
			errorMessage = `Failed to create requirement: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const handleRetireRequirement = async () => {
		if (!requirementToRetire) return;

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).serviceVersionRequirements.retireRequirement, {
				requirementId: requirementToRetire,
				retiredBy: 'admin-user',
				retirementReason: retirementReason.trim() || undefined
			});

			successMessage = 'Requirement retired successfully';
			requirementToRetire = null;
			retirementReason = '';
			showRetireModal = false;
		} catch (error) {
			errorMessage = `Failed to retire requirement: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const handleReplaceRequirement = async () => {
		if (!requirementToReplace || !selectedServiceVersionId || !replacementTitle.trim()) {
			errorMessage = 'Please enter a replacement requirement title';
			return;
		}

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).serviceVersionRequirements.createRequirement, {
				serviceVersionId: selectedServiceVersionId,
				title: replacementTitle.trim(),
				description: replacementDescription.trim() || undefined,
				createdBy: 'admin-user',
				replacesRequirementId: requirementToReplace
			});

			successMessage = 'Requirement replaced successfully';
			requirementToReplace = null;
			replacementTitle = '';
			replacementDescription = '';
			showReplaceModal = false;
		} catch (error) {
			errorMessage = `Failed to replace requirement: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const openRetireModal = (requirementId: Id<'serviceVersionRequirements'>) => {
		requirementToRetire = requirementId;
		retirementReason = '';
		showRetireModal = true;
	};

	const openReplaceModal = (requirementId: Id<'serviceVersionRequirements'>) => {
		requirementToReplace = requirementId;
		const requirement = requirements?.data?.find((r: any) => r._id === requirementId);
		if (requirement) {
			replacementTitle = requirement.title;
			replacementDescription = requirement.description || '';
		}
		showReplaceModal = true;
	};

	// Clear messages after 5 seconds
	$effect(() => {
		if (successMessage || errorMessage) {
			const timer = setTimeout(() => {
				successMessage = '';
				errorMessage = '';
			}, 5000);
			return () => clearTimeout(timer);
		}
	});
</script>

<div class="bg-gray-50 min-h-screen">
	<div class="max-w-7xl mx-auto px-6 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900 mb-2">Service Requirements</h1>
					<p class="text-gray-600">
						Manage requirements for each service version. Requirements are immutable - to update them, replace the old requirement with a new one.
					</p>
				</div>
				<button
					type="button"
					onclick={() => {
						if (selectedServiceVersionId) {
							showCreateModal = true;
						} else {
							errorMessage = 'Please select a service version first';
						}
					}}
					class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
					disabled={!selectedServiceVersionId || isProcessing}
				>
					+ Add Requirement
				</button>
			</div>
		</div>

		<!-- Messages -->
		{#if successMessage}
			<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
				{successMessage}
			</div>
		{/if}
		{#if errorMessage}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
				{errorMessage}
			</div>
		{/if}

		<!-- Service Selection -->
		<div class="mb-6 bg-white rounded-lg border border-gray-200 p-4">
				<h2 class="block text-sm font-medium text-gray-700 mb-2">
					Select Service Version
				</h2>
			<div class="space-y-4">
				{#each groupedServices as group}
					<div>
						<h3 class="text-sm font-semibold text-gray-900 mb-2">{group.parent?.name || 'Unknown'}</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
							{#each group.versions as version}
								<button
									type="button"
									onclick={() => selectedServiceVersionId = version._id}
									class="text-left p-3 rounded-lg border transition-colors {selectedServiceVersionId === version._id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}"
								>
									<div class="font-medium text-sm text-gray-900">{version.name}</div>
									<div class="text-xs text-gray-500 mt-1">{version.version}</div>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Requirements List -->
		{#if selectedServiceVersionId}
			<div class="bg-white rounded-lg border border-gray-200">
				<div class="p-6 border-b border-gray-200">
					<h2 class="text-xl font-semibold text-gray-900">
						Requirements
						{#if requirements?.data}
							<span class="text-sm font-normal text-gray-500">
								({requirements.data.length} active)
							</span>
						{/if}
					</h2>
				</div>

				{#if requirements?.isLoading}
					<div class="p-8 text-center text-gray-500">Loading requirements...</div>
				{:else if requirements?.data && requirements.data.length > 0}
					<div class="divide-y divide-gray-200">
						{#each requirements.data as requirement (requirement._id)}
							<div class="p-6 hover:bg-gray-50">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3 mb-2">
											<h3 class="text-base font-medium text-gray-900">
												{requirement.title}
											</h3>
											{#if requirement.order !== undefined}
												<span class="text-xs text-gray-500">Order: {requirement.order}</span>
											{/if}
										</div>
										{#if requirement.description}
											<p class="text-sm text-gray-600 mt-1">{requirement.description}</p>
										{/if}
										<div class="mt-2 text-xs text-gray-500">
											Created: {new Date(requirement.createdAt).toLocaleDateString()}
											{#if requirement.replacesRequirementId}
												<span class="ml-4">Replaces requirement ID: {requirement.replacesRequirementId}</span>
											{/if}
										</div>
									</div>
									<div class="flex items-center space-x-2">
										<button
											type="button"
											onclick={() => openReplaceModal(requirement._id)}
											class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
											disabled={isProcessing}
										>
											Replace
										</button>
										<button
											type="button"
											onclick={() => openRetireModal(requirement._id)}
											class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200"
											disabled={isProcessing}
										>
											Retire
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="p-8 text-center text-gray-500">
						No requirements defined for this service version. Click "Add Requirement" to create one.
					</div>
				{/if}
			</div>
		{:else}
			<div class="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
				Please select a service version to view or manage requirements.
			</div>
		{/if}
	</div>
</div>

<!-- Create Requirement Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Create New Requirement</h3>
				<div class="space-y-4">
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
							Title <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="title"
							bind:value={newRequirementTitle}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g., Expert did 10 onsite assessments"
						/>
					</div>
					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
							Description (Optional)
						</label>
						<textarea
							id="description"
							bind:value={newRequirementDescription}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Additional details about this requirement"
						></textarea>
					</div>
					<div>
						<label for="order" class="block text-sm font-medium text-gray-700 mb-1">
							Display Order (Optional)
						</label>
						<input
							type="number"
							id="order"
							bind:value={newRequirementOrder}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Lower numbers appear first"
						/>
					</div>
				</div>
				<div class="flex items-center justify-end space-x-3 mt-6">
					<button
						type="button"
						onclick={() => {
							showCreateModal = false;
							newRequirementTitle = '';
							newRequirementDescription = '';
							newRequirementOrder = undefined;
						}}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
						disabled={isProcessing}
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={handleCreateRequirement}
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
						disabled={isProcessing || !newRequirementTitle.trim()}
					>
						{isProcessing ? 'Creating...' : 'Create'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Retire Requirement Modal -->
{#if showRetireModal && requirementToRetire}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Retire Requirement</h3>
				<p class="text-sm text-gray-600 mb-4">
					This will mark the requirement as retired. It will no longer appear for new reviews, but will remain visible for historical traceability.
				</p>
				<div class="mb-4">
					<label for="retirementReason" class="block text-sm font-medium text-gray-700 mb-1">
						Reason (Optional)
					</label>
					<textarea
						id="retirementReason"
						bind:value={retirementReason}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
						placeholder="Why is this requirement being retired?"
					></textarea>
				</div>
				<div class="flex items-center justify-end space-x-3 mt-6">
					<button
						type="button"
						onclick={() => {
							showRetireModal = false;
							requirementToRetire = null;
							retirementReason = '';
						}}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
						disabled={isProcessing}
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={handleRetireRequirement}
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
						disabled={isProcessing}
					>
						{isProcessing ? 'Retiring...' : 'Retire'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Replace Requirement Modal -->
{#if showReplaceModal && requirementToReplace}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Replace Requirement</h3>
				<p class="text-sm text-gray-600 mb-4">
					Create a new requirement that replaces the old one. The old requirement will be automatically retired and linked to this new one.
				</p>
				<div class="space-y-4">
					<div>
						<label for="replacementTitle" class="block text-sm font-medium text-gray-700 mb-1">
							New Title <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="replacementTitle"
							bind:value={replacementTitle}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Updated requirement title"
						/>
					</div>
					<div>
						<label for="replacementDescription" class="block text-sm font-medium text-gray-700 mb-1">
							New Description (Optional)
						</label>
						<textarea
							id="replacementDescription"
							bind:value={replacementDescription}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Updated requirement description"
						></textarea>
					</div>
				</div>
				<div class="flex items-center justify-end space-x-3 mt-6">
					<button
						type="button"
						onclick={() => {
							showReplaceModal = false;
							requirementToReplace = null;
							replacementTitle = '';
							replacementDescription = '';
						}}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
						disabled={isProcessing}
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={handleReplaceRequirement}
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
						disabled={isProcessing || !replacementTitle.trim()}
					>
						{isProcessing ? 'Replacing...' : 'Replace'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

