/// file: src/lib/stores/experts.svelte.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// ==========================================
// TYPES
// ==========================================
export interface PdcUserData {
	firstName: string;
	lastName: string;
	email: string;
	country: string;
}

export interface ServiceAssignment {
	service: string;
	role: 'regular' | 'lead';
}

export interface Experience {
	id: string;
	title: string;
	company: string;
	location: string;
	startDate: string;
	endDate: string;
	current: boolean;
	description: string;
}

export interface Education {
	id: string;
	school: string;
	degree: string;
	field: string;
	startDate: string;
	endDate: string;
	description: string;
}

export interface Expert {
	id: string;
	pdcData: PdcUserData;
	services: ServiceAssignment[];
	experience: Experience[];
	education: Education[];
	createdAt: string;
	updatedAt: string;
}

// ==========================================
// STORAGE UTILITIES
// ==========================================
const STORAGE_KEY = 'spp_experts';

function loadFromStorage(): Expert[] {
	if (!browser) return [];
	
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (error) {
		console.error('Error loading experts from localStorage:', error);
		return [];
	}
}

function saveToStorage(experts: Expert[]): void {
	if (!browser) return;
	
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(experts));
	} catch (error) {
		console.error('Error saving experts to localStorage:', error);
	}
}

// ==========================================
// STORE
// ==========================================
function createExpertsStore() {
	const { subscribe, set, update } = writable<Expert[]>(loadFromStorage());

	return {
		subscribe,
		
		// Add new expert
		addExpert: (expert: Omit<Expert, 'id' | 'createdAt' | 'updatedAt'>) => {
			const newExpert: Expert = {
				...expert,
				id: crypto.randomUUID(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			
			update(experts => {
				const updated = [...experts, newExpert];
				saveToStorage(updated);
				return updated;
			});
			
			return newExpert.id;
		},
		
		// Update existing expert
		updateExpert: (id: string, updates: Partial<Expert>) => {
			update(experts => {
				const updated = experts.map(expert => 
					expert.id === id 
						? { ...expert, ...updates, updatedAt: new Date().toISOString() }
						: expert
				);
				saveToStorage(updated);
				return updated;
			});
		},
		
		// Remove expert
		removeExpert: (id: string) => {
			update(experts => {
				const updated = experts.filter(expert => expert.id !== id);
				saveToStorage(updated);
				return updated;
			});
		},
		
		// Get expert by ID
		getExpert: (id: string): Expert | undefined => {
			let expert: Expert | undefined;
			update(experts => {
				expert = experts.find(e => e.id === id);
				return experts; // Don't modify the array
			});
			return expert;
		},
		
		// Get experts by service
		getExpertsByService: (service: string): Expert[] => {
			let filtered: Expert[] = [];
			update(experts => {
				filtered = experts.filter(expert => 
					expert.services.some(s => s.service === service)
				);
				return experts; // Don't modify the array
			});
			return filtered;
		},
		
		// Get LEAD experts for a service
		getLeadExperts: (service: string): Expert[] => {
			let leads: Expert[] = [];
			update(experts => {
				leads = experts.filter(expert => 
					expert.services.some(s => s.service === service && s.role === 'lead')
				);
				return experts; // Don't modify the array
			});
			return leads;
		},
		
		// Clear all data (for testing)
		clearAll: () => {
			set([]);
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
		},
		
		// Export data (for backup)
		exportData: (): string => {
			let experts: Expert[] = [];
			update(current => {
				experts = current;
				return current; // Don't modify
			});
			return JSON.stringify(experts, null, 2);
		},
		
		// Import data (for restore)
		importData: (jsonData: string) => {
			try {
				const experts = JSON.parse(jsonData);
				set(experts);
				saveToStorage(experts);
				return true;
			} catch (error) {
				console.error('Error importing experts data:', error);
				return false;
			}
		}
	};
}

// ==========================================
// EXPORT STORE
// ==========================================
export const expertsStore = createExpertsStore();

// ==========================================
// DERIVED STORES
// ==========================================
import { derived } from 'svelte/store';

// Count of total experts
export const expertCount = derived(expertsStore, experts => experts.length);

// Count of experts per service
export const expertsByService = derived(expertsStore, experts => {
	const serviceMap = new Map<string, number>();
	experts.forEach(expert => {
		expert.services.forEach(service => {
			const count = serviceMap.get(service.service) || 0;
			serviceMap.set(service.service, count + 1);
		});
	});
	return Object.fromEntries(serviceMap);
});

// LEAD experts per service
export const leadExpertsByService = derived(expertsStore, experts => {
	const leadMap = new Map<string, number>();
	experts.forEach(expert => {
		expert.services.forEach(service => {
			if (service.role === 'lead') {
				const count = leadMap.get(service.service) || 0;
				leadMap.set(service.service, count + 1);
			}
		});
	});
	return Object.fromEntries(leadMap);
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
export function createExpertFromWizardData(data: {
	pdcData: PdcUserData;
	services: ServiceAssignment[];
	experience: Experience[];
	education: Education[];
}): Omit<Expert, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		pdcData: data.pdcData,
		services: data.services,
		experience: data.experience,
		education: data.education
	};
}

export function formatExpertName(expert: Expert): string {
	return `${expert.pdcData.firstName} ${expert.pdcData.lastName}`;
}

export function getExpertServices(expert: Expert): string[] {
	return expert.services.map(s => s.service);
}

export function getExpertLeadServices(expert: Expert): string[] {
	return expert.services
		.filter(s => s.role === 'lead')
		.map(s => s.service);
}
