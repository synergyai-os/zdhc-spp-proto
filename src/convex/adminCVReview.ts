import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ==========================================
// ADMIN CV REVIEW QUERIES
// ==========================================

export const getExpertsForCVReview = query({
	args: {
		status: v.optional(
			v.union(
				v.literal('paid'),
				v.literal('training_completed'),
				v.literal('approved'),
				v.literal('rejected'),
				v.literal('inactive')
			)
		),
		organizationId: v.optional(v.id('organizations')),
		searchTerm: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		// Get expert assignments - exclude draft assignments from admin review
		let assignmentsQuery = ctx.db.query('expertAssignments')
			.filter((q) => q.neq(q.field('status'), 'draft'));

		// Apply organization filter if provided
		if (args.organizationId) {
			assignmentsQuery = assignmentsQuery.filter((q) =>
				q.eq(q.field('organizationId'), args.organizationId)
			);
		}

		// Apply status filter if provided
		if (args.status) {
			assignmentsQuery = assignmentsQuery.filter((q) => q.eq(q.field('status'), args.status));
		}

		const assignments = await assignmentsQuery.collect();

		// Enrich assignments with user, organization, and service version details
		const enrichedAssignments = await Promise.all(
			assignments.map(async (assignment) => {
				const user = await ctx.db.get(assignment.userId);
				const organization = await ctx.db.get(assignment.organizationId);
				// Handle shell assignments where serviceVersionId might be undefined
				const serviceVersion = assignment.serviceVersionId ? await ctx.db.get(assignment.serviceVersionId) : null;
				const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

				return {
					...assignment,
					user,
					organization,
					serviceVersion,
					serviceParent
				};
			})
		);

		// Filter out assignments without user data
		const validAssignments = enrichedAssignments.filter((assignment) => assignment.user);

		// Apply search filter if provided
		let filteredAssignments = validAssignments;
		if (args.searchTerm) {
			const searchLower = args.searchTerm.toLowerCase();
			filteredAssignments = validAssignments.filter(
				(assignment) =>
					assignment.user?.firstName.toLowerCase().includes(searchLower) ||
					assignment.user?.lastName.toLowerCase().includes(searchLower) ||
					assignment.user?.email.toLowerCase().includes(searchLower)
			);
		}

		// Group assignments by userId
		const userGroups = new Map<string, any>();

		for (const assignment of filteredAssignments) {
			const userId = assignment.userId;

			if (!userGroups.has(userId)) {
				userGroups.set(userId, {
					user: assignment.user,
					assignments: [],
					organizations: new Set(),
					pendingCount: 0,
					lastUpdated: assignment.assignedAt
				});
			}

			const userGroup = userGroups.get(userId);
			userGroup.assignments.push(assignment);
			userGroup.organizations.add(assignment.organization?.name || 'Unknown');

			// Count pending reviews (paid or training_completed status)
			if (assignment.status === 'paid' || assignment.status === 'training_completed') {
				userGroup.pendingCount++;
			}

			// Track most recent update
			const updateTime = Math.max(
				assignment.assignedAt,
				assignment.approvedAt || 0,
				assignment.rejectedAt || 0,
				assignment.reviewedAt || 0
			);
			userGroup.lastUpdated = Math.max(userGroup.lastUpdated, updateTime);
		}

		// Convert to array format for display
		const result = Array.from(userGroups.values()).map((userGroup) => ({
			userId: userGroup.user._id,
			user: userGroup.user,
			assignments: userGroup.assignments,
			organizations: Array.from(userGroup.organizations),
			pendingCount: userGroup.pendingCount,
			lastUpdated: userGroup.lastUpdated,
			totalServices: userGroup.assignments.length
		}));

		// Sort by last updated (most recent first)
		return result.sort((a, b) => b.lastUpdated - a.lastUpdated);
	}
});

export const getExpertCVDetail = query({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		// Get user details
		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Get all expert assignments for this user
		const assignments = await ctx.db
			.query('expertAssignments')
			.filter((q) => q.eq(q.field('userId'), args.userId))
			.collect();

		// Enrich assignments with full details
		const enrichedAssignments = await Promise.all(
			assignments.map(async (assignment) => {
				const organization = await ctx.db.get(assignment.organizationId);
				// Handle shell assignments where serviceVersionId might be undefined
				const serviceVersion = assignment.serviceVersionId ? await ctx.db.get(assignment.serviceVersionId) : null;
				const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

				return {
					...assignment,
					organization,
					serviceVersion,
					serviceParent
				};
			})
		);

		// Group by organization for display
		const organizationGroups = new Map<string, any>();

		for (const assignment of enrichedAssignments) {
			const orgId = assignment.organizationId;

			if (!organizationGroups.has(orgId)) {
				organizationGroups.set(orgId, {
					organization: assignment.organization,
					assignments: []
				});
			}

			organizationGroups.get(orgId).assignments.push(assignment);
		}

		return {
			user,
			organizationGroups: Array.from(organizationGroups.values()),
			totalAssignments: assignments.length,
			pendingAssignments: assignments.filter(
				(a) => a.status === 'paid' || a.status === 'training_completed'
			).length
		};
	}
});

// ==========================================
// ADMIN CV REVIEW MUTATIONS
// ==========================================

export const approveExpertForService = mutation({
	args: {
		assignmentId: v.id('expertAssignments'),
		reviewNotes: v.optional(v.string()),
		reviewedBy: v.string() // Admin ID
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		return await ctx.db.patch(args.assignmentId, {
			status: 'approved',
			approvedAt: now,
			approvedBy: args.reviewedBy,
			reviewedAt: now,
			reviewedBy: args.reviewedBy,
			reviewNotes: args.reviewNotes
		});
	}
});

export const rejectExpertForService = mutation({
	args: {
		assignmentId: v.id('expertAssignments'),
		rejectionReason: v.string(),
		reviewNotes: v.optional(v.string()),
		reviewedBy: v.string() // Admin ID
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		return await ctx.db.patch(args.assignmentId, {
			status: 'rejected',
			rejectedAt: now,
			rejectedBy: args.reviewedBy,
			rejectionReason: args.rejectionReason,
			reviewedAt: now,
			reviewedBy: args.reviewedBy,
			reviewNotes: args.reviewNotes
		});
	}
});

// ==========================================
// UTILITY QUERIES FOR ADMIN INTERFACE
// ==========================================

export const getAdminStats = query({
	args: {},
	handler: async (ctx) => {
		const allAssignments = await ctx.db.query('expertAssignments').collect();

		const stats = {
			total: allAssignments.length,
			paid: allAssignments.filter((a) => a.status === 'paid').length,
			trainingCompleted: allAssignments.filter((a) => a.status === 'training_completed').length,
			approved: allAssignments.filter((a) => a.status === 'approved').length,
			rejected: allAssignments.filter((a) => a.status === 'rejected').length,
			pendingReview: allAssignments.filter(
				(a) => a.status === 'paid' || a.status === 'training_completed'
			).length
		};

		return stats;
	}
});

export const getOrganizationsForFilter = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query('organizations')
			.filter((q) => q.eq(q.field('type'), 'solution_provider'))
			.collect();
	}
});
