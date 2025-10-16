import { writable, derived } from 'svelte/store';
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

export interface OrganizationContext {
	currentOrganization: Organization | null;
	currentStaffMember: StaffMember | null;
	availableOrganizations: Organization[];
	isLoading: boolean;
	error: string | null;
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
// STORE
// ==========================================
function createOrganizationStore() {
	const { subscribe, set, update } = writable<OrganizationContext>({
		currentOrganization: null,
		currentStaffMember: null,
		availableOrganizations: [],
		isLoading: false,
		error: null
	});

	return {
		subscribe,

		// Set available organizations (called when data loads from Convex)
		setAvailableOrganizations: (organizations: Organization[]) => {
			try {
				console.log('Setting available organizations:', organizations);
				update((state) => ({
					...state,
					availableOrganizations: organizations || []
				}));

				// If no current organization is set, try to restore from storage
				const storedOrgId = loadFromStorage();
				console.log('Stored org ID from localStorage:', storedOrgId);
				if (storedOrgId && organizations && organizations.length > 0) {
					const storedOrg = organizations.find((org) => org._id === storedOrgId);
					console.log('Found stored organization:', storedOrg);
					if (storedOrg) {
						update((state) => ({
							...state,
							currentOrganization: storedOrg
						}));
						console.log('Set current organization to:', storedOrg);
					}
				}
			} catch (error) {
				console.error('Error setting available organizations:', error);
			}
		},

		// Set current organization
		setCurrentOrganization: (organization: Organization) => {
			update((state) => ({
				...state,
				currentOrganization: organization,
				error: null
			}));

			// Save to localStorage for persistence
			saveToStorage(organization._id);
		},

		// Set current staff member
		setCurrentStaffMember: (staffMember: StaffMember) => {
			update((state) => ({
				...state,
				currentStaffMember: staffMember
			}));
		},

		// Switch to a different organization
		switchOrganization: (organizationId: string) => {
			update((state) => {
				const targetOrg = state.availableOrganizations.find((org) => org._id === organizationId);
				if (!targetOrg) {
					return {
						...state,
						error: `Organization with ID ${organizationId} not found`
					};
				}

				return {
					...state,
					currentOrganization: targetOrg,
					currentStaffMember: null, // Will need to be set separately
					error: null
				};
			});

			// Save to localStorage
			saveToStorage(organizationId);
		},

		// Set loading state
		setLoading: (isLoading: boolean) => {
			update((state) => ({
				...state,
				isLoading
			}));
		},

		// Set error state
		setError: (error: string | null) => {
			update((state) => ({
				...state,
				error
			}));
		},

		// Clear current organization (logout)
		clearCurrentOrganization: () => {
			update((state) => ({
				...state,
				currentOrganization: null,
				currentStaffMember: null
			}));

			clearStorage();
		},

		// Get current organization ID
		getCurrentOrganizationId: (): string | null => {
			let currentOrgId: string | null = null;
			const unsubscribe = subscribe((state) => {
				currentOrgId = state.currentOrganization?._id || null;
			});
			unsubscribe(); // Immediately unsubscribe after getting the value
			return currentOrgId;
		},

		// Check if user has permission for current organization
		hasPermission: (permission: string): boolean => {
			let hasPermission = false;
			const unsubscribe = subscribe((state) => {
				hasPermission = state.currentStaffMember?.permissions.includes(permission) || false;
			});
			unsubscribe(); // Immediately unsubscribe after getting the value
			return hasPermission;
		},

		// Check if user is admin for current organization
		isAdmin: (): boolean => {
			let isAdmin = false;
			const unsubscribe = subscribe((state) => {
				isAdmin = state.currentStaffMember?.role === 'admin' || false;
			});
			unsubscribe(); // Immediately unsubscribe after getting the value
			return isAdmin;
		},

		// Check if user is manager or admin for current organization
		isManagerOrAdmin: (): boolean => {
			let isManagerOrAdmin = false;
			const unsubscribe = subscribe((state) => {
				isManagerOrAdmin =
					state.currentStaffMember?.role === 'admin' ||
					state.currentStaffMember?.role === 'manager' ||
					false;
			});
			unsubscribe(); // Immediately unsubscribe after getting the value
			return isManagerOrAdmin;
		}
	};
}

// ==========================================
// EXPORT STORE
// ==========================================
export const organizationStore = createOrganizationStore();

// ==========================================
// DERIVED STORES
// ==========================================

// Current organization name for display
export const currentOrganizationName = derived(
	organizationStore,
	($store) => $store.currentOrganization?.name || 'No Organization Selected'
);

// Current organization type
export const currentOrganizationType = derived(
	organizationStore,
	($store) => $store.currentOrganization?.type || null
);

// Available organization options for dropdown
export const organizationOptions = derived(organizationStore, ($store) =>
	$store.availableOrganizations.map((org) => ({
		id: org._id,
		name: org.name,
		type: org.type,
		status: org.status
	}))
);

// Current user role
export const currentUserRole = derived(
	organizationStore,
	($store) => $store.currentStaffMember?.role || null
);

// Organization context summary
export const organizationContextSummary = derived(organizationStore, ($store) => ({
	organizationName: $store.currentOrganization?.name || 'None',
	userRole: $store.currentStaffMember?.role || 'None',
	organizationType: $store.currentOrganization?.type || 'None',
	isActive: $store.currentOrganization?.status === 'active',
	hasError: !!$store.error,
	isLoading: $store.isLoading
}));

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
