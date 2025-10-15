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

export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createUser = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    country: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("users", {
      ...args,
      isActive: true,
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
    
    // Enrich with user and organization details
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        const organization = await ctx.db.get(assignment.organizationId);
        
        return {
          ...assignment,
          user,
          organization,
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
      v.literal("submitted"),
      v.literal("under_review"),
      v.literal("training"),
      v.literal("certified"),
      v.literal("active"),
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

export const getExpertAssignmentById = query({
  args: { id: v.id("expertAssignments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createExpertAssignment = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    services: v.array(v.string()),
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expertAssignments", {
      ...args,
      status: "draft",
      assignedAt: Date.now(),
    });
  },
});

export const updateExpertAssignmentStatus = mutation({
  args: {
    id: v.id("expertAssignments"),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("under_review"),
      v.literal("training"),
      v.literal("certified"),
      v.literal("active"),
      v.literal("rejected"),
      v.literal("inactive")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      status: args.status,
    });
  },
});

export const deleteExpertAssignment = mutation({
  args: { id: v.id("expertAssignments") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
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

    // Create expert assignments
    const assignment1 = await ctx.db.insert("expertAssignments", {
      userId: user1,
      organizationId: org1,
      services: ["ETP Assessment", "Supplier Assessment"],
      status: "active",
      experience: [
        {
          title: "Senior Environmental Consultant",
          company: "TechCorp Solutions",
          location: "Amsterdam, Netherlands",
          startDate: "2020-01-01",
          endDate: "",
          current: true,
          description: "Leading environmental assessments and sustainability projects",
        }
      ],
      education: [
        {
          school: "University of Amsterdam",
          degree: "Master of Science",
          field: "Environmental Science",
          startDate: "2018-09-01",
          endDate: "2020-06-30",
          description: "Specialized in environmental impact assessment",
        }
      ],
      assignedAt: now,
      assignedBy: user1,
      notes: "Lead expert for ETP assessments",
    });

    const assignment2 = await ctx.db.insert("expertAssignments", {
      userId: user2,
      organizationId: org2,
      services: ["Chemical Management", "ETP Assessment"],
      status: "certified",
      experience: [
        {
          title: "Environmental Manager",
          company: "Green Consulting Group",
          location: "Berlin, Germany",
          startDate: "2019-03-01",
          endDate: "",
          current: true,
          description: "Managing chemical compliance and environmental programs",
        }
      ],
      education: [
        {
          school: "Technical University of Berlin",
          degree: "Bachelor of Engineering",
          field: "Chemical Engineering",
          startDate: "2015-10-01",
          endDate: "2019-07-31",
          description: "Focus on sustainable chemical processes",
        }
      ],
      assignedAt: now,
      assignedBy: user2,
      notes: "Expert in chemical management and ETP assessments",
    });

    const assignment3 = await ctx.db.insert("expertAssignments", {
      userId: user3,
      organizationId: org3,
      services: ["Supplier Assessment", "Chemical Management"],
      status: "training",
      experience: [
        {
          title: "Sustainability Consultant",
          company: "EcoSolutions International",
          location: "Paris, France",
          startDate: "2021-06-01",
          endDate: "",
          current: true,
          description: "Specializing in supplier sustainability assessments",
        }
      ],
      education: [
        {
          school: "Sorbonne University",
          degree: "Master of Business Administration",
          field: "Sustainable Business",
          startDate: "2019-09-01",
          endDate: "2021-06-30",
          description: "MBA with focus on sustainable business practices",
        }
      ],
      assignedAt: now,
      assignedBy: user3,
      notes: "Currently undergoing training for supplier assessments",
    });

    return {
      users: [user1, user2, user3],
      organizations: [org1, org2, org3],
      staffMembers: [staff1, staff2, staff3],
      expertAssignments: [assignment1, assignment2, assignment3],
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
