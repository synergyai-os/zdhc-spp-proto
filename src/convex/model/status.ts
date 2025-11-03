import { v } from 'convex/values';
import { PAYMENT_EXPIRY_PERIOD_MS } from '../../lib/config';

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

/**
 * Check if a payment is expired based on paidAt timestamp
 * Uses the payment expiry period from config
 */
export function isPaymentExpired(paidAt: number | undefined): boolean {
	if (!paidAt) return true; // No payment = expired
	const now = Date.now();
	return (now - paidAt) > PAYMENT_EXPIRY_PERIOD_MS;
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
			return 'Under Review';
		case 'rejected':
			return 'Rejected';
		case 'approved-training-required':
			return assignment.trainingStatus ? getTrainingStatusDisplayName(assignment.trainingStatus) : 'Training Required';
		case 'approved-training-failed':
			return 'Training Failed';
		case 'approved-already-qualified':
			return 'Already Qualified';
		case 'approved-training-passed':
			return 'Training Completed';
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
			return 'bg-yellow-100 text-yellow-800';
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

// ==========================================
// SERVICE APPROVAL STATUS MANAGEMENT (ServiceApprovalTracker)
// ==========================================

/**
 * Service Approval Status Values - Single source of truth
 * 
 * Used by ServiceApprovalTracker component for UI display
 */
export const SERVICE_APPROVAL_STATUS_VALUES = [
	'approved',
	'assign_lead',
	'pay_annual_fee',
	'active'
] as const;

export type ServiceApprovalStatus = typeof SERVICE_APPROVAL_STATUS_VALUES[number];

/**
 * Get human-readable display name for service approval status
 */
export function getServiceApprovalStatusDisplayName(status: ServiceApprovalStatus): string {
	switch (status) {
		case 'approved': return 'Approved';
		case 'assign_lead': return 'Assign Qualified Lead Expert';
		case 'pay_annual_fee': return 'Pay Annual Fee';
		case 'active': return 'Active';
		default: return status;
	}
}

/**
 * Get status color classes for service approval status - Semantic color strategy
 */
export function getServiceApprovalStatusColor(status: ServiceApprovalStatus): string {
	switch (status) {
		case 'approved': return 'bg-green-100 text-green-800';           // Success - approved
		case 'assign_lead': return 'bg-blue-100 text-blue-800';         // Info - action needed
		case 'pay_annual_fee': return 'bg-yellow-100 text-yellow-800';   // Wait - payment needed
		case 'active': return 'bg-green-100 text-green-800';             // Success - active
		default: return 'bg-gray-100 text-gray-800';
	}
}

// ==========================================
// SERVICE ASSIGNMENT STATUS DISPLAY (Unified)
// ==========================================

/**
 * Service Assignment Display Status - Single source of truth for UI
 * 
 * This type represents the high-level display status shown to users
 * in tables and lists. It combines assignment status, CV status, and training status.
 */
export type ServiceAssignmentDisplayStatus = 
	| 'active' 
	| 'rejected' 
	| 'pending' 
	| 'training_needed' 
	| 'training_failed' 
	| 'payment_needed' 
	| 'in_review';

/**
 * Service Assignment Display Status Info
 */
export interface ServiceAssignmentDisplayInfo {
	type: ServiceAssignmentDisplayStatus;
	icon: string;
	color: string;
	label: string;
}

/**
 * Calculate display status for a service assignment
 * 
 * Priority order (most specific first):
 * 1. Rejected (if assignment rejected + CV locked_final)
 * 2. Training failed (if approved + training failed)
 * 3. Active (if approved + CV locked + training qualified)
 * 4. Payment Needed (if CV status is 'completed' - regardless of assignment status)
 * 5. Training needed (if approved + needs training)
 * 6. In review (if approved + CV in review state)
 * 7. Pending review (if assignment pending_review AND CV not completed)
 * 
 * @param assignment - Service assignment with enriched CV data
 * @returns Display info with type, icon, color, and label
 */
export function getServiceAssignmentDisplayStatus(assignment: {
	status: ServiceStatus;
	trainingStatus?: TrainingStatus;
	expertCV?: {
		status: CVStatus;
	};
}): ServiceAssignmentDisplayInfo {
	const cvStatus = assignment.expertCV?.status;
	const assignmentStatus = assignment.status;
	const trainingStatus = assignment.trainingStatus;

	// 1. Rejected services (only show if CV is locked_final - definitive rejection)
	if (assignmentStatus === 'rejected' && cvStatus === 'locked_final') {
		return {
			type: 'rejected',
			icon: '❌',
			color: 'bg-red-100 text-red-800 border-red-300',
			label: 'Rejected'
		};
	}

	// 2. Training failed (approved but training failed)
	if (assignmentStatus === 'approved' && trainingStatus === 'failed') {
		return {
			type: 'training_failed',
			icon: '❌',
			color: 'bg-red-100 text-red-800 border-red-300',
			label: 'Training Failed'
		};
	}

	// 3. Active/Qualified (approved + CV locked + training qualified)
	const isCVLocked = cvStatus === 'locked_final';
	const isTrainingQualified = trainingStatus && isQualified(trainingStatus);
	if (assignmentStatus === 'approved' && isCVLocked && isTrainingQualified) {
		return {
			type: 'active',
			icon: '✅',
			color: 'bg-green-100 text-green-800 border-green-300',
			label: 'Active'
		};
	}

	// 4. Payment Needed (CRITICAL: Check CV status FIRST - regardless of assignment status)
	// If CV is completed, payment is needed before anything else can happen
	if (cvStatus === 'completed') {
		return {
			type: 'payment_needed',
			icon: '💳',
			color: 'bg-amber-100 text-amber-800 border-amber-300',
			label: 'Pending Payment'
		};
	}

	// 5. Training needed (approved but needs training)
	if (assignmentStatus === 'approved' && trainingStatus && ['required', 'invited', 'in_progress'].includes(trainingStatus)) {
		return {
			type: 'training_needed',
			icon: '🎓',
			color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
			label: 'Training Needed'
		};
	}

	// 6. In review (approved but CV in review state)
	if (assignmentStatus === 'approved' && cvStatus && ['locked_for_review', 'unlocked_for_edits'].includes(cvStatus)) {
		return {
			type: 'in_review',
			icon: '👀',
			color: 'bg-blue-100 text-blue-800 border-blue-300',
			label: 'In Review'
		};
	}

	// 7. Pending review (assignment pending - only if CV is not completed)
	if (assignmentStatus === 'pending_review') {
		return {
			type: 'pending',
			icon: '⏳',
			color: 'bg-gray-100 text-gray-800 border-gray-300',
			label: 'Pending Review'
		};
	}

	// Default
	return {
		type: 'pending',
		icon: '⏳',
		color: 'bg-gray-100 text-gray-800 border-gray-300',
		label: 'Pending'
	};
}
