import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table (simulating PDC)
  users: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    country: v.string(),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Organizations table
  organizations: defineTable({
    name: v.string(),
    type: v.union(v.literal("solution_provider"), v.literal("zdhc_staff")),
    contactEmail: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Service Parents table (e.g., "Assessment Approval")
  serviceParents: defineTable({
    name: v.string(),
    description: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Service Versions table (e.g., "Supplier to Zero Assessment V2")
  serviceVersions: defineTable({
    parentId: v.id("serviceParents"),
    version: v.string(), // "V1", "V2", etc.
    name: v.string(), // "Supplier to Zero Assessment V2"
    description: v.string(),
    isActive: v.boolean(),
    releasedAt: v.number(),
    deprecatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Organization Service Approvals table
  organizationServiceApprovals: defineTable({
    organizationId: v.id("organizations"),
    serviceVersionId: v.id("serviceVersions"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended")
    ),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.string()), // ZDHC Admin ID
    rejectedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.string()), // ZDHC Admin ID
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Staff Members table (users with SPP platform access)
  staffMembers: defineTable({
    userId: v.id("users"), // Reference to User
    organizationId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("viewer")),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
    joinedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  }),

  // Expert Assignments table (enhanced for organization context)
  expertAssignments: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    serviceVersionId: v.id("serviceVersions"), // Reference to specific service version
    role: v.optional(v.union(v.literal("lead"), v.literal("regular"))), // Expert role for this service
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
    assignedAt: v.number(),
    assignedBy: v.string(), // User ID who made the assignment
    notes: v.optional(v.string()),
    
    // Workflow tracking
    submittedAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    trainingInvitedAt: v.optional(v.number()),
    trainingStartedAt: v.optional(v.number()),
    trainingCompletedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.string()), // ZDHC Admin ID
    rejectedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  }),

  // User Sessions table (for organization context switching)
  userSessions: defineTable({
    userId: v.id("users"), // Reference to user
    staffMemberId: v.id("staffMembers"), // Reference to staff member role
    organizationId: v.id("organizations"),
    sessionToken: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }),
});
