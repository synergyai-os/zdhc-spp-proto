/**
 * CV validation functions for status transitions
 * 
 * Validation Rules:
 * - At least one experience entry
 * - At least one education entry
 * - At least one service assignment
 * 
 * Note: User validation removed - CV validation only checks CV data, not user profile status.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCVCompletion(cv: any): ValidationResult {
  const errors = [];
  
  // Only validate CV data - no user validation
  if (!cv.experience?.length) errors.push('At least one experience required');
  if (!cv.education?.length) errors.push('At least one education required');
  if (!cv.serviceAssignments?.length) errors.push('At least one service required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function canTransitionStatus(from: string, to: string): boolean {
  const CV_TRANSITIONS: Record<string, string[]> = {
    'draft': ['completed'],
    'completed': ['payment_pending', 'draft'], // Can revert if validation fails
    'payment_pending': ['paid', 'payment_failed'],
    'paid': ['locked_for_review'], // Automatic after automation completes
    'locked_for_review': ['unlocked_for_edits', 'locked_final'],
    'unlocked_for_edits': ['locked_for_review'], // Resubmit after edits (can loop)
    'locked_final': [] // Terminal state - no further transitions
  };
  
  const allowedTransitions = CV_TRANSITIONS[from] || [];
  return allowedTransitions.includes(to);
}

