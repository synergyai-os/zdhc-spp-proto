/**
 * Service change analysis utilities
 * Analyzes differences between current service assignments and desired state
 */

export interface ServiceChanges {
	toAdd: string[];
	toRemove: string[];
	toUpdate: { assignmentId: string; newRole: string }[];
}

export interface ServiceAssignment {
	_id: string;
	serviceVersionId: string;
	role: 'lead' | 'regular';
}

export function analyzeServiceChanges(
	currentAssignments: ServiceAssignment[],
	desiredServiceIds: string[],
	currentRoles: Record<string, 'lead' | 'regular'>,
	roleChanges: Record<string, 'lead' | 'regular'>
): ServiceChanges {
	// Extract current service IDs
	const currentServiceIds = currentAssignments.map((assignment) => assignment.serviceVersionId);
	
	// Determine what to add and remove
	const toAdd = desiredServiceIds.filter((id) => !currentServiceIds.includes(id));
	const toRemove = currentServiceIds.filter((id) => !desiredServiceIds.includes(id));
	
	// Determine role updates
	const roleUpdates = currentAssignments.filter((assignment) => {
		const serviceId = assignment.serviceVersionId;
		return roleChanges[serviceId] && roleChanges[serviceId] !== assignment.role;
	});
	
	const toUpdate = roleUpdates.map((assignment) => ({
		assignmentId: assignment._id,
		newRole: roleChanges[assignment.serviceVersionId]
	}));
	
	return { toAdd, toRemove, toUpdate };
}

