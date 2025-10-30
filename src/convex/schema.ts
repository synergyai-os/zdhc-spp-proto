import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { CV_STATUS_VALIDATOR, SERVICE_STATUS_VALIDATOR, TRAINING_STATUS_VALIDATOR } from './model/status';

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

	// Service Version Requirements table - Immutable requirements linked to service versions
	// Requirements track what needs to be checked when reviewing CVs for a service
	serviceVersionRequirements: defineTable({
		serviceVersionId: v.id('serviceVersions'),
		title: v.string(), // Requirement title/name
		description: v.optional(v.string()), // Optional detailed description
		order: v.optional(v.number()), // Display order within service version
		isRequired: v.optional(v.boolean()), // Whether this must be checked to approve (for future use)
		// Applicability to expert role: regular, lead, or both (default both)
		roleApplicability: v.optional(
			v.union(v.literal('regular'), v.literal('lead'), v.literal('both'))
		),
		
		// Creation metadata
		createdAt: v.number(),
		createdBy: v.string(), // Admin ID who created it
		
		// Retirement metadata (for immutable requirements - changes create new requirement)
		retiredAt: v.optional(v.number()),
		retiredBy: v.optional(v.string()), // Admin ID who retired it
		retirementReason: v.optional(v.string()),
		
		// Replacement tracking - bidirectional linking for traceability
		replacesRequirementId: v.optional(v.id('serviceVersionRequirements')), // Points to old requirement this replaces
		replacedByRequirementId: v.optional(v.id('serviceVersionRequirements')) // Points to new requirement when retired
	})
		.index('by_service_version', ['serviceVersionId']),

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
		
		// Payment tracking for ServiceApprovalTracker
		paymentReference: v.optional(v.string()),
		paymentAmount: v.optional(v.number()),
		paidAt: v.optional(v.number()),
		
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
				description: v.string(),
				onSiteAuditsCompleted: v.optional(v.number()), // Legacy field - can be removed later after data migration
				fieldExperienceTypes: v.optional(v.object({
					assessment: v.boolean(),
					sampling: v.boolean(),
					training: v.boolean()
				})),
				fieldExperienceCounts: v.optional(v.object({
					assessment: v.object({
						total: v.number(),
						last12m: v.number()
					}),
					sampling: v.object({
						total: v.number(),
						last12m: v.number()
					}),
					training: v.object({
						total: v.number(),
						last12m: v.number()
					})
				})),
				lockedForReviewAt: v.optional(v.number()) // Timestamp when item was locked for review (admin control)
			})
		),
		education: v.array(
			v.object({
				school: v.string(),
				degree: v.string(),
				field: v.string(),
				startDate: v.string(),
				endDate: v.string(),
				description: v.string(),
				lockedForReviewAt: v.optional(v.number()) // Timestamp when item was locked for review (admin control)
			})
		),
		trainingQualifications: v.optional(v.array(
			v.object({
				qualificationName: v.string(),
				trainingOrganisation: v.string(),
				trainingContent: v.string(),
				dateIssued: v.string(),
				expireDate: v.string(),
				description: v.string(),
				lockedForReviewAt: v.optional(v.number()) // Timestamp when item was locked for review (admin control)
			})
		)),
		otherApprovals: v.optional(v.array(
			v.object({
				organisationName: v.string(),
				role: v.string(),
				dateIssued: v.string(),
				lockedForReviewAt: v.optional(v.number()) // Timestamp when item was locked for review (admin control)
			})
		)),

		// Status Lifecycle: draft → completed → payment_pending → paid → locked_for_review → unlocked_for_edits → locked_final
		status: CV_STATUS_VALIDATOR,

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
		status: SERVICE_STATUS_VALIDATOR,

		// Training Status (separate from approval status)
		trainingStatus: v.optional(TRAINING_STATUS_VALIDATOR),

		// Review Metadata
		reviewedAt: v.optional(v.number()),
		reviewedBy: v.optional(v.string()), // ZDHC Admin ID
		approvedAt: v.optional(v.number()),
		approvedBy: v.optional(v.string()), // ZDHC Admin ID
		rejectedAt: v.optional(v.number()),
		rejectedBy: v.optional(v.string()), // ZDHC Admin ID
		rejectionReason: v.optional(v.string()),
		reviewNotes: v.optional(v.string()),

		// Training lifecycle tracking
		trainingInvitedAt: v.optional(v.number()),
		trainingStartedAt: v.optional(v.number()),
		trainingCompletedAt: v.optional(v.number()),
		trainingFailedAt: v.optional(v.number()),

		// Qualification tracking (global check)
		qualificationId: v.optional(v.string()), // Reference to global qualification record
		qualifiedAt: v.optional(v.number()),

		// Training metadata
		trainingNotes: v.optional(v.string()),
		academyTrainingId: v.optional(v.string()), // External Academy reference

		// Requirement check-offs - Array of requirement IDs checked off by admin
		// Each check-off tracks which requirement version was validated
		requirementCheckoffs: v.optional(v.array(
			v.object({
				requirementId: v.id('serviceVersionRequirements'), // The specific requirement version checked
				isChecked: v.boolean(),
				checkedAt: v.number(),
				checkedBy: v.string() // Admin ID who checked it
			})
		)),

		// Metadata
		createdAt: v.number(),
		assignedBy: v.string() // SPP Manager ID who created assignment
	}),

	// Expert Qualifications table - Global tracking of training completions
	// Links USER + SERVICE VERSION for qualification sharing across organizations
	expertQualifications: defineTable({
		userId: v.id('users'),
		serviceVersionId: v.id('serviceVersions'),

		// Training completion
		trainingPassedAt: v.number(),
		trainingCompletedBy: v.optional(v.string()), // Academy system or admin override

		// Original assignment that earned qualification
		originalAssignmentId: v.id('expertServiceAssignments'),
		originalOrganizationId: v.id('organizations'),

		// Metadata
		academyTrainingId: v.optional(v.string()),
		certificateUrl: v.optional(v.string()),
		notes: v.optional(v.string()),

		createdAt: v.number(),
	})
		.index('by_user_service', ['userId', 'serviceVersionId']),

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
