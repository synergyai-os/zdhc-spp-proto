/**
 * Service Change Executor
 * Executes service assignment changes (add, remove, update roles)
 */

import type { ServiceChanges } from './serviceChangeAnalyzer';

export interface ExecutionContext {
	addServiceAssignment: (serviceId: string) => Promise<any>;
	removeServiceAssignment: (serviceId: string) => Promise<any>;
	updateServiceRole: (assignmentId: string, newRole: string) => Promise<any>;
}

/**
 * Executes service changes (add, remove, update roles)
 */
export async function executeServiceChanges(
	changes: ServiceChanges,
	context: ExecutionContext
): Promise<void> {
	// Add new services
	for (const serviceId of changes.toAdd) {
		await context.addServiceAssignment(serviceId);
	}
	
	// Remove services
	for (const serviceId of changes.toRemove) {
		await context.removeServiceAssignment(serviceId);
	}
	
	// Update service roles
	for (const update of changes.toUpdate) {
		await context.updateServiceRole(update.assignmentId, update.newRole);
	}
}

