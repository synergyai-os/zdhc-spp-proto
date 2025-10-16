import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ==========================================
// USERS QUERIES & MUTATIONS
// ==========================================

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const createUser = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    country: v.string(),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("users", {
      ...args,
      isActive: args.isActive ?? true, // Default to true if not specified
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ==========================================
// ORGANIZATIONS QUERIES & MUTATIONS
// ==========================================

export const getOrganizations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

export const getOrganizationById = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createOrganization = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("solution_provider"), v.literal("zdhc_staff")),
    contactEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("organizations", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ==========================================
// STAFF MEMBERS QUERIES & MUTATIONS
// ==========================================

export const getStaffMembers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("staffMembers").collect();
  },
});

export const getStaffMembersByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staffMembers")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .collect();
  },
});

export const getStaffMemberById = query({
  args: { id: v.id("staffMembers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createStaffMember = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("viewer")),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("staffMembers", {
      ...args,
      isActive: true,
      joinedAt: now,
    });
  },
});

// ==========================================
// USER SESSIONS QUERIES & MUTATIONS
// ==========================================

export const getUserSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userSessions").collect();
  },
});

export const getCurrentUserSession = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("userSessions")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .order("desc")
      .first();
  },
});

export const createUserSession = mutation({
  args: {
    userId: v.id("users"),
    staffMemberId: v.id("staffMembers"),
    organizationId: v.id("organizations"),
    sessionToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("userSessions", {
      ...args,
      createdAt: now,
    });
  },
});

export const updateUserSession = mutation({
  args: {
    id: v.id("userSessions"),
    organizationId: v.id("organizations"),
    staffMemberId: v.id("staffMembers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      organizationId: args.organizationId,
      staffMemberId: args.staffMemberId,
    });
  },
});

// ==========================================
// EXPERT ASSIGNMENTS QUERIES & MUTATIONS
// ==========================================

export const getExpertAssignments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("expertAssignments").collect();
  },
});

export const getExpertAssignmentsByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expertAssignments")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .collect();
  },
});

export const getExpertAssignmentsByOrganizationWithDetails = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("expertAssignments")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .collect();
    
    // Enrich with user, organization, and service version details
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        const organization = await ctx.db.get(assignment.organizationId);
        const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
        const serviceParent = serviceVersion 
          ? await ctx.db.get(serviceVersion.parentId)
          : null;
        
        return {
          ...assignment,
          user,
          organization,
          serviceVersion,
          serviceParent,
        };
      })
    );
    
    return enrichedAssignments;
  },
});

export const getExpertAssignmentsByStatus = query({
  args: { 
    organizationId: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("paid"),
      v.literal("ready_for_training"),
      v.literal("training_started"),
      v.literal("training_completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("inactive")
    ))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("expertAssignments")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const assignments = await query.collect();
    
    // Enrich with user details
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        return {
          ...assignment,
          user,
        };
      })
    );
    
    return enrichedAssignments;
  },
});

export const getExpertAssignmentsByStatusWithDetails = query({
  args: { 
    organizationId: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("paid"),
      v.literal("ready_for_training"),
      v.literal("training_started"),
      v.literal("training_completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("inactive")
    ))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("expertAssignments")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const assignments = await query.collect();
    
    // Enrich with user, organization, and service version details
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        const organization = await ctx.db.get(assignment.organizationId);
        const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
        const serviceParent = serviceVersion 
          ? await ctx.db.get(serviceVersion.parentId)
          : null;
        
        return {
          ...assignment,
          user,
          organization,
          serviceVersion,
          serviceParent,
        };
      })
    );
    
    return enrichedAssignments;
  },
});


export const createExpertAssignment = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    serviceVersionId: v.optional(v.id("serviceVersions")), // Now optional for shell assignments
    role: v.optional(v.union(v.literal("lead"), v.literal("regular"))),
    experience: v.array(v.object({
      title: v.string(),
      company: v.string(),
      location: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      current: v.boolean(),
      description: v.string(),
    })),
    education: v.array(v.object({
      school: v.string(),
      degree: v.string(),
      field: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      description: v.string(),
    })),
    assignedBy: v.string(),
    notes: v.optional(v.string()),
    profileCompletionStep: v.optional(v.number()),
    isProfileComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("expertAssignments", {
      ...args,
      status: "draft",
      assignedAt: now,
      profileCompletionStep: args.profileCompletionStep ?? (args.serviceVersionId ? 3 : 2), // Default based on whether service is assigned
      isProfileComplete: args.isProfileComplete ?? false,
    });
  },
});

export const updateExpertAssignmentStatus = mutation({
  args: {
    id: v.id("expertAssignments"),
    status: v.union(
      v.literal("draft"),
      v.literal("paid"),
      v.literal("ready_for_training"),
      v.literal("training_started"),
      v.literal("training_completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("inactive")
    ),
    updatedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updateData: any = {
      status: args.status,
    };

    // Set appropriate timestamp based on status
    switch (args.status) {
      case "paid":
        updateData.paidAt = now;
        break;
      case "ready_for_training":
        updateData.trainingInvitedAt = now;
        break;
      case "training_started":
        updateData.trainingStartedAt = now;
        break;
      case "training_completed":
        updateData.trainingCompletedAt = now;
        break;
      case "approved":
        updateData.approvedAt = now;
        if (args.updatedBy) updateData.approvedBy = args.updatedBy;
        break;
      case "rejected":
        updateData.rejectedAt = now;
        if (args.updatedBy) updateData.rejectedBy = args.updatedBy;
        break;
    }

    if (args.notes) {
      updateData.notes = args.notes;
    }

    return await ctx.db.patch(args.id, updateData);
  },
});

export const deleteExpertAssignment = mutation({
  args: { id: v.id("expertAssignments") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const createShellAssignment = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    assignedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get the first available service version for this organization as a placeholder
    // We'll update this to the actual selected service in step 3
    const firstServiceVersion = await ctx.db
      .query("serviceVersions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (!firstServiceVersion) {
      throw new Error("No service versions available for shell assignment");
    }
    
    return await ctx.db.insert("expertAssignments", {
      userId: args.userId,
      organizationId: args.organizationId,
      serviceVersionId: firstServiceVersion._id, // Use first available service as placeholder
      role: "regular",
      experience: [],
      education: [],
      assignedBy: args.assignedBy,
      notes: args.notes || "Shell assignment - services will be assigned in step 3",
      status: "draft",
      assignedAt: now,
      profileCompletionStep: 2, // Step 2 (confirmation completed)
      isProfileComplete: false,
    });
  },
});

export const updateExpertAssignmentService = mutation({
  args: {
    id: v.id("expertAssignments"),
    serviceVersionId: v.optional(v.id("serviceVersions")),
    role: v.optional(v.union(v.literal("lead"), v.literal("regular"))),
    profileCompletionStep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    if (args.serviceVersionId !== undefined) {
      updateData.serviceVersionId = args.serviceVersionId;
    }
    
    if (args.role !== undefined) {
      updateData.role = args.role;
    }
    
    if (args.profileCompletionStep !== undefined) {
      updateData.profileCompletionStep = args.profileCompletionStep;
    }

    return await ctx.db.patch(args.id, updateData);
  },
});

export const getExpertAssignmentById = query({
  args: { id: v.id("expertAssignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.id);
    if (!assignment) return null;
    
    // Get related data
    const user = await ctx.db.get(assignment.userId);
    const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
    const organization = await ctx.db.get(assignment.organizationId);
    
    return {
      ...assignment,
      user,
      serviceVersion,
      organization,
      services: serviceVersion ? [{
        name: serviceVersion.name,
        isLead: assignment.role === 'lead'
      }] : []
    };
  },
});

export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ==========================================
// DRAFT PROFILE MANAGEMENT FUNCTIONS
// ==========================================

export const createExpertAssignmentsForUser = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    serviceAssignments: v.array(v.object({
      serviceVersionId: v.id("serviceVersions"),
      role: v.union(v.literal("lead"), v.literal("regular"))
    })),
    assignedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const assignmentIds = [];
    
    for (const serviceAssignment of args.serviceAssignments) {
      const assignmentId = await ctx.db.insert("expertAssignments", {
        userId: args.userId,
        organizationId: args.organizationId,
        serviceVersionId: serviceAssignment.serviceVersionId,
        role: serviceAssignment.role,
        experience: [],
        education: [],
        assignedBy: args.assignedBy,
        status: "draft",
        assignedAt: now,
        profileCompletionStep: 3, // Services selected
        isProfileComplete: false,
      });
      assignmentIds.push(assignmentId);
    }
    
    return assignmentIds;
  },
});

export const updateExpertAssignmentExperience = mutation({
  args: {
    assignmentId: v.id("expertAssignments"),
    experience: v.array(v.object({
      title: v.string(),
      company: v.string(),
      location: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      current: v.boolean(),
      description: v.string(),
    })),
    profileCompletionStep: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.assignmentId, {
      experience: args.experience,
      profileCompletionStep: args.profileCompletionStep,
    });
  },
});

export const updateExpertAssignmentEducation = mutation({
  args: {
    assignmentId: v.id("expertAssignments"),
    education: v.array(v.object({
      school: v.string(),
      degree: v.string(),
      field: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      description: v.string(),
    })),
    profileCompletionStep: v.number(),
    isProfileComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.assignmentId, {
      education: args.education,
      profileCompletionStep: args.profileCompletionStep,
      isProfileComplete: args.isProfileComplete,
    });
  },
});

export const updateMultipleAssignmentsExperience = mutation({
  args: {
    assignmentIds: v.array(v.id("expertAssignments")),
    experience: v.array(v.object({
      title: v.string(),
      company: v.string(),
      location: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      current: v.boolean(),
      description: v.string(),
    })),
    profileCompletionStep: v.number(),
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.assignmentIds.map(id => ctx.db.patch(id, {
        experience: args.experience,
        profileCompletionStep: args.profileCompletionStep,
      }))
    );
    
    return {
      success: true,
      updatedCount: results.length,
      profileCompletionStep: args.profileCompletionStep,
    };
  },
});

export const updateMultipleAssignmentsEducation = mutation({
  args: {
    assignmentIds: v.array(v.id("expertAssignments")),
    education: v.array(v.object({
      school: v.string(),
      degree: v.string(),
      field: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      description: v.string(),
    })),
    profileCompletionStep: v.number(),
    isProfileComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.assignmentIds.map(id => ctx.db.patch(id, {
        education: args.education,
        profileCompletionStep: args.profileCompletionStep,
        isProfileComplete: args.isProfileComplete,
      }))
    );
    
    return {
      success: true,
      updatedCount: results.length,
      profileCompletionStep: args.profileCompletionStep,
      isProfileComplete: args.isProfileComplete,
    };
  },
});

// ==========================================
// CHECKOUT FLOW FUNCTIONS
// ==========================================

export const getExpertAssignmentsByIds = query({
  args: { ids: v.array(v.id("expertAssignments")) },
  handler: async (ctx, args) => {
    const assignments = await Promise.all(
      args.ids.map(id => ctx.db.get(id))
    );
    
    // Filter out any null results and enrich with user details
    const validAssignments = assignments.filter((assignment): assignment is NonNullable<typeof assignment> => assignment !== null);
    const enrichedAssignments = await Promise.all(
      validAssignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        const organization = await ctx.db.get(assignment.organizationId);
        const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
        const serviceParent = serviceVersion 
          ? await ctx.db.get(serviceVersion.parentId)
          : null;
        
        return {
          ...assignment,
          user,
          organization,
          serviceVersion,
          serviceParent,
        };
      })
    );
    
    return enrichedAssignments;
  },
});

export const updateMultipleExpertStatuses = mutation({
  args: {
    assignmentIds: v.array(v.id("expertAssignments")),
    status: v.union(
      v.literal("paid"),
      v.literal("pending_payment"),
      v.literal("ready_for_training"),
      v.literal("training_started"),
      v.literal("training_completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("inactive")
    ),
    updatedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updateData: any = {
      status: args.status,
    };

    // Set appropriate timestamp based on status
    switch (args.status) {
      case "paid":
        updateData.paidAt = now;
        break;
      case "pending_payment":
        updateData.submittedAt = now;
        break;
      case "ready_for_training":
        updateData.trainingInvitedAt = now;
        break;
      case "training_started":
        updateData.trainingStartedAt = now;
        break;
      case "training_completed":
        updateData.trainingCompletedAt = now;
        break;
      case "approved":
        updateData.approvedAt = now;
        if (args.updatedBy) updateData.approvedBy = args.updatedBy;
        break;
      case "rejected":
        updateData.rejectedAt = now;
        if (args.updatedBy) updateData.rejectedBy = args.updatedBy;
        break;
    }

    if (args.notes) {
      updateData.notes = args.notes;
    }

    // Update all assignments
    const results = await Promise.all(
      args.assignmentIds.map(id => ctx.db.patch(id, updateData))
    );

    return {
      success: true,
      updatedCount: results.length,
      status: args.status,
      timestamp: now,
    };
  },
});

// ==========================================
// DATA SEEDING FUNCTIONS
// ==========================================

export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Create test users
    const user1 = await ctx.db.insert("users", {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@techcorp.com",
      country: "Netherlands",
      phone: "+31 6 12345678",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const user2 = await ctx.db.insert("users", {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@greenconsulting.com",
      country: "Germany",
      phone: "+49 30 12345678",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const user3 = await ctx.db.insert("users", {
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@ecosolutions.com",
      country: "France",
      phone: "+33 1 23456789",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create organizations
    const org1 = await ctx.db.insert("organizations", {
      name: "TechCorp Solutions",
      type: "solution_provider",
      contactEmail: "admin@techcorp.com",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const org2 = await ctx.db.insert("organizations", {
      name: "Green Consulting Group",
      type: "solution_provider",
      contactEmail: "info@greenconsulting.com",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const org3 = await ctx.db.insert("organizations", {
      name: "EcoSolutions International",
      type: "solution_provider",
      contactEmail: "contact@ecosolutions.com",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Create staff members
    const staff1 = await ctx.db.insert("staffMembers", {
      userId: user1,
      organizationId: org1,
      role: "admin",
      permissions: ["manage_experts", "view_reports", "manage_organization"],
      isActive: true,
      joinedAt: now,
    });

    const staff2 = await ctx.db.insert("staffMembers", {
      userId: user2,
      organizationId: org2,
      role: "manager",
      permissions: ["manage_experts", "view_reports"],
      isActive: true,
      joinedAt: now,
    });

    const staff3 = await ctx.db.insert("staffMembers", {
      userId: user3,
      organizationId: org3,
      role: "admin",
      permissions: ["manage_experts", "view_reports", "manage_organization"],
      isActive: true,
      joinedAt: now,
    });

    // Note: Expert assignments will be created after service versions are set up
    // For now, we'll skip creating assignments until we have proper service version IDs
    return {
      users: [user1, user2, user3],
      organizations: [org1, org2, org3],
      staffMembers: [staff1, staff2, staff3],
      expertAssignments: [],
    };
  },
});

export const migrateExistingExpertRoles = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all existing expert assignments that don't have a role field
    const assignments = await ctx.db.query("expertAssignments").collect();
    
    let updatedCount = 0;
    for (const assignment of assignments) {
      // Check if role field exists (it will be undefined for existing records)
      if (assignment.role === undefined) {
        await ctx.db.patch(assignment._id, {
          role: "regular" // Set default role for existing experts
        });
        updatedCount++;
      }
    }

    return { 
      message: `Migrated ${updatedCount} expert assignments to have default 'regular' role`,
      updatedCount 
    };
  },
});

export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all records (in reverse order to respect foreign key constraints)
    const expertAssignments = await ctx.db.query("expertAssignments").collect();
    for (const assignment of expertAssignments) {
      await ctx.db.delete(assignment._id);
    }

    const staffMembers = await ctx.db.query("staffMembers").collect();
    for (const staff of staffMembers) {
      await ctx.db.delete(staff._id);
    }

    const userSessions = await ctx.db.query("userSessions").collect();
    for (const session of userSessions) {
      await ctx.db.delete(session._id);
    }

    const organizations = await ctx.db.query("organizations").collect();
    for (const org of organizations) {
      await ctx.db.delete(org._id);
    }

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    return { message: "All data cleared successfully" };
  },
});
