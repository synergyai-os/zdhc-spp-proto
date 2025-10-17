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