import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

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
		updatedAt: v.number()
	}),

	// Organizations table
	organizations: defineTable({
		name: v.string(),
		type: v.union(v.literal('solution_provider'), v.literal('zdhc_staff')),
		contactEmail: v.string(),
		status: v.union(v.literal('active'), v.literal('inactive'), v.literal('suspended')),
		createdAt: v.number(),
		updatedAt: v.number()
	}),

	// Service Parents table (e.g., "Assessment Approval")
	serviceParents: defineTable({
		name: v.string(),
		description: v.string(),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number()
	}),

	// Service Versions table (e.g., "Supplier to Zero Assessment V2")
	serviceVersions: defineTable({
		parentId: v.id('serviceParents'),
		version: v.string(), // "V1", "V2", etc.
		name: v.string(), // "Supplier to Zero Assessment V2"
		description: v.string(),
		isActive: v.boolean(),
		releasedAt: v.number(),
		deprecatedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number()
	}),

	// Organization Service Approvals table
	organizationServiceApprovals: defineTable({
		organizationId: v.id('organizations'),
		serviceVersionId: v.id('serviceVersions'),
		status: v.union(
			v.literal('pending'),
			v.literal('approved'),
			v.literal('rejected'),
			v.literal('suspended')
		),
		approvedAt: v.optional(v.number()),
		approvedBy: v.optional(v.string()), // ZDHC Admin ID
		rejectedAt: v.optional(v.number()),
		rejectedBy: v.optional(v.string()), // ZDHC Admin ID
		expiresAt: v.optional(v.number()),
		notes: v.optional(v.string()),
		rejectionReason: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number()
	}),

	// Staff Members table (users with SPP platform access)
	staffMembers: defineTable({
		userId: v.id('users'), // Reference to User
		organizationId: v.id('organizations'),
		role: v.union(v.literal('admin'), v.literal('manager'), v.literal('viewer')),
		permissions: v.array(v.string()),
		isActive: v.boolean(),
		joinedAt: v.number(),
		lastLoginAt: v.optional(v.number())
	}),

	// ==========================================
	// NEW: Expert CV Versioning System
	// ==========================================

	// Expert CVs table - Versioned CV snapshots
	// Each CV represents a snapshot of an expert's credentials at a specific point in time
	// CVs are linked to service assignments for approval workflow
	expertCVs: defineTable({
		userId: v.id('users'),
		organizationId: v.id('organizations'),
		version: v.number(), // Auto-increment per user+org (1, 2, 3, ...)

		// CV Content
		experience: v.array(
			v.object({
				title: v.string(),
				company: v.string(),
				location: v.string(),
				startDate: v.string(),
				endDate: v.string(),
				current: v.boolean(),
				description: v.string()
			})
		),
		education: v.array(
			v.object({
				school: v.string(),
				degree: v.string(),
				field: v.string(),
				startDate: v.string(),
				endDate: v.string(),
				description: v.string()
			})
		),

		// Status Lifecycle: draft → completed → payment_pending → paid → locked_for_review → unlocked_for_edits → locked_final
		status: v.union(
			v.literal('draft'), // Incomplete, can edit freely
			v.literal('completed'), // Complete, ready for payment
			v.literal('payment_pending'), // Payment initiated, awaiting confirmation
			v.literal('paid'), // Payment confirmed, triggers automation
			v.literal('locked_for_review'), // Automation complete, reviewer working
			v.literal('unlocked_for_edits'), // Reviewer returned it for edits
			v.literal('locked_final') // Review complete, immutable
		),

		// Timestamps
		createdAt: v.number(),
		createdBy: v.string(), // SPP Manager ID
		submittedAt: v.optional(v.number()), // When payment processed
		paidAt: v.optional(v.number()), // When payment confirmed
		lockedAt: v.optional(v.number()), // When all services decided
		notes: v.optional(v.string())
	}),

	// Expert Service Assignments table - Links CV versions to specific service versions
	// One assignment per CV + service combination
	// Tracks approval status for each service independently
	expertServiceAssignments: defineTable({
		userId: v.id('users'),
		organizationId: v.id('organizations'),
		expertCVId: v.id('expertCVs'), // Reference to CV version
		serviceVersionId: v.id('serviceVersions'), // Reference to service
		role: v.union(v.literal('lead'), v.literal('regular')),

		// Review Status
		status: v.union(
			v.literal('pending_review'), // Submitted, awaiting ZDHC review
			v.literal('approved'), // ZDHC approved this service
			v.literal('rejected'), // ZDHC rejected this service
			v.literal('inactive') // Deactivated/superseded
		),

		// Review Metadata
		reviewedAt: v.optional(v.number()),
		reviewedBy: v.optional(v.string()), // ZDHC Admin ID
		approvedAt: v.optional(v.number()),
		approvedBy: v.optional(v.string()), // ZDHC Admin ID
		rejectedAt: v.optional(v.number()),
		rejectedBy: v.optional(v.string()), // ZDHC Admin ID
		rejectionReason: v.optional(v.string()),
		reviewNotes: v.optional(v.string()),

		// Metadata
		createdAt: v.number(),
		assignedBy: v.string() // SPP Manager ID who created assignment
	}),


	// User Sessions table (for organization context switching)
	userSessions: defineTable({
		userId: v.id('users'), // Reference to user
		staffMemberId: v.id('staffMembers'), // Reference to staff member role
		organizationId: v.id('organizations'),
		sessionToken: v.string(),
		expiresAt: v.number(),
		createdAt: v.number(),
	}),
});
