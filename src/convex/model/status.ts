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

/**
 * Service Assignment Status Values - Single source of truth
 * 
 * ⚠️ WARNING: Array order matters! adminCVReview.ts uses indices [0], [1], [2]
 * Never reorder this array without updating all index references
 */
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
// TRAINING STATUS MANAGEMENT
// ==========================================

/**
 * Training Status Values - Single source of truth
 * 
 * Tracks the training lifecycle for service assignments
 * Separate from service assignment status for better separation of concerns
 */
export const TRAINING_STATUS_VALUES = [
	'not_required',    // Expert already qualified globally (skip training)
	'required',        // Training needed, not yet invited
	'invited',         // Invitation sent to Academy
	'in_progress',     // Expert is taking the training
	'passed',          // Expert passed → NOW QUALIFIED
	'failed',          // Expert failed training (can retry indefinitely)
] as const;

/**
 * Convex validator for training status
 * Use this in schema.ts and query/mutation args
 */
export const TRAINING_STATUS_VALIDATOR = v.union(
	v.literal('not_required'),
	v.literal('required'),
	v.literal('invited'),
	v.literal('in_progress'),
	v.literal('passed'),
	v.literal('failed')
);

/**
 * TypeScript type for training status
 * Use this in TypeScript interfaces and functions
 */
export type TrainingStatus = typeof TRAINING_STATUS_VALUES[number];

/**
 * Get human-readable display name for training status
 * Uses business terminology: "passed" → "Qualified"
 */
export function getTrainingStatusDisplayName(status: TrainingStatus): string {
	switch (status) {
		case 'not_required': return 'Already Qualified';
		case 'required': return 'Training Required';
		case 'invited': return 'Training Invited';
		case 'in_progress': return 'Training In Progress';
		case 'passed': return 'Qualified';  // ✅ User-facing term
		case 'failed': return 'Training Failed';
		default: return status;
	}
}

/**
 * Get training status color classes for UI - Semantic color strategy
 * Follows universal UX patterns for clear visual hierarchy
 */
export function getTrainingStatusColor(status: TrainingStatus): string {
	switch (status) {
		case 'not_required': return 'bg-green-100 text-green-800';     // Success - already qualified
		case 'required': return 'bg-blue-100 text-blue-800';           // Info - action needed
		case 'invited': return 'bg-purple-100 text-purple-800';        // Info - invitation sent
		case 'in_progress': return 'bg-yellow-100 text-yellow-800';   // Wait - in progress
		case 'passed': return 'bg-green-100 text-green-800';          // Success - qualified
		case 'failed': return 'bg-red-100 text-red-800';              // Problem - failed
		default: return 'bg-gray-100 text-gray-800';
	}
}

/**
 * Check if training status indicates qualification
 * Both 'passed' and 'not_required' mean the expert is qualified
 */
export function isQualified(trainingStatus: TrainingStatus): boolean {
	return trainingStatus === 'passed' || trainingStatus === 'not_required';
}

/**
 * Check if service assignment is active for service delivery
 * Active = approved status AND qualified training status
 */
export function isActiveForService(assignment: { status: ServiceStatus; trainingStatus: TrainingStatus }): boolean {
	return assignment.status === 'approved' && isQualified(assignment.trainingStatus);
}

// ==========================================
// EXPERT ROLE MANAGEMENT
// ==========================================

/**
 * Expert Role Values - Single source of truth
 * 
 * Defines the role types for service assignments
 */
export const EXPERT_ROLE_VALUES = [
	'regular',  // Regular expert role
	'lead'      // Lead expert role (higher responsibility/qualifications)
] as const;

export const EXPERT_ROLE_VALIDATOR = v.union(
	v.literal('regular'),
	v.literal('lead')
);

export type ExpertRole = typeof EXPERT_ROLE_VALUES[number];

// ==========================================
// EXPERT JOURNEY MANAGEMENT
// ==========================================

/**
 * Expert Journey Type Values - Single source of truth
 * 
 * Defines the different journey states for expert service assignments
 * Used for UI segmentation and status display
 */
export const EXPERT_JOURNEY_VALUES = [
	'qualified-lead',              // Qualified lead expert (approved + trained)
	'regular',                     // Regular expert (approved + trained)
	'pending',                     // Pending/rejected experts (compact display)
	'inactive',                    // Inactive service experts
	'under-review',                // Waiting for ZDHC approval
	'rejected',                    // Rejected by ZDHC admin
	'approved-training-required',  // Approved but needs training
	'approved-training-failed',    // Approved but training failed
	'approved-already-qualified',  // Approved and already qualified
	'approved-training-passed'     // Approved and training completed
] as const;

export type ExpertJourneyType = typeof EXPERT_JOURNEY_VALUES[number];

/**
 * Get journey-specific status message for expert assignments
 * 
 * Provides contextual messages based on the expert's journey state
 * Uses existing status utilities for consistency
 */
export function getJourneyStatusMessage(
	assignment: { 
		status: ServiceStatus; 
		trainingStatus?: TrainingStatus; 
		rejectionReason?: string 
	}, 
	journeyType: ExpertJourneyType
): string {
	switch (journeyType) {
		case 'under-review':
			return 'Waiting for ZDHC approval';
		case 'rejected':
			return assignment.rejectionReason ? `Rejected - ${assignment.rejectionReason}` : 'Rejected';
		case 'approved-training-required':
			return assignment.trainingStatus ? getTrainingStatusDisplayName(assignment.trainingStatus) : 'Approved, training required';
		case 'approved-training-failed':
			return 'Approved, training failed - retry needed';
		case 'approved-already-qualified':
			return 'Approved, already qualified';
		case 'approved-training-passed':
			return 'Approved, training completed';
		default:
			return getServiceStatusDisplayName(assignment.status);
	}
}

/**
 * Get journey-specific status color for expert assignments
 * 
 * Provides appropriate color coding based on journey state
 * Uses existing status utilities for consistency
 */
export function getJourneyStatusColor(
	assignment: { 
		status: ServiceStatus; 
		trainingStatus?: TrainingStatus 
	}, 
	journeyType: ExpertJourneyType
): string {
	switch (journeyType) {
		case 'under-review':
			return getServiceStatusColor(assignment.status);
		case 'rejected':
			return getServiceStatusColor(assignment.status);
		case 'approved-training-required':
			return assignment.trainingStatus ? getTrainingStatusColor(assignment.trainingStatus) : getServiceStatusColor(assignment.status);
		case 'approved-training-failed':
			return assignment.trainingStatus ? getTrainingStatusColor(assignment.trainingStatus) : getServiceStatusColor(assignment.status);
		case 'approved-already-qualified':
			return assignment.trainingStatus ? getTrainingStatusColor(assignment.trainingStatus) : getServiceStatusColor(assignment.status);
		case 'approved-training-passed':
			return assignment.trainingStatus ? getTrainingStatusColor(assignment.trainingStatus) : getServiceStatusColor(assignment.status);
		default:
			return getServiceStatusColor(assignment.status);
	}
}

/**
 * Get human-readable display name for expert role
 */
export function getExpertRoleDisplayName(role: ExpertRole): string {
	switch (role) {
		case 'regular': return 'Regular Expert';
		case 'lead': return 'Lead Expert';
		default: return role;
	}
}

/**
 * Get role color classes for UI - Semantic color strategy
 * Lead roles get more prominent colors to indicate higher responsibility
 */
export function getExpertRoleColor(role: ExpertRole): string {
	switch (role) {
		case 'regular': return 'bg-blue-100 text-blue-800';     // Info - standard role
		case 'lead': return 'bg-purple-100 text-purple-800';   // Premium - leadership role
		default: return 'bg-gray-100 text-gray-800';
	}
}

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
 * Get status color classes for UI - Semantic color strategy
 * Follows universal UX patterns for clear visual hierarchy
 */
export function getCVStatusColor(status: CVStatus): string {
	switch (status) {
		case 'draft': return 'bg-gray-100 text-gray-800';        // Neutral - not ready
		case 'completed': return 'bg-blue-100 text-blue-800';    // Info - ready for next step
		case 'payment_pending': return 'bg-yellow-100 text-yellow-800';  // Wait - processing
		case 'paid': return 'bg-green-100 text-green-800';      // Success - payment done
		case 'locked_for_review': return 'bg-orange-100 text-orange-800'; // Action - needs review
		case 'unlocked_for_edits': return 'bg-red-100 text-red-800';     // Problem - needs fixes
		case 'locked_final': return 'bg-green-100 text-green-800';       // Success - final state
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
		case 'locked_for_review': return 'Ready for Review';
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

/**
 * Get status color classes for service assignment status - Semantic color strategy
 * Follows universal UX patterns for clear visual hierarchy
 */
export function getServiceStatusColor(status: ServiceStatus): string {
	switch (status) {
		case 'pending_review': return 'bg-yellow-100 text-yellow-800';   // Wait - needs decision
		case 'approved': return 'bg-green-100 text-green-800';           // Success - approved
		case 'rejected': return 'bg-red-100 text-red-800';              // Problem - rejected
		case 'inactive': return 'bg-gray-100 text-gray-800';             // Neutral - disabled
		default: return 'bg-gray-100 text-gray-800';
	}
}
