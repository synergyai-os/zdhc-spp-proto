import { get } from 'svelte/store';
import { organizationStore } from '$lib/stores/organization.svelte';
import type { Organization } from '$lib/stores/organization.svelte';

/**
 * Organization Context Utilities
 * 
 * These utilities ensure proper organization context management
 * and provide consistent patterns for organization-aware components.
 */

export interface OrganizationContextState {
	hasOrganization: boolean;
	organization: Organization | null;
	organizationId: string | null;
	isLoading: boolean;
	error: string | null;
}

/**
 * Get the current organization context state
 */
export function getOrganizationContext(): OrganizationContextState {
	const store = get(organizationStore);
	return {
		hasOrganization: !!store.currentOrganization,
		organization: store.currentOrganization,
		organizationId: store.currentOrganization?._id || null,
		isLoading: store.isLoading,
		error: store.error
	};
}

/**
 * Validate that an organization is selected and throw an error if not
 */
export function requireOrganization(): string {
	const context = getOrganizationContext();
	if (!context.hasOrganization) {
		throw new Error('No organization selected. Please select an organization before proceeding.');
	}
	return context.organizationId!;
}

/**
 * Check if organization context is ready for queries
 */
export function isOrganizationContextReady(): boolean {
	const context = getOrganizationContext();
	return context.hasOrganization && !context.isLoading && !context.error;
}

/**
 * Get organization ID for queries, returning null if not ready
 */
export function getOrganizationIdForQuery(): string | null {
	const context = getOrganizationContext();
	return context.hasOrganization ? context.organizationId : null;
}

/**
 * Create a conditional query argument that skips when organization is not available
 */
export function createConditionalQueryArgs<T extends Record<string, any>>(
	argsFactory: (orgId: string) => T
): T | "skip" {
	const orgId = getOrganizationIdForQuery();
	if (!orgId) {
		return "skip" as any;
	}
	return argsFactory(orgId);
}

/**
 * Organization context validation for components
 */
export function validateOrganizationContext(): {
	isValid: boolean;
	error?: string;
	organizationId?: string;
} {
	const context = getOrganizationContext();
	
	if (context.isLoading) {
		return { isValid: false, error: 'Loading organization context...' };
	}
	
	if (context.error) {
		return { isValid: false, error: context.error };
	}
	
	if (!context.hasOrganization) {
		return { 
			isValid: false, 
			error: 'No organization selected. Please select an organization to continue.' 
		};
	}
	
	return { 
		isValid: true, 
		organizationId: context.organizationId! 
	};
}

/**
 * Hook for Svelte components to get reactive organization context
 */
export function useOrganizationContext() {
	return {
		subscribe: organizationStore.subscribe,
		getCurrentContext: getOrganizationContext,
		validate: validateOrganizationContext,
		requireOrgId: requireOrganization,
		getOrgIdForQuery: getOrganizationIdForQuery,
		createConditionalArgs: createConditionalQueryArgs
	};
}
