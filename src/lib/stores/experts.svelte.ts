import { writable, derived } from 'svelte/store';
import type { Id } from '../../convex/_generated/dataModel';

// ==========================================
// TYPES
// ==========================================

export interface ExpertUser {
  _id: Id<"users">;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phone?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ExpertAssignment {
  _id: Id<"expertAssignments">;
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  serviceVersionId: Id<"serviceVersions">;
  role?: 'lead' | 'regular';
  status: 'draft' | 'paid' | 'ready_for_training' | 'training_started' | 'training_completed' | 'approved' | 'rejected' | 'inactive';
  experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  assignedAt: number;
  assignedBy: string;
  notes?: string;
  // Profile completion tracking
  profileCompletionStep?: number;
  isProfileComplete?: boolean;
  // Workflow tracking
  submittedAt?: number;
  paidAt?: number;
  trainingInvitedAt?: number;
  trainingStartedAt?: number;
  trainingCompletedAt?: number;
  approvedAt?: number;
  approvedBy?: string;
  rejectedAt?: number;
  rejectedBy?: string;
  rejectionReason?: string;
  // Populated fields from Convex queries
  user?: ExpertUser;
  serviceVersion?: ServiceVersion;
  organization?: {
    _id: Id<"organizations">;
    name: string;
  };
}

export interface ServiceVersion {
  _id: Id<"serviceVersions">;
  parentId: Id<"serviceParents">;
  version: string;
  name: string;
  description: string;
  isActive: boolean;
  releasedAt: number;
  deprecatedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ServiceParent {
  _id: Id<"serviceParents">;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ExpertGroup {
  user: ExpertUser;
  assignments: ExpertAssignment[];
  services: string[];
  serviceCount: number;
}

export interface ExpertTableRow {
  id: string;
  name: string;
  email: string;
  avatar: string;
  services: Array<{
    name: string;
    isLead: boolean;
    status: string;
  }>;
  currentStatus: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  nextAction: string;
  hasLeadRole: boolean;
  totalAssignments: number;
  // Profile completion tracking
  isProfileComplete?: boolean;
  profileCompletionStep?: number;
  isActive?: boolean; // User's active status
}

// ==========================================
// STORE
// ==========================================

interface ExpertStoreState {
  expertAssignments: ExpertAssignment[];
  serviceVersions: ServiceVersion[];
  serviceParents: ServiceParent[];
  isLoading: boolean;
  error: string | null;
}

function createExpertStore() {
  const { subscribe, set, update } = writable<ExpertStoreState>({
    expertAssignments: [],
    serviceVersions: [],
    serviceParents: [],
    isLoading: false,
    error: null,
  });

  return {
    subscribe,
    
    // Set expert assignments data
    setExpertAssignments: (assignments: ExpertAssignment[]) => {
      update(state => ({
        ...state,
        expertAssignments: assignments,
        error: null,
      }));
    },
    
    // Set service versions data
    setServiceVersions: (versions: ServiceVersion[]) => {
      update(state => ({
        ...state,
        serviceVersions: versions,
      }));
    },
    
    // Set service parents data
    setServiceParents: (parents: ServiceParent[]) => {
      update(state => ({
        ...state,
        serviceParents: parents,
      }));
    },
    
    // Set loading state
    setLoading: (isLoading: boolean) => {
      update(state => ({
        ...state,
        isLoading,
      }));
    },
    
    // Set error state
    setError: (error: string | null) => {
      update(state => ({
        ...state,
        error,
      }));
    },
    
    // Clear all data
    clear: () => {
      set({
        expertAssignments: [],
        serviceVersions: [],
        serviceParents: [],
        isLoading: false,
        error: null,
      });
    },
  };
}

export const expertStore = createExpertStore();

// ==========================================
// DERIVED STORES
// ==========================================

// Group experts by user (for card view)
export const expertsGroupedByUser = derived(
  expertStore,
  ($store) => {
    if (!$store.expertAssignments.length) return [];
    
    // Group assignments by user ID
    const userGroups = new Map<string, ExpertGroup>();
    
    $store.expertAssignments.forEach((assignment) => {
      const userId = assignment.userId;
      if (!userGroups.has(userId)) {
        userGroups.set(userId, {
          user: assignment as any, // Will be enriched with user data
          assignments: [],
          services: [],
          serviceCount: 0,
        });
      }
      
      const group = userGroups.get(userId)!;
      group.assignments.push(assignment);
      
      // Find service version name
      const serviceVersion = $store.serviceVersions.find(sv => sv._id === assignment.serviceVersionId);
      if (serviceVersion) {
        group.services.push(serviceVersion.name);
      }
    });
    
    // Convert to array and add service count
    return Array.from(userGroups.values()).map(group => ({
      ...group,
      serviceCount: group.services.length,
      services: Array.from(new Set(group.services)), // Remove duplicates
    }));
  }
);

// Convert to table format (for table view) - only verified/active users
export const expertsTableData = derived(
  expertStore,
  ($store) => {
    if (!$store.expertAssignments.length) return [];
    
    // Group assignments by user ID
    const userGroups = new Map<string, ExpertTableRow>();
    
    $store.expertAssignments.forEach((assignment) => {
      const userId = assignment.userId;
      
      // Skip users who are not verified/active in PDC
      if (!isUserVerified(assignment)) {
        return;
      }
      
      if (!userGroups.has(userId)) {
        // Find service version for this assignment
        const serviceVersion = $store.serviceVersions.find(sv => sv._id === assignment.serviceVersionId);
        
        userGroups.set(userId, {
          id: assignment._id, // Use assignment ID for editing
          name: `${assignment.user?.firstName || ''} ${assignment.user?.lastName || ''}`.trim() || assignment.user?.email || 'Unknown',
          email: assignment.user?.email || '',
          avatar: `${assignment.user?.firstName?.[0] || ''}${assignment.user?.lastName?.[0] || ''}` || '?',
          services: [],
          currentStatus: assignment.status,
          paymentStatus: getPaymentStatus(assignment),
          nextAction: getNextAction(assignment),
          hasLeadRole: assignment.role === 'lead',
          totalAssignments: 0,
          // Profile completion tracking
          isProfileComplete: assignment.isProfileComplete,
          profileCompletionStep: assignment.profileCompletionStep,
          isActive: assignment.user?.isActive,
        });
      }
      
      const row = userGroups.get(userId)!;
      const serviceVersion = $store.serviceVersions.find(sv => sv._id === assignment.serviceVersionId);
      
      // Check if this is a shell assignment (has a service but profileCompletionStep is 2)
      const isShellAssignment = assignment.profileCompletionStep === 2 && !assignment.experience?.length && !assignment.education?.length;
      
      if (serviceVersion && !isShellAssignment) {
        row.services.push({
          name: serviceVersion.name,
          isLead: assignment.role === 'lead',
          status: assignment.status,
        });
      } else {
        // Handle shell assignments (has placeholder service but not actually selected)
        row.services.push({
          name: 'Awaiting service selection',
          isLead: false,
          status: 'pending_service',
        });
      }
      
      row.totalAssignments++;
      
      // Update current status to most advanced status
      if (getStatusPriority(assignment.status) > getStatusPriority(row.currentStatus)) {
        row.currentStatus = assignment.status;
      }
      
      // Update payment status
      const newPaymentStatus = getPaymentStatus(assignment);
      if (newPaymentStatus === 'paid' || (newPaymentStatus === 'pending' && row.paymentStatus === 'unpaid')) {
        row.paymentStatus = newPaymentStatus;
      }
      
      // Update next action
      row.nextAction = getNextAction(assignment);
    });
    
    return Array.from(userGroups.values());
  }
);

// Convert to pending verification format (for unverified users)
export const pendingVerificationData = derived(
  expertStore,
  ($store) => {
    if (!$store.expertAssignments.length) return [];
    
    // Group assignments by user ID
    const userGroups = new Map<string, ExpertTableRow>();
    
    $store.expertAssignments.forEach((assignment) => {
      const userId = assignment.userId;
      
      // Only include users who are NOT verified/active in PDC
      if (isUserVerified(assignment)) {
        return;
      }
      
      if (!userGroups.has(userId)) {
        // Find service version for this assignment
        const serviceVersion = $store.serviceVersions.find(sv => sv._id === assignment.serviceVersionId);
        
        userGroups.set(userId, {
          id: assignment._id, // Use assignment ID for editing
          name: `${assignment.user?.firstName || ''} ${assignment.user?.lastName || ''}`.trim() || assignment.user?.email || 'Unknown',
          email: assignment.user?.email || '',
          avatar: `${assignment.user?.firstName?.[0] || ''}${assignment.user?.lastName?.[0] || ''}` || '?',
          services: [],
          currentStatus: 'pending_verification',
          paymentStatus: 'unpaid',
          nextAction: 'Verify PDC Account',
          hasLeadRole: assignment.role === 'lead',
          totalAssignments: 0,
          // Profile completion tracking
          isProfileComplete: assignment.isProfileComplete,
          profileCompletionStep: assignment.profileCompletionStep,
          isActive: assignment.user?.isActive,
        });
      }
      
      const row = userGroups.get(userId)!;
      const serviceVersion = $store.serviceVersions.find(sv => sv._id === assignment.serviceVersionId);
      
      // Check if this is a shell assignment (has a service but profileCompletionStep is 2)
      const isShellAssignment = assignment.profileCompletionStep === 2 && !assignment.experience?.length && !assignment.education?.length;
      
      if (serviceVersion && !isShellAssignment) {
        row.services.push({
          name: serviceVersion.name,
          isLead: assignment.role === 'lead',
          status: 'pending_verification',
        });
      } else {
        // Handle shell assignments (has placeholder service but not actually selected)
        row.services.push({
          name: 'Awaiting service selection',
          isLead: false,
          status: 'pending_service',
        });
      }
      
      row.totalAssignments++;
    });
    
    return Array.from(userGroups.values());
  }
);

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function isUserVerified(assignment: ExpertAssignment): boolean {
  // Active users show in main table regardless of draft status
  if (assignment.user?.isActive === true) {
    return true;
  }
  // Inactive users (invited, not verified) always show in pending section
  return false;
}

function getStatusPriority(status: string): number {
  const priorities: Record<string, number> = {
    'draft': 1,
    'paid': 2,
    'ready_for_training': 3,
    'training_started': 4,
    'training_completed': 5,
    'approved': 6,
    'rejected': 0,
    'inactive': 0,
  };
  return priorities[status] || 0;
}

function getPaymentStatus(assignment: ExpertAssignment): 'paid' | 'unpaid' | 'pending' {
  if (assignment.paidAt) return 'paid';
  if (assignment.status === 'draft') return 'unpaid';
  if (assignment.status === 'paid') return 'paid';
  return 'pending';
}

function getNextAction(assignment: ExpertAssignment): string {
  switch (assignment.status) {
    case 'draft':
      return 'Process Payment';
    case 'paid':
      return 'Invite to Training';
    case 'ready_for_training':
      return 'Start Training';
    case 'training_started':
      return 'Complete Training';
    case 'training_completed':
      return 'Approve Expert';
    case 'approved':
      return 'Active';
    case 'rejected':
      return 'Review Rejection';
    case 'inactive':
      return 'Reactivate';
    default:
      return 'Review';
  }
}

// ==========================================
// EXPORT UTILITIES
// ==========================================

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'paid': 'bg-blue-100 text-blue-800',
    'ready_for_training': 'bg-yellow-100 text-yellow-800',
    'training_started': 'bg-orange-100 text-orange-800',
    'training_completed': 'bg-purple-100 text-purple-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'inactive': 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPaymentStatusColor(status: 'paid' | 'unpaid' | 'pending'): string {
  const colors: Record<string, string> = {
    'paid': 'bg-green-100 text-green-800',
    'unpaid': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}