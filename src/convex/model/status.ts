import { v } from 'convex/values';

// ==========================================
// CV STATUS MANAGEMENT
// ==========================================

/**
 * CV Status Values - Single source of truth
 * 
 * Status Flow: draft → completed → payment_pending → paid → locked_for_review → unlocked_for_edits → locked_final
 * 
 * Usage: Import this in schema.ts, mutations, and queries to ensure consistency
 */
export const CV_STATUS_VALUES = [
	'draft',              // Incomplete, can edit freely
	'completed',          // Complete, ready for payment
	'payment_pending',    // Payment initiated, awaiting confirmation
	'paid',              // Payment confirmed, triggers automation
	'locked_for_review', // Automation complete, reviewer working
	'unlocked_for_edits', // Reviewer returned it for edits
	'locked_final'       // Review complete, immutable
] as const;

/**
 * Convex validator for CV status
 * Use this in schema.ts and query/mutation args
 */
export const CV_STATUS_VALIDATOR = v.union(
	v.literal('draft'),
	v.literal('completed'),
	v.literal('payment_pending'),
	v.literal('paid'),
	v.literal('locked_for_review'),
	v.literal('unlocked_for_edits'),
	v.literal('locked_final')
);

/**
 * TypeScript type for CV status
 * Use this in TypeScript interfaces and functions
 */
export type CVStatus = typeof CV_STATUS_VALUES[number];

// ==========================================
// SERVICE ASSIGNMENT STATUS MANAGEMENT
// ==========================================



   // ⚠️ WARNING: Array order matters! adminCVReview.ts uses indices [0], [1], [2]
   // Never reorder this array without updating all index references
   export const SERVICE_STATUS_VALUES = [
	'pending_review',    // [0] - Used in adminCVReview.ts
	'approved',          // [1] - Used in adminCVReview.ts  
	'rejected',          // [2] - Used in adminCVReview.ts
	'inactive'           // [3] - Safe to add new statuses here
  ] as const;

export const SERVICE_STATUS_VALIDATOR = v.union(
	v.literal('pending_review'),
	v.literal('approved'),
	v.literal('rejected'),
	v.literal('inactive')
);

export type ServiceStatus = typeof SERVICE_STATUS_VALUES[number];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Check if a CV status allows editing
 */
export function canEditCVContent(status: CVStatus): boolean {
	return ['draft', 'completed', 'unlocked_for_edits'].includes(status);
}

/**
 * Check if a CV status allows service editing
 */
export function canEditServices(status: CVStatus): boolean {
	return ['draft', 'completed'].includes(status);
}

/**
 * Get status color classes for UI
 */
export function getCVStatusColor(status: CVStatus): string {
	switch (status) {
		case 'draft': return 'bg-gray-100 text-gray-800';
		case 'completed': return 'bg-blue-100 text-blue-800';
		case 'payment_pending': return 'bg-yellow-100 text-yellow-800';
		case 'paid': return 'bg-green-100 text-green-800';
		case 'locked_for_review': return 'bg-orange-100 text-orange-800';
		case 'unlocked_for_edits': return 'bg-red-100 text-red-800';
		case 'locked_final': return 'bg-green-100 text-green-800';
		default: return 'bg-gray-100 text-gray-800';
	}
}

/**
 * Get human-readable display name for CV status
 */
export function getCVStatusDisplayName(status: CVStatus): string {
	switch (status) {
		case 'draft': return 'Draft';
		case 'completed': return 'Completed';
		case 'payment_pending': return 'Payment Pending';
		case 'paid': return 'Paid';
		case 'locked_for_review': return 'Locked for Review';
		case 'unlocked_for_edits': return 'Unlocked for Edits';
		case 'locked_final': return 'Locked Final';
		default: return status;
	}
}

/**
 * Get human-readable display name for service assignment status
 */
export function getServiceStatusDisplayName(status: ServiceStatus): string {
	switch (status) {
		case 'pending_review': return 'Pending Review';
		case 'approved': return 'Approved';
		case 'rejected': return 'Rejected';
		case 'inactive': return 'Inactive';
		default: return status;
	}
}
