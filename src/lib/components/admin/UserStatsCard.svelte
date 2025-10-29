<script lang="ts">
	import type { CVStatus, ServiceStatus } from '../../../convex/model/status';
	
	interface ServiceAssignment {
		status: ServiceStatus;
	}
	
	interface ExpertCV {
		_id: string;
		status: CVStatus;
		assignments: ServiceAssignment[];
	}

	interface Props {
		userFirstName: string;
		userLastName: string;
		userEmail: string;
		userCountry: string;
		userPhone?: string;
		organizationGroups: Array<{
			organization: { name: string };
			cvs: ExpertCV[];
		}>;
	}

	let { 
		userFirstName, 
		userLastName, 
		userEmail, 
		userCountry,
		userPhone,
		organizationGroups = []
	}: Props = $props();

	// Calculate stats across ALL CVs and organizations for this user
	const stats = $derived.by(() => {
		let pending = 0;
		let approvedUnderReview = 0;
		let rejectedUnderReview = 0;
		let approvedDecided = 0;
		let rejectedDecided = 0;
		let total = 0;
		
		// Safety check for empty data
		if (!organizationGroups || organizationGroups.length === 0) {
			return {
				pending: 0,
				approvedUnderReview: 0,
				rejectedUnderReview: 0,
				underReview: 0,
				approvedDecided: 0,
				rejectedDecided: 0,
				decided: 0,
				total: 0
			};
		}
		
		// Iterate through all organization groups and CVs
		for (const orgGroup of organizationGroups) {
			if (!orgGroup?.cvs) continue;
			
			for (const cv of orgGroup.cvs) {
				if (!cv?.assignments) continue;
				
				for (const assignment of cv.assignments) {
					total++;
					
					if (assignment.status === 'pending_review') {
						pending++;
					} else if (assignment.status === 'approved') {
						if (cv.status === 'locked_final') {
							approvedDecided++;
						} else {
							approvedUnderReview++;
						}
					} else if (assignment.status === 'rejected') {
						if (cv.status === 'locked_final') {
							rejectedDecided++;
						} else {
							rejectedUnderReview++;
						}
					}
				}
			}
		}
		
		const underReview = approvedUnderReview + rejectedUnderReview;
		const decided = approvedDecided + rejectedDecided;
		
		return {
			pending,
			approvedUnderReview,
			rejectedUnderReview,
			underReview,
			approvedDecided,
			rejectedDecided,
			decided,
			total
		};
	});
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4">
	<div class="flex items-center space-x-3 mb-3">
		<div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
			<span class="text-gray-700 font-semibold">
				{userFirstName[0]}{userLastName[0]}
			</span>
		</div>
		<div>
			<h1 class="text-lg font-bold text-gray-900">
				{userFirstName} {userLastName}
			</h1>
			<p class="text-sm text-gray-600">{userEmail}</p>
		</div>
	</div>
	<div class="space-y-1 text-sm text-gray-600">
		<p>{userCountry}</p>
		{#if userPhone}<p>{userPhone}</p>{/if}
	</div>
	
	<!-- Quick Stats -->
	<div class="mt-4 pt-4 border-t border-gray-200">
		<div class="grid grid-cols-5 gap-2 text-center">
			<div>
				<div class="text-lg font-bold text-yellow-600">{stats.pending}</div>
				<div class="text-xs text-gray-500">Pending</div>
			</div>
			<div>
				<div class="text-lg font-bold text-blue-600">{stats.underReview}</div>
				<div class="text-xs text-gray-500">Under Review</div>
			</div>
			<div>
				<div class="text-lg font-bold text-green-600">{stats.approvedDecided}</div>
				<div class="text-xs text-gray-500">Approved</div>
			</div>
			<div>
				<div class="text-lg font-bold text-red-600">{stats.rejectedDecided}</div>
				<div class="text-xs text-gray-500">Declined</div>
			</div>
			<div>
				<div class="text-lg font-bold text-gray-600">{stats.total}</div>
				<div class="text-xs text-gray-500">Total</div>
			</div>
		</div>
	</div>
</div>

