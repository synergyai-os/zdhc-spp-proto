/**
 * CV Validation Builder
 * Helps build CV objects for validation by simulating post-change state
 */

import type { ServiceChanges } from './serviceChangeAnalyzer';
import type { Id } from '$lib';

export interface ServiceAssignment {
	_id: string;
	serviceVersionId: string;
	role: 'lead' | 'regular';
}

export interface CVForValidation {
	_id: Id<'expertCVs'>;
	experience: any[];
	education: any[];
	trainingQualifications: any[];
	serviceAssignments: any[];
}

/**
 * Builds a CV object for validation that simulates what it will look like after service changes
 */
export function buildCVForValidation(
	cvData: any,
	currentAssignments: ServiceAssignment[],
	changes: ServiceChanges,
	roleChanges: Record<string, 'lead' | 'regular'>
): CVForValidation {
	// Start with current assignments
	const updatedServiceAssignments = [...currentAssignments];
	
	// Add new service assignments
	for (const serviceId of changes.toAdd) {
		const role = roleChanges[serviceId] || 'regular';
		updatedServiceAssignments.push({
			_id: `temp-${serviceId}`, // Temporary ID for validation
			serviceVersionId: serviceId,
			role: role
		});
	}
	
	// Remove service assignments
	const filteredAssignments = updatedServiceAssignments.filter(
		(assignment) => !changes.toRemove.includes(assignment.serviceVersionId)
	);
	
	// Update roles for existing assignments
	const finalAssignments = filteredAssignments.map((assignment) => {
		const update = changes.toUpdate.find((update) => update.assignmentId === assignment._id);
		if (update) {
			return { ...assignment, role: update.newRole };
		}
		return assignment;
	});
	
	return {
		...cvData,
		serviceAssignments: finalAssignments
	};
}

