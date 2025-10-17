import { useConvexClient, useQuery } from 'convex-svelte';
import { api } from '$lib';
import type { Id } from '$lib';

export interface ExpertEditState {
  // Core data
  expertId: string;
  userId: string;
  validOrgId: string;
  currentCVData: any;
  
  // User state (mutable)
  userSelectedServices: string[];
  userServiceRoles: Record<string, 'lead' | 'regular'>;
  userExperience: any[];
  userEducation: any[];
  
  // Loading and error states
  isLoading: boolean;
  hasError: boolean;
  isSaving: boolean;
  saveError: string | null;
  
  // Initialization
  hasInitialized: boolean;
}

export const expertEditState = $state<ExpertEditState>({
  expertId: '',
  userId: '',
  validOrgId: '',
  currentCVData: null,
  userSelectedServices: [],
  userServiceRoles: {},
  userExperience: [],
  userEducation: [],
  isLoading: false,
  hasError: false,
  isSaving: false,
  saveError: null,
  hasInitialized: false
});

// Store methods
export const expertEditStore = {
  // Initialize the store with expert data
  initialize(expertId: string, organizationId: string) {
    expertEditState.expertId = expertId;
    expertEditState.validOrgId = organizationId || 'j975t878dn66x7br1076wb7ey17skxyg';
  },

  // Update user state
  updateSelectedServices(services: string[]) {
    expertEditState.userSelectedServices = services;
  },

  updateServiceRoles(roles: Record<string, 'lead' | 'regular'>) {
    expertEditState.userServiceRoles = roles;
  },

  updateExperience(experience: any[]) {
    expertEditState.userExperience = experience;
  },

  updateEducation(education: any[]) {
    expertEditState.userEducation = education;
  },

  // Toggle service selection
  toggleService(serviceName: string) {
    if (expertEditState.userSelectedServices.includes(serviceName)) {
      expertEditState.userSelectedServices = expertEditState.userSelectedServices.filter((s) => s !== serviceName);
      delete expertEditState.userServiceRoles[serviceName];
    } else {
      expertEditState.userSelectedServices = [...expertEditState.userSelectedServices, serviceName];
      expertEditState.userServiceRoles[serviceName] = 'regular';
    }
  },

  // Toggle service role
  toggleRole(serviceName: string) {
    const oldRole = expertEditState.userServiceRoles[serviceName];
    const newRole = oldRole === 'lead' ? 'regular' : 'lead';
    expertEditState.userServiceRoles[serviceName] = newRole;
  },

  // Save state management
  setSaving(saving: boolean) {
    expertEditState.isSaving = saving;
  },

  setSaveError(error: string | null) {
    expertEditState.saveError = error;
  },

  // Initialize user state from derived data
  initializeUserState(selectedServices: string[], serviceRoles: Record<string, 'lead' | 'regular'>, experience: any[], education: any[]) {
    if (!expertEditState.hasInitialized && (selectedServices.length > 0 || Object.keys(serviceRoles).length > 0 || experience.length > 0 || education.length > 0)) {
      console.log('Initializing user state from derived state');
      expertEditState.userSelectedServices = [...selectedServices];
      expertEditState.userServiceRoles = { ...serviceRoles };
      expertEditState.userExperience = [...experience];
      expertEditState.userEducation = [...education];
      expertEditState.hasInitialized = true;
    }
  },

  // Reset store
  reset() {
    expertEditState.expertId = '';
    expertEditState.userId = '';
    expertEditState.validOrgId = '';
    expertEditState.currentCVData = null;
    expertEditState.userSelectedServices = [];
    expertEditState.userServiceRoles = {};
    expertEditState.userExperience = [];
    expertEditState.userEducation = [];
    expertEditState.isLoading = false;
    expertEditState.hasError = false;
    expertEditState.isSaving = false;
    expertEditState.saveError = null;
    expertEditState.hasInitialized = false;
  }
};

// Legacy store interface for backward compatibility
export const expertEditStoreLegacy = {
  subscribe: (callback: (value: ExpertEditState) => void) => {
    callback(expertEditState);
    return () => {};
  },
  ...expertEditStore
};

// Data fetching - these need to be called at component level, not in functions
export function createExpertEditQueries(expertId: string, organizationId: string) {
  // This function is deprecated - queries must be called directly in components
  console.warn('createExpertEditQueries is deprecated. Call queries directly in components.');
  return null;
}
  
  // Utility function to get available services
  export function getAvailableServices(
    serviceVersionsData: any[],
    organizationApprovalsData: any[],
    validOrgId: string
  ): any[] {
    // PROTOTYPE MODE: Show all services if:
    // 1. No organization is selected, OR
    // 2. No organization approvals exist
    if (!validOrgId || !organizationApprovalsData?.length) {
      return (serviceVersionsData || []).map((service: any) => ({
        name: service.name,
        _id: service._id
      }));
    }
  
    return (serviceVersionsData?.filter((service: any) =>
      organizationApprovalsData?.some(
        (approval: any) => approval.serviceVersionId === service._id
      )
    ) || []).map((service: any) => ({
      name: service.name,
      _id: service._id
    }));
  }
  
  // Utility function to get selected services from assignments
  export function getSelectedServices(
    currentCVData: any,
    existingServiceAssignments: any[],
    serviceVersionsData: any[]
  ): string[] {
    if (!currentCVData || !existingServiceAssignments || !serviceVersionsData) {
      return [];
    }
    
    // Only include active assignments (not inactive)
    const activeAssignments = existingServiceAssignments.filter(
      (assignment: any) => assignment.status !== 'inactive'
    );
    
    const services = activeAssignments.map((assignment: any) => {
      const serviceVersion = serviceVersionsData.find(
        (version: any) => version._id === assignment.serviceVersionId
      );
      return serviceVersion?.name || '';
    }).filter(Boolean);
    
    return services;
  }
  
  // Utility function to get service roles from assignments
  export function getServiceRoles(
    currentCVData: any,
    existingServiceAssignments: any[],
    serviceVersionsData: any[]
  ): Record<string, 'lead' | 'regular'> {
    if (!currentCVData || !existingServiceAssignments || !serviceVersionsData) {
      return {};
    }
    
    // Only include active assignments (not inactive)
    const activeAssignments = existingServiceAssignments.filter(
      (assignment: any) => assignment.status !== 'inactive'
    );
    
    const roles: Record<string, 'lead' | 'regular'> = {};
    
    activeAssignments.forEach((assignment: any) => {
      const serviceVersion = serviceVersionsData.find(
        (version: any) => version._id === assignment.serviceVersionId
      );
      if (serviceVersion?.name) {
        roles[serviceVersion.name] = assignment.role || 'regular';
      }
    });
    
    return roles;
  }