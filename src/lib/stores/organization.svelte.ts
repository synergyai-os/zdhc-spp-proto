import { browser } from '$app/environment';

// ==========================================
// TYPES
// ==========================================
export interface Organization {
	_id: string;
	name: string;
	type: 'solution_provider' | 'zdhc_staff';
	contactEmail: string;
	status: 'active' | 'inactive' | 'suspended';
	createdAt: number;
	updatedAt: number;
}

export interface StaffMember {
	_id: string;
	userId: string;
	organizationId: string;
	role: 'admin' | 'manager' | 'viewer';
	permissions: string[];
	isActive: boolean;
	joinedAt: number;
	lastLoginAt?: number;
}

export interface UserSession {
	_id: string;
	userId: string;
	staffMemberId: string;
	organizationId: string;
	sessionToken: string;
	expiresAt: number;
	createdAt: number;
}

// ==========================================
// STORAGE UTILITIES
// ==========================================
const STORAGE_KEY = 'spp_current_organization';

function loadFromStorage(): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch (error) {
		console.error('Error loading organization from localStorage:', error);
		return null;
	}
}

function saveToStorage(organizationId: string): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, organizationId);
	} catch (error) {
		console.error('Error saving organization to localStorage:', error);
	}
}

function clearStorage(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		console.error('Error clearing organization from localStorage:', error);
	}
}

// ==========================================
// MODERN SVELTE 5 STATE STORE
// ==========================================

// Create the reactive state object
export const organizationState = $state({
	currentOrganization: null as Organization | null,
	currentStaffMember: null as StaffMember | null,
	availableOrganizations: [] as Organization[],
	isLoading: false,
	error: null as string | null,
	
	// Methods for managing state
	setAvailableOrganizations(organizations: Organization[]) {
		console.log('Setting available organizations:', organizations);
		this.availableOrganizations = organizations || [];
		this.isLoading = false;
		
		// If no current organization is set, try to restore from storage
		if (!this.currentOrganization && organizations && organizations.length > 0) {
			const storedOrgId = loadFromStorage();
			console.log('Stored org ID from localStorage:', storedOrgId);
			
			if (storedOrgId) {
				const storedOrg = organizations.find((org) => org._id === storedOrgId);
				if (storedOrg) {
					console.log('Found stored organization:', storedOrg);
					this.currentOrganization = storedOrg;
					this.error = null;
				}
			}
			
			// If still no organization selected, select the first one
			if (!this.currentOrganization) {
				const firstOrg = organizations[0];
				console.log('No organization selected, setting first organization:', firstOrg);
				this.currentOrganization = firstOrg;
				saveToStorage(firstOrg._id);
				this.error = null;
			}
		}
	},
	
	setCurrentOrganization(organization: Organization) {
		console.log('Setting current organization:', organization);
		this.currentOrganization = organization;
		this.error = null;
		saveToStorage(organization._id);
	},
	
	setCurrentStaffMember(staffMember: StaffMember) {
		this.currentStaffMember = staffMember;
	},
	
	switchOrganization(organizationId: string) {
		const targetOrg = this.availableOrganizations.find((org) => org._id === organizationId);
		if (!targetOrg) {
			this.error = `Organization with ID ${organizationId} not found`;
			return;
		}
		
		this.currentOrganization = targetOrg;
		this.currentStaffMember = null; // Will need to be set separately
		this.error = null;
		saveToStorage(organizationId);
	},
	
	setLoading(isLoading: boolean) {
		this.isLoading = isLoading;
	},
	
	setError(error: string | null) {
		this.error = error;
	},
	
	clearCurrentOrganization() {
		this.currentOrganization = null;
		this.currentStaffMember = null;
		clearStorage();
	},
	
	// Getters for computed values
	get hasCurrentOrganization() {
		return this.currentOrganization !== null;
	},
	
	get currentOrganizationId() {
		return this.currentOrganization?._id || null;
	},
	
	get organizationName() {
		return this.currentOrganization?.name || 'No Organization Selected';
	},
	
	get organizationType() {
		return this.currentOrganization?.type || null;
	},
	
	get userRole() {
		return this.currentStaffMember?.role || null;
	},
	
	get isAdmin() {
		return this.currentStaffMember?.role === 'admin';
	},
	
	get isManagerOrAdmin() {
		return this.currentStaffMember?.role === 'admin' || this.currentStaffMember?.role === 'manager';
	},
	
	hasPermission(permission: string): boolean {
		return this.currentStaffMember?.permissions.includes(permission) || false;
	},
	
	// Validation for OrganizationRequired component
	get validate() {
		if (this.isLoading) {
			return { isValid: false, message: 'Loading organization context...', isLoading: true, error: null };
		}
		if (this.error) {
			return { isValid: false, message: this.error, isLoading: false, error: this.error };
		}
		if (!this.currentOrganization) {
			if (this.availableOrganizations.length > 0) {
				return {
					isValid: false,
					message: 'Please select an organization to continue.',
					isLoading: false,
					error: 'No organization selected'
				};
			} else {
				return {
					isValid: false,
					message: 'No organizations available in the system. Please contact an administrator.',
					isLoading: false,
					error: 'No organizations available'
				};
			}
		}
		return { isValid: true, message: 'Organization context is valid.', isLoading: false, error: null };
	}
});

// ==========================================
// COMPUTED VALUES (for compatibility)
// ==========================================

// These provide the same interface as the old derived stores
export const currentOrganizationName = () => organizationState.organizationName;
export const currentOrganizationType = () => organizationState.organizationType;
export const currentUserRole = () => organizationState.userRole;
export const organizationOptions = () => 
	organizationState.availableOrganizations.map((org) => ({
		id: org._id,
		name: org.name,
		type: org.type,
		status: org.status
	}));

export const organizationContextSummary = () => ({
	organizationName: organizationState.organizationName,
	userRole: organizationState.userRole,
	organizationType: organizationState.organizationType,
	isActive: organizationState.currentOrganization?.status === 'active',
	hasError: !!organizationState.error,
	isLoading: organizationState.isLoading
});

// ==========================================
// LEGACY COMPATIBILITY
// ==========================================

// For backward compatibility with existing code that uses $organizationStore
export const organizationStore = {
	subscribe: (callback: (value: typeof organizationState) => void) => {
		// This is a simplified subscription that just calls the callback immediately
		// In Svelte 5, we rely on direct state access instead of subscriptions
		callback(organizationState);
		return () => {}; // No-op unsubscribe
	},
	
	// Delegate all methods to the state object
	setAvailableOrganizations: (orgs: Organization[]) => organizationState.setAvailableOrganizations(orgs),
	setCurrentOrganization: (org: Organization) => organizationState.setCurrentOrganization(org),
	setCurrentStaffMember: (staff: StaffMember) => organizationState.setCurrentStaffMember(staff),
	switchOrganization: (id: string) => organizationState.switchOrganization(id),
	setLoading: (loading: boolean) => organizationState.setLoading(loading),
	setError: (error: string | null) => organizationState.setError(error),
	clearCurrentOrganization: () => organizationState.clearCurrentOrganization(),
	getCurrentOrganizationId: () => organizationState.currentOrganizationId,
	hasPermission: (permission: string) => organizationState.hasPermission(permission),
	isAdmin: () => organizationState.isAdmin,
	isManagerOrAdmin: () => organizationState.isManagerOrAdmin
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function formatOrganizationName(org: Organization): string {
	return `${org.name} (${org.type === 'solution_provider' ? 'SPP' : 'ZDHC'})`;
}

export function getOrganizationStatusColor(status: Organization['status']): string {
	switch (status) {
		case 'active':
			return 'green';
		case 'inactive':
			return 'gray';
		case 'suspended':
			return 'red';
		default:
			return 'gray';
	}
}

export function canSwitchToOrganization(org: Organization): boolean {
	return org.status === 'active';
}

export function getRoleDisplayName(role: StaffMember['role']): string {
	switch (role) {
		case 'admin':
			return 'Administrator';
		case 'manager':
			return 'Manager';
		case 'viewer':
			return 'Viewer';
		default:
			return 'Unknown';
	}
}