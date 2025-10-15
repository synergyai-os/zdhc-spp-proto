import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ==========================================
// SERVICE PARENTS QUERIES
// ==========================================

export const getServiceParents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("serviceParents")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getServiceParentById = query({
  args: { id: v.id("serviceParents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ==========================================
// SERVICE VERSIONS QUERIES
// ==========================================

export const getServiceVersions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("serviceVersions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getServiceVersionsByParent = query({
  args: { parentId: v.id("serviceParents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("serviceVersions")
      .filter((q) => q.eq(q.field("parentId"), args.parentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getServiceVersionById = query({
  args: { id: v.id("serviceVersions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ==========================================
// ORGANIZATION SERVICE APPROVALS QUERIES
// ==========================================

export const getOrganizationApprovals = query({
  args: { 
    organizationId: v.union(v.id("organizations"), v.string()),
    refreshKey: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // If organizationId is empty string, return empty array
    if (args.organizationId === "") {
      return [];
    }
    
    const approvals = await ctx.db
      .query("organizationServiceApprovals")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .collect();


    // Join with service version data
    const approvalsWithDetails = await Promise.all(
      approvals.map(async (approval) => {
        const serviceVersion = await ctx.db.get(approval.serviceVersionId);
        const serviceParent = serviceVersion 
          ? await ctx.db.get(serviceVersion.parentId)
          : null;
        
        return {
          ...approval,
          serviceVersion,
          serviceParent,
        };
      })
    );

    return approvalsWithDetails;
  },
});

export const getApprovedServiceVersions = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("organizationServiceApprovals")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    // Get service version details
    const serviceVersions = await Promise.all(
      approvals.map(async (approval) => {
        const serviceVersion = await ctx.db.get(approval.serviceVersionId);
        const serviceParent = serviceVersion 
          ? await ctx.db.get(serviceVersion.parentId)
          : null;
        
        return {
          ...serviceVersion,
          serviceParent,
          approval,
        };
      })
    );

    return serviceVersions.filter(Boolean);
  },
});

export const isOrganizationApprovedForServiceVersion = query({
  args: { 
    organizationId: v.id("organizations"),
    serviceVersionId: v.id("serviceVersions")
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db
      .query("organizationServiceApprovals")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.eq(q.field("serviceVersionId"), args.serviceVersionId))
      .first();

    return approval?.status === "approved";
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const createServiceParent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("serviceParents", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createServiceVersion = mutation({
  args: {
    parentId: v.id("serviceParents"),
    version: v.string(),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("serviceVersions", {
      ...args,
      isActive: true,
      releasedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createOrganizationServiceApproval = mutation({
  args: {
    organizationId: v.id("organizations"),
    serviceVersionId: v.id("serviceVersions"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended")
    ),
    approvedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const approvalData: any = {
      ...args,
      createdAt: now,
      updatedAt: now,
    };

    if (args.status === "approved") {
      approvalData.approvedAt = now;
    }

    return await ctx.db.insert("organizationServiceApprovals", approvalData);
  },
});

export const updateOrganizationServiceApproval = mutation({
  args: {
    id: v.id("organizationServiceApprovals"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended")
    ),
    approvedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();
    
    const updateData: any = {
      ...updates,
      updatedAt: now,
    };

    if (updates.status === "approved") {
      updateData.approvedAt = now;
    } else if (updates.status === "rejected") {
      updateData.rejectedAt = now;
    }

    return await ctx.db.patch(id, updateData);
  },
});

export const toggleOrganizationServiceApproval = mutation({
  args: {
    organizationId: v.id("organizations"),
    serviceVersionId: v.id("serviceVersions"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if approval already exists
    const existingApproval = await ctx.db
      .query("organizationServiceApprovals")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.eq(q.field("serviceVersionId"), args.serviceVersionId))
      .first();

    if (existingApproval) {
      // Toggle the status
      const newStatus = existingApproval.status === "approved" ? "rejected" : "approved";
      const updateData: any = {
        status: newStatus,
        updatedAt: now,
        notes: args.notes || `Toggled by prototype user at ${new Date().toISOString()}`,
      };

      if (newStatus === "approved") {
        updateData.approvedAt = now;
      } else {
        updateData.rejectedAt = now;
      }

      await ctx.db.patch(existingApproval._id, updateData);
      
      return { action: "updated", id: existingApproval._id, status: newStatus };
    } else {
      // Create new approval
      const approvalData = {
        organizationId: args.organizationId,
        serviceVersionId: args.serviceVersionId,
        status: "approved" as const,
        approvedAt: now,
        notes: args.notes || "Approved by prototype user",
        createdAt: now,
        updatedAt: now,
      };

      const id = await ctx.db.insert("organizationServiceApprovals", approvalData);
      return { action: "created", id, status: "approved" };
    }
  },
});

// ==========================================
// SEED DATA FOR PROTOTYPE
// ==========================================

export const seedServiceData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Create Service Parent
    const assessmentParent = await ctx.db.insert("serviceParents", {
      name: "Assessment Approval",
      description: "Assessment services that require organization approval",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create Service Versions
    const serviceVersions = [
      {
        version: "V2",
        name: "Supplier to Zero Assessment V2",
        description: "Supplier to Zero Assessment version 2.0",
      },
      {
        version: "V1",
        name: "MMCF Module Assessment V1",
        description: "MMCF Module Assessment version 1.0",
      },
      {
        version: "V1",
        name: "ETP Assessment V1",
        description: "ETP Assessment version 1.0",
      },
      {
        version: "V1",
        name: "InCheck Assessment V1",
        description: "InCheck Assessment version 1.0",
      },
    ];

    const createdVersions = [];
    for (const version of serviceVersions) {
      const versionId = await ctx.db.insert("serviceVersions", {
        parentId: assessmentParent,
        ...version,
        isActive: true,
        releasedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      createdVersions.push(versionId);
    }

    return {
      parentId: assessmentParent,
      versionIds: createdVersions,
    };
  },
});
