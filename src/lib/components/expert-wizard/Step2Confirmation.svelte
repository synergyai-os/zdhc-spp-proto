<script lang="ts">
	interface Props {
		userData: any;
		isDraftMode: boolean;
		invitedUserEmail?: string;
	}

	let { userData, isDraftMode, invitedUserEmail }: Props = $props();
</script>

<div class="confirmation-step">
	{#if isDraftMode && invitedUserEmail}
		<!-- Invited User Confirmation -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
			<div class="flex items-start">
				<svg
					class="w-6 h-6 text-blue-500 mt-1 mr-4 flex-shrink-0"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-blue-800 mb-2">Invitation Confirmation</h3>
					<p class="text-blue-700 mb-4">
						You are about to invite <strong>{invitedUserEmail}</strong> to join as an expert. This will
						create a draft profile that can be completed once they accept the invitation.
					</p>
					<div class="bg-blue-100 border border-blue-300 rounded-lg p-4">
						<div class="flex items-center text-sm text-blue-800">
							<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clip-rule="evenodd"
								/>
							</svg>
							<span
								><strong>Note:</strong> The user will receive an email invitation and must verify their
								account before the profile becomes active.</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else if userData}
		<!-- PDC User Confirmation -->
		<div class="bg-green-50 border border-green-200 rounded-lg p-6">
			<div class="flex items-start">
				<svg
					class="w-6 h-6 text-green-500 mt-1 mr-4 flex-shrink-0"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-green-800 mb-4">User Found in PDC</h3>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<div class="block text-sm font-medium text-green-700 mb-1">Name</div>
							<p class="text-lg font-semibold text-green-800">
								{userData.firstName}
								{userData.lastName}
							</p>
						</div>

						<div>
							<div class="block text-sm font-medium text-green-700 mb-1">Email</div>
							<p class="text-lg font-semibold text-green-800">{userData.email}</p>
						</div>

						<div>
							<div class="block text-sm font-medium text-green-700 mb-1">Country</div>
							<p class="text-lg font-semibold text-green-800">{userData.country}</p>
						</div>
					</div>

					<div class="mt-6 pt-4 border-t border-green-300">
						<div class="flex items-center text-sm text-green-700">
							<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clip-rule="evenodd"
								/>
							</svg>
							<span
								><strong>Note:</strong> This data is managed by the user in PDC and cannot be modified
								here.</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
