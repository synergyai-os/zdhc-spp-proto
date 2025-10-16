<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';

	interface User {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
		country: string;
		phone?: string;
	}

	interface Experience {
		title: string;
		company: string;
		location: string;
		startDate: string;
		endDate: string;
		current: boolean;
		description: string;
	}

	interface Education {
		school: string;
		degree: string;
		field: string;
		startDate: string;
		endDate: string;
		description: string;
	}

	interface ServiceAssignment {
		_id: string;
		status: string;
		role?: string;
		experience: Experience[];
		education: Education[];
		serviceVersion: {
			_id: string;
			name: string;
			version: string;
		};
		serviceParent: {
			name: string;
		};
		organization: {
			name: string;
		};
		assignedAt: number;
		approvedAt?: number;
		approvedBy?: string;
		rejectedAt?: number;
		rejectedBy?: string;
		rejectionReason?: string;
		reviewedAt?: number;
		reviewedBy?: string;
		reviewNotes?: string;
	}

	interface CVDetailData {
		user: User;
		organizationGroups: Array<{
			organization: { name: string };
			assignments: ServiceAssignment[];
		}>;
		totalAssignments: number;
		pendingAssignments: number;
	}

	interface Props {
		cvData: CVDetailData;
		onApprovalChange: () => void;
	}

	let { cvData, onApprovalChange }: Props = $props();

	const client = useConvexClient();

	// State for approval/rejection actions
	let activeAssignment = $state<ServiceAssignment | null>(null);
	let showApprovalModal = $state(false);
	let showRejectionModal = $state(false);
	let approvalNotes = $state('');
	let rejectionReason = $state('');
	let rejectionNotes = $state('');
	let isProcessing = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Status color mapping
	const getStatusColor = (status: string): string => {
		switch (status) {
			case 'paid':
				return 'bg-blue-100 text-blue-800';
			case 'training_completed':
				return 'bg-purple-100 text-purple-800';
			case 'approved':
				return 'bg-green-100 text-green-800';
			case 'rejected':
				return 'bg-red-100 text-red-800';
			case 'inactive':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusDisplayName = (status: string): string => {
		switch (status) {
			case 'paid':
				return 'Paid - Pending Review';
			case 'training_completed':
				return 'Training Completed - Ready for Approval';
			case 'approved':
				return 'Approved';
			case 'rejected':
				return 'Rejected';
			case 'inactive':
				return 'Inactive';
			default:
				return status;
		}
	};

	const formatDate = (timestamp: number): string => {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const canApprove = (assignment: ServiceAssignment): boolean => {
		return assignment.status === 'paid' || assignment.status === 'training_completed';
	};

	const canReject = (assignment: ServiceAssignment): boolean => {
		return assignment.status === 'paid' || assignment.status === 'training_completed';
	};

	const handleApprove = (assignment: ServiceAssignment) => {
		activeAssignment = assignment;
		approvalNotes = '';
		showApprovalModal = true;
	};

	const handleReject = (assignment: ServiceAssignment) => {
		activeAssignment = assignment;
		rejectionReason = '';
		rejectionNotes = '';
		showRejectionModal = true;
	};

	const confirmApproval = async () => {
		if (!activeAssignment) return;

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).adminCVReview.approveExpertForService, {
				assignmentId: activeAssignment._id,
				reviewNotes: approvalNotes || undefined,
				reviewedBy: 'admin-user' // TODO: Get actual admin user ID
			});

			successMessage = `Approved ${activeAssignment.serviceVersion.name} for ${cvData.user.firstName} ${cvData.user.lastName}`;
			showApprovalModal = false;
			activeAssignment = null;
			onApprovalChange();
		} catch (error) {
			errorMessage = `Failed to approve: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const confirmRejection = async () => {
		if (!activeAssignment || !rejectionReason) return;

		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			await client.mutation((api as any).adminCVReview.rejectExpertForService, {
				assignmentId: activeAssignment._id,
				rejectionReason,
				reviewNotes: rejectionNotes || undefined,
				reviewedBy: 'admin-user' // TODO: Get actual admin user ID
			});

			successMessage = `Rejected ${activeAssignment.serviceVersion.name} for ${cvData.user.firstName} ${cvData.user.lastName}`;
			showRejectionModal = false;
			activeAssignment = null;
			onApprovalChange();
		} catch (error) {
			errorMessage = `Failed to reject: ${error}`;
		} finally {
			isProcessing = false;
		}
	};

	const closeModals = () => {
		showApprovalModal = false;
		showRejectionModal = false;
		activeAssignment = null;
		approvalNotes = '';
		rejectionReason = '';
		rejectionNotes = '';
		errorMessage = '';
		successMessage = '';
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

<div class="space-y-8">
	<!-- Messages -->
	{#if successMessage}
		<div class="bg-green-50 border border-green-200 rounded-lg p-4">
			<div class="flex items-center space-x-3">
				<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<p class="text-green-700 font-medium">{successMessage}</p>
			</div>
		</div>
	{/if}

	{#if errorMessage}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-center space-x-3">
				<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<p class="text-red-700 font-medium">{errorMessage}</p>
			</div>
		</div>
	{/if}

	<!-- User Information -->
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<div class="flex items-start space-x-4">
			<div class="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
				<span class="text-xl font-medium text-gray-700">
					{cvData.user.firstName[0]}{cvData.user.lastName[0]}
				</span>
			</div>
			<div class="flex-1">
				<h1 class="text-2xl font-bold text-gray-900">
					{cvData.user.firstName}
					{cvData.user.lastName}
				</h1>
				<div class="mt-2 space-y-1">
					<p class="text-gray-600">
						<svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						{cvData.user.email}
					</p>
					<p class="text-gray-600">
						<svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						{cvData.user.country}
					</p>
					{#if cvData.user.phone}
						<p class="text-gray-600">
							<svg
								class="w-4 h-4 inline mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
								/>
							</svg>
							{cvData.user.phone}
						</p>
					{/if}
				</div>
			</div>
			<div class="text-right">
				<div class="text-sm text-gray-500">Total Services</div>
				<div class="text-2xl font-bold text-gray-900">{cvData.totalAssignments}</div>
				<div class="text-sm text-gray-500 mt-1">Pending Review</div>
				<div class="text-lg font-semibold text-yellow-600">{cvData.pendingAssignments}</div>
			</div>
		</div>
	</div>

	<!-- Experience Section -->
	{#if cvData.organizationGroups.length > 0}
		{@const allAssignments = cvData.organizationGroups.flatMap(org => org.assignments)}
		{@const assignmentWithExperience = allAssignments.find(a => a.experience && a.experience.length > 0)}
		{#if assignmentWithExperience?.experience?.length > 0}
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-xl font-bold text-gray-900 mb-4">Professional Experience</h2>
				<div class="space-y-4">
					{#each assignmentWithExperience.experience as exp}
						<div class="border-l-4 border-blue-500 pl-4 py-2">
							<div class="flex justify-between items-start">
								<div>
									<h3 class="font-semibold text-gray-900">{exp.title}</h3>
									<p class="text-gray-600">{exp.company} • {exp.location}</p>
									<p class="text-sm text-gray-500">
										{exp.startDate} - {exp.current ? 'Present' : exp.endDate}
									</p>
								</div>
								{#if exp.current}
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
									>
										Current
									</span>
								{/if}
							</div>
							{#if exp.description}
								<p class="text-gray-700 mt-2">{exp.description}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Education Section -->
	{#if cvData.organizationGroups.length > 0}
		{@const allAssignments = cvData.organizationGroups.flatMap(org => org.assignments)}
		{@const assignmentWithEducation = allAssignments.find(a => a.education && a.education.length > 0)}
		{#if assignmentWithEducation?.education?.length > 0}
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-xl font-bold text-gray-900 mb-4">Education</h2>
				<div class="space-y-4">
					{#each assignmentWithEducation.education as edu}
						<div class="border-l-4 border-green-500 pl-4 py-2">
							<h3 class="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
							<p class="text-gray-600">{edu.school}</p>
							<p class="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</p>
							{#if edu.description}
								<p class="text-gray-700 mt-2">{edu.description}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Service Assignments -->
	<div class="space-y-6">
		{#each cvData.organizationGroups as orgGroup}
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h2 class="text-xl font-bold text-gray-900 mb-2">
					Service Applications for {orgGroup.organization.name}
				</h2>
				<p class="text-sm text-gray-600 mb-4">
					This user has applied for {orgGroup.assignments.length} service{orgGroup.assignments.length === 1 ? '' : 's'} with this organization
				</p>
				<div class="grid gap-4">
					{#each orgGroup.assignments as assignment}
						<div
							class="border border-gray-200 rounded-lg p-4 {assignment.status === 'paid' ||
							assignment.status === 'training_completed'
								? 'bg-yellow-50'
								: ''}"
						>
							<div class="flex justify-between items-start mb-3">
								<div>
									<h3 class="font-semibold text-gray-900">{assignment.serviceVersion.name}</h3>
									<p class="text-sm text-gray-600">
										{assignment.serviceParent.name} • {assignment.serviceVersion.version}
									</p>
									<div class="flex items-center space-x-2 mt-1">
										{#if assignment.role}
											<span
												class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
											>
												{assignment.role === 'lead' ? 'Lead Expert' : 'Regular Expert'}
											</span>
										{/if}
										<span class="text-xs text-gray-500">
											Applied: {formatDate(assignment.assignedAt)}
										</span>
									</div>
								</div>
								<div class="text-right">
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(
											assignment.status
										)}"
									>
										{getStatusDisplayName(assignment.status)}
									</span>
									{#if assignment.reviewedAt}
										<p class="text-xs text-gray-500 mt-1">
											Reviewed: {formatDate(assignment.reviewedAt)}
										</p>
									{/if}
								</div>
							</div>

							<!-- Review History -->
							{#if assignment.approvedAt || assignment.rejectedAt}
								<div class="bg-gray-50 rounded-lg p-3 mb-3">
									<div class="text-sm">
										{#if assignment.approvedAt}
											<p class="text-green-700">
												<strong>Approved</strong> on {formatDate(assignment.approvedAt)}
												{#if assignment.approvedBy}
													by {assignment.approvedBy}{/if}
											</p>
										{/if}
										{#if assignment.rejectedAt}
											<p class="text-red-700">
												<strong>Rejected</strong> on {formatDate(assignment.rejectedAt)}
												{#if assignment.rejectedBy}
													by {assignment.rejectedBy}{/if}
											</p>
											{#if assignment.rejectionReason}
												<p class="text-red-600 mt-1">
													<strong>Reason:</strong>
													{assignment.rejectionReason}
												</p>
											{/if}
										{/if}
										{#if assignment.reviewNotes}
											<p class="text-gray-700 mt-2">
												<strong>Notes:</strong>
												{assignment.reviewNotes}
											</p>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Action Buttons -->
							{#if canApprove(assignment) || canReject(assignment)}
								<div class="flex space-x-2">
									{#if canApprove(assignment)}
										<button
											type="button"
											onclick={() => handleApprove(assignment)}
											class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
										>
											Approve
										</button>
									{/if}
									{#if canReject(assignment)}
										<button
											type="button"
											onclick={() => handleReject(assignment)}
											class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
										>
											Reject
										</button>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Approval Modal -->
{#if showApprovalModal && activeAssignment}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					Approve {activeAssignment.serviceVersion.name}
				</h3>
				<p class="text-sm text-gray-600 mb-4">
					This will approve {cvData.user.firstName}
					{cvData.user.lastName} for the {activeAssignment.serviceVersion.name} service.
				</p>

				<div class="mb-4">
					<label for="approval-notes" class="block text-sm font-medium text-gray-700 mb-2">
						Review Notes (Optional)
					</label>
					<textarea
						id="approval-notes"
						bind:value={approvalNotes}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						placeholder="Add any notes about this approval..."
					></textarea>
				</div>

				<div class="flex justify-end space-x-3">
					<button
						type="button"
						onclick={closeModals}
						disabled={isProcessing}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmApproval}
						disabled={isProcessing}
						class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
					>
						{#if isProcessing}
							Processing...
						{:else}
							Approve
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Rejection Modal -->
{#if showRejectionModal && activeAssignment}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					Reject {activeAssignment.serviceVersion.name}
				</h3>
				<p class="text-sm text-gray-600 mb-4">
					This will reject {cvData.user.firstName}
					{cvData.user.lastName} for the {activeAssignment.serviceVersion.name} service.
				</p>

				<div class="mb-4">
					<label for="rejection-reason" class="block text-sm font-medium text-gray-700 mb-2">
						Rejection Reason *
					</label>
					<select
						id="rejection-reason"
						bind:value={rejectionReason}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
					>
						<option value="">Select a reason...</option>
						<option value="Insufficient Experience">Insufficient Experience</option>
						<option value="Missing Qualifications">Missing Qualifications</option>
						<option value="Incomplete CV">Incomplete CV</option>
						<option value="Does Not Meet Standards">Does Not Meet Standards</option>
						<option value="Other">Other</option>
					</select>
				</div>

				<div class="mb-4">
					<label for="rejection-notes" class="block text-sm font-medium text-gray-700 mb-2">
						Additional Notes (Optional)
					</label>
					<textarea
						id="rejection-notes"
						bind:value={rejectionNotes}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						placeholder="Provide additional details about the rejection..."
					></textarea>
				</div>

				<div class="flex justify-end space-x-3">
					<button
						type="button"
						onclick={closeModals}
						disabled={isProcessing}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmRejection}
						disabled={isProcessing || !rejectionReason}
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
					>
						{#if isProcessing}
							Processing...
						{:else}
							Reject
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
