/**
 * CV Status Transition Handler
 * Handles automatic status transitions based on CV validation
 */

import type { Id } from '$lib';

export interface StatusTransitionResult {
	shouldTransition: boolean;
	fromStatus: string;
	toStatus: string | null;
}

/**
 * Determines if a CV should transition status based on validation
 * Returns the target status if transition is needed, null otherwise
 */
export function shouldTransitionCVStatus(
	currentStatus: string,
	isValid: boolean
): string | null {
	// Draft → Completed: CV is now complete
	if (currentStatus === 'draft' && isValid) {
		return 'completed';
	}
	
	// Completed → Draft: CV is no longer complete (e.g., removed all education)
	if (currentStatus === 'completed' && !isValid) {
		return 'draft';
	}
	
	return null;
}

