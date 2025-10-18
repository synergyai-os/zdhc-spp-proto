import type { Id } from '$lib';
import { api } from '$lib';
import type { ConvexClient } from 'convex-svelte';

// Service assignment data structures
export interface ServiceAssignment {
  _id: string;
  serviceVersionId: string;
  role: 'lead' | 'regular';
  status: 'pending_review' | 'approved' | 'rejected' | 'inactive';
}

export interface ServiceVersion {
  _id: string;
  name: string;
}

export interface ServiceAssignmentSyncParams {
  currentCVData: {
    _id: string;
  };
  userId: string;
  validOrgId: string;
  userSelectedServices: string[];
  userServiceRoles: Record<string, 'lead' | 'regular'>;
  existingServiceAssignments: ServiceAssignment[];
  serviceVersionsData: ServiceVersion[];
}

export interface ServiceAssignmentSyncResult {
  success: boolean;
  error?: string;
  assignmentsCreated: number;
  assignmentsUpdated: number;
  assignmentsRemoved: number;
}


export async function saveExpertProfile(
  client: ConvexClient,
  params: {
    cvId: Id<'expertCVs'>;
    experience: any[];
    education: any[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await client.mutation(api.expertCVs.updateExpertCV, {
      id: params.cvId,
      experience: params.experience,
      education: params.education
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving expert profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while saving'
    };
  }
}

export async function saveExpertProfileWithServices(
  client: ConvexClient,
  params: {
    cvId: Id<'expertCVs'>;
    experience: any[];
    education: any[];
    userSelectedServices: string[];
    userServiceRoles: Record<string, 'lead' | 'regular'>;
    existingServiceAssignments: ServiceAssignment[];
    serviceVersionsData: ServiceVersion[];
    userId: string;
    validOrgId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Save CV data first
    const cvResult = await saveExpertProfile(client, {
      cvId: params.cvId,
      experience: params.experience,
      education: params.education
    });

    if (!cvResult.success) {
      return cvResult;
    }

    // 2. Check if there are service changes
    console.log('🔍 Checking for service changes...');
    console.log('🔍 User selected services:', params.userSelectedServices);
    console.log('🔍 Existing assignments:', params.existingServiceAssignments);
    console.log('🔍 Service versions data:', params.serviceVersionsData);
    
    const hasServiceChanges = checkForServiceChanges(
      params.userSelectedServices,
      params.userServiceRoles,
      params.existingServiceAssignments,
      params.serviceVersionsData
    );

    console.log('🔍 Has service changes:', hasServiceChanges);

    if (!hasServiceChanges) {
      console.log('No service changes detected, skipping service sync');
      return { success: true };
    }

    // 3. Sync service assignments if there are changes
    const serviceResult = await syncServiceAssignments(client, {
      currentCVData: { _id: params.cvId },
      userId: params.userId,
      validOrgId: params.validOrgId,
      userSelectedServices: params.userSelectedServices,
      userServiceRoles: params.userServiceRoles,
      existingServiceAssignments: params.existingServiceAssignments,
      serviceVersionsData: params.serviceVersionsData
    });

    return serviceResult;
  } catch (error) {
    console.error('Error saving expert profile with services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while saving'
    };
  }
}

// Helper function to check if services have changed
function checkForServiceChanges(
  userSelectedServices: string[],
  userServiceRoles: Record<string, 'lead' | 'regular'>,
  existingServiceAssignments: ServiceAssignment[],
  serviceVersionsData: ServiceVersion[]
): boolean {
  console.log('🫥 checkForServiceChanges - Input data:');
  console.log('  - userSelectedServices:', userSelectedServices);
  console.log('  - userServiceRoles:', userServiceRoles);
  console.log('  - existingServiceAssignments:', existingServiceAssignments);
  console.log('  - serviceVersionsData length:', serviceVersionsData.length);
  
  // Get current service names from existing assignments
  const currentServices = existingServiceAssignments
    .filter(assignment => assignment.status !== 'inactive')
    .map(assignment => {
      const serviceVersion = serviceVersionsData.find(
        version => version._id === assignment.serviceVersionId
      );
      return serviceVersion?.name || '';
    })
    .filter(Boolean);
  
  console.log('🫥 Current services from DB:', currentServices);
  
  // Check if selected services match existing services
  const servicesChanged = 
    userSelectedServices.length !== currentServices.length ||
    !userSelectedServices.every(service => currentServices.includes(service));
  
  console.log('🫥 Services changed:', servicesChanged);
  console.log('  - Length match:', userSelectedServices.length === currentServices.length);
  console.log('  - All services match:', userSelectedServices.every(service => currentServices.includes(service)));
  
  // Check if roles have changed
  const rolesChanged = existingServiceAssignments.some(assignment => {
    const serviceVersion = serviceVersionsData.find(
      version => version._id === assignment.serviceVersionId
    );
    const serviceName = serviceVersion?.name;
    if (!serviceName) return false;
    
    const currentRole = assignment.role;
    const newRole = userServiceRoles[serviceName];
    return newRole && newRole !== currentRole;
  });

  console.log('🫥 Roles changed:', rolesChanged);
  console.log('🫥 Final result (servicesChanged || rolesChanged):', servicesChanged || rolesChanged);

  return servicesChanged || rolesChanged;
}

export async function syncServiceAssignments(
  client: ConvexClient,
  params: ServiceAssignmentSyncParams
): Promise<ServiceAssignmentSyncResult> {
  const {
    currentCVData,
    userId,
    validOrgId,
    userSelectedServices,
    userServiceRoles,
    existingServiceAssignments,
    serviceVersionsData
  } = params;

  try {
    console.log('Starting service assignment sync...');
    console.log('User selected services:', userSelectedServices);
    console.log('User service roles:', userServiceRoles);

    // Get ALL current assignments (including inactive ones)
    const allCurrentAssignments = existingServiceAssignments || [];
    console.log('All current assignments:', allCurrentAssignments);

    // Create a map of service name to service version ID for easier lookup
    const serviceNameToId = new Map<string, string>();
    serviceVersionsData.forEach((service) => {
      serviceNameToId.set(service.name, service._id);
    });

    let assignmentsCreated = 0;
    let assignmentsUpdated = 0;
    let assignmentsRemoved = 0;

    // Process each user-selected service
    for (const serviceName of userSelectedServices) {
      const serviceVersionId = serviceNameToId.get(serviceName);
      if (!serviceVersionId) {
        console.warn(`Service version not found for: ${serviceName}`);
        continue;
      }

      const desiredRole = userServiceRoles[serviceName] || 'regular';
      
      // Find existing assignment for this service
      const existingAssignment = allCurrentAssignments.find((assignment) => 
        assignment.serviceVersionId === serviceVersionId
      );

      if (existingAssignment) {
        // Update existing assignment if role changed
        if (existingAssignment.role !== desiredRole) {
          console.log(`Updating role for ${serviceName}: ${existingAssignment.role} -> ${desiredRole}`);
          // First delete the old assignment completely
          await client.mutation(api.expertServiceAssignments.deleteAssignment, {
            assignmentId: existingAssignment._id
          });
          // Create new assignment with updated role
          await client.mutation(api.expertServiceAssignments.createMultipleServiceAssignments, {
            organizationId: validOrgId as Id<'organizations'>,
            userId: userId as Id<'users'>,
            expertCVId: currentCVData._id as Id<'expertCVs'>,
            assignedBy: 'system',
            serviceAssignments: [{
              serviceVersionId: serviceVersionId as Id<'serviceVersions'>,
              role: desiredRole
            }]
          });
          assignmentsUpdated++;
        } else {
          console.log(`Role for ${serviceName} is already correct: ${desiredRole}`);
        }
      } else {
        // Create new assignment
        console.log(`Creating new assignment for ${serviceName} with role: ${desiredRole}`);
        await client.mutation(api.expertServiceAssignments.createMultipleServiceAssignments, {
          organizationId: validOrgId as Id<'organizations'>,
          userId: userId as Id<'users'>,
          expertCVId: currentCVData._id as Id<'expertCVs'>,
          assignedBy: 'system',
          serviceAssignments: [{
            serviceVersionId: serviceVersionId as Id<'serviceVersions'>,
            role: desiredRole
          }]
        });
        assignmentsCreated++;
      }
    }

    // Remove assignments for services that are no longer selected
    const selectedServiceIds = userSelectedServices.map(name => serviceNameToId.get(name)).filter(Boolean);
    const assignmentsToRemove = allCurrentAssignments.filter((assignment) => 
      !selectedServiceIds.includes(assignment.serviceVersionId)
    );

    if (assignmentsToRemove.length > 0) {
      console.log('Removing assignments for unselected services:', assignmentsToRemove.map((a) => a._id));
      // Actually delete these assignments
      for (const assignment of assignmentsToRemove) {
        await client.mutation(api.expertServiceAssignments.deleteAssignment, {
          assignmentId: assignment._id
        });
        assignmentsRemoved++;
      }
    }

    console.log('Service assignment sync completed');
    
    return {
      success: true,
      assignmentsCreated,
      assignmentsUpdated,
      assignmentsRemoved
    };

  } catch (error) {
    console.error('Error in service assignment sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      assignmentsCreated: 0,
      assignmentsUpdated: 0,
      assignmentsRemoved: 0
    };
  }
}