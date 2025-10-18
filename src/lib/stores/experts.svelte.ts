import { writable, derived } from 'svelte/store';
// Import types from Convex (these will be available after API regeneration)
type ExpertCV = any;
type ExpertServiceAssignment = any;

// ==========================================
// TYPES
// ==========================================

export interface ServiceVersion {
	_id: string;
	name: string;
	version: string;
	description?: string;
	parentId: string;
}

export interface ServiceParent {
	_id: string;
	name: string;
	description?: string;
}

export interface ExpertTableRow {
	id: string;
	name: string;
	email: string;
	avatar: string;
	services: Array<{
		name: string;
		isLead: boolean;
		status: string;
	}>;
	currentStatus: string;
	paymentStatus: 'paid' | 'unpaid' | 'pending';
	nextAction: string;
	hasLeadRole: boolean;
	totalAssignments: number;
	// Profile completion tracking
	isProfileComplete?: boolean;
	profileCompletionStep?: number;
	isActive?: boolean; // User's active status
	// CV versioning fields
	cvVersion?: number;
	cvStatus?: string;
}

// ==========================================
// STORE
// ==========================================

interface ExpertStoreState {
	// New CV schema data
	expertCVs: ExpertCV[];
	expertServiceAssignments: ExpertServiceAssignment[];
	// Common data
	serviceVersions: ServiceVersion[];
	serviceParents: ServiceParent[];
	isLoading: boolean;
	error: string | null;
}

function createExpertStore() {
	const { subscribe, set, update } = writable<ExpertStoreState>({
		expertCVs: [],
		expertServiceAssignments: [],
		serviceVersions: [],
		serviceParents: [],
		isLoading: false,
		error: null
	});

	return {
		subscribe,
		setExpertCVs: (expertCVs: ExpertCV[]) => {
			update(store => ({ ...store, expertCVs }));
		},
		setExpertServiceAssignments: (expertServiceAssignments: ExpertServiceAssignment[]) => {
			update(store => ({ ...store, expertServiceAssignments }));
		},
		setServiceVersions: (serviceVersions: ServiceVersion[]) => {
			update(store => ({ ...store, serviceVersions }));
		},
		setServiceParents: (serviceParents: ServiceParent[]) => {
			update(store => ({ ...store, serviceParents }));
		},
		setLoading: (isLoading: boolean) => {
			update(store => ({ ...store, isLoading }));
		},
		setError: (error: string | null) => {
			update(store => ({ ...store, error }));
		},
		clear: () => {
			set({
				expertCVs: [],
				expertServiceAssignments: [],
				serviceVersions: [],
				serviceParents: [],
				isLoading: false,
				error: null
			});
		}
	};
}

export const expertStore = createExpertStore();

// ==========================================
// DERIVED STORES
// ==========================================

// Group experts by user (NEW CV SCHEMA)
export const expertsGroupedByUser = derived(expertStore, ($store) => {
	console.log('🔄 Processing experts data:', {
		expertCVs: $store.expertCVs.length,
		expertServiceAssignments: $store.expertServiceAssignments.length,
		serviceVersions: $store.serviceVersions.length,
		expertCVsData: $store.expertCVs,
		expertServiceAssignmentsData: $store.expertServiceAssignments
	});

	if (!$store.expertCVs.length) {
		console.log('❌ No expert CVs found');
		return new Map();
	}

	const userGroups = new Map<string, ExpertTableRow>();

	$store.expertCVs.forEach((cv) => {
		const userId = cv.userId;
		console.log('📋 Processing CV:', {
			userId,
			status: cv.status,
			user: cv.user,
			cvId: cv._id
		});

		// Skip draft CVs only for unverified users - verified users should appear in main table
		if (cv.status === 'draft' && !cv.user?.isActive) {
			console.log('⏭️ Skipping draft CV for unverified user:', userId);
			return;
		}

		if (!userGroups.has(userId)) {
			userGroups.set(userId, {
				id: userId, // Use user ID for editing
				name:
					`${cv.user?.firstName || ''} ${cv.user?.lastName || ''}`.trim() ||
					cv.user?.email ||
					'Unknown',
				email: cv.user?.email || '',
				avatar:
					`${cv.user?.firstName?.[0] || ''}${cv.user?.lastName?.[0] || ''}` || '?',
				services: [],
				currentStatus: getStatusPriorityCV(cv),
				paymentStatus: getPaymentStatusCV(cv),
				nextAction: getNextActionCV(cv),
				hasLeadRole: false,
				totalAssignments: 0,
				// Profile completion tracking
				isProfileComplete: true,
				profileCompletionStep: 3,
				isActive: cv.user?.isActive,
				// CV versioning fields
				cvVersion: cv.version,
				cvStatus: cv.status
			});
			console.log('✅ Created new user group for:', userId);
		}

		const row = userGroups.get(userId)!;

		// Get service assignments for this CV
		const cvAssignments = $store.expertServiceAssignments.filter(
			(assignment) => assignment.expertCVId === cv._id
		);

		console.log('🔗 Found assignments for CV:', {
			cvId: cv._id,
			assignmentsCount: cvAssignments.length,
			assignments: cvAssignments
		});

		cvAssignments.forEach((assignment) => {
			const serviceVersion = $store.serviceVersions.find(
				(sv) => sv._id === assignment.serviceVersionId
			);

			if (serviceVersion) {
				row.services.push({
					name: serviceVersion.name,
					isLead: assignment.role === 'lead',
					status: assignment.status
				});
				row.hasLeadRole = row.hasLeadRole || assignment.role === 'lead';
				console.log('🎯 Added service:', {
					name: serviceVersion.name,
					role: assignment.role,
					status: assignment.status
				});
			} else {
				console.log('⚠️ Service version not found for assignment:', assignment.serviceVersionId);
			}
		});

		row.totalAssignments = cvAssignments.length;
	});

	console.log('📊 Final user groups:', Array.from(userGroups.entries()));
	return userGroups;
});

// Convert to table format (NEW CV SCHEMA)
export const expertsTableData = derived(expertsGroupedByUser, ($userGroups) => {
	return Array.from($userGroups.values());
});

// Convert to pending verification format (for unverified users) - NEW CV SCHEMA
export const pendingVerificationData = derived(expertStore, ($store) => {
	// Filter for draft CVs of unverified users only
	const draftCVs = $store.expertCVs.filter((cv) => cv.status === 'draft' && !cv.user?.isActive);
	
	console.log('🔄 Processing pending verification data:', {
		totalCVs: $store.expertCVs.length,
		draftCVs: draftCVs.length,
		draftCVsData: draftCVs
	});
	
	const result = draftCVs.map((cv) => {
		const pendingExpert = {
			id: cv.userId, // Use user ID for editing
			name: `${cv.user?.firstName || ''} ${cv.user?.lastName || ''}`.trim() || cv.user?.email || 'Unknown',
			email: cv.user?.email || '',
			avatar: `${cv.user?.firstName?.[0] || ''}${cv.user?.lastName?.[0] || ''}` || '?',
			status: cv.status,
			currentStatus: getStatusPriorityCV(cv), // Add missing currentStatus
			paymentStatus: getPaymentStatusCV(cv),
			nextAction: getNextActionCV(cv),
			isProfileComplete: cv.isProfileComplete,
			profileCompletionStep: cv.profileCompletionStep,
			isActive: cv.user?.isActive,
			cvVersion: cv.version,
			cvStatus: cv.status,
			// Add services for pending experts
			services: [],
			totalAssignments: 0,
			hasLeadRole: false
		};

		// Get service assignments for this CV
		const cvAssignments = $store.expertServiceAssignments.filter(
			(assignment) => assignment.expertCVId === cv._id
		);

		cvAssignments.forEach((assignment) => {
			const serviceVersion = $store.serviceVersions.find(
				(sv) => sv._id === assignment.serviceVersionId
			);

			if (serviceVersion) {
				pendingExpert.services.push({
					name: serviceVersion.name,
					isLead: assignment.role === 'lead',
					status: assignment.status
				});
				pendingExpert.hasLeadRole = pendingExpert.hasLeadRole || assignment.role === 'lead';
			}
		});

		pendingExpert.totalAssignments = cvAssignments.length;

		return pendingExpert;
	});

	console.log('📊 Final pending verification data:', result);
	return result;
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function isUserVerifiedCV(cv: ExpertCV): boolean {
	// Active users show in main table regardless of draft status
	if (cv.user?.isActive === true) {
		return true;
	}
	// Inactive users (invited, not verified) always show in pending section
	return false;
}

function getPaymentStatusCV(cv: ExpertCV): 'paid' | 'unpaid' | 'pending' {
	if (cv.status === 'submitted' || cv.status === 'pending_review') {
		return 'paid';
	}
	return 'unpaid';
}

function getNextActionCV(cv: ExpertCV): string {
	switch (cv.status) {
		case 'draft':
			return 'Complete CV';
		case 'submitted':
			return 'Awaiting Review';
		case 'pending_review':
			return 'Under Review';
		case 'locked':
			return 'Approved';
		default:
			return 'Complete CV';
	}
}

function getStatusPriorityCV(cv: ExpertCV): string {
	return cv.status;
}

export function getStatusColorCV(status: string): string {
	switch (status) {
		case 'draft':
			return 'bg-gray-100 text-gray-800';
		case 'submitted':
			return 'bg-blue-100 text-blue-800';
		case 'pending_review':
			return 'bg-yellow-100 text-yellow-800';
		case 'locked':
			return 'bg-green-100 text-green-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}