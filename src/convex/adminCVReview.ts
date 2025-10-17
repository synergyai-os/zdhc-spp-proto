import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ==========================================
// ADMIN CV REVIEW QUERIES (UPDATED FOR NEW SCHEMA)
// ==========================================

export const getExpertsForCVReview = query({
	args: {
		status: v.optional(
			v.union(
				v.literal('submitted'),
				v.literal('pending_review'),
				v.literal('approved'),
				v.literal('rejected'),
				v.literal('locked')
			)
		),
		organizationId: v.optional(v.id('organizations')),
		searchTerm: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		// Get CVs that are submitted (under review) - exclude draft CVs
		let cvsQuery = ctx.db.query('expertCVs')
			.filter((q) => q.neq(q.field('status'), 'draft'));

		// Apply organization filter if provided
		if (args.organizationId) {
			cvsQuery = cvsQuery.filter((q) =>
				q.eq(q.field('organizationId'), args.organizationId)
			);
		}

		// Apply status filter if provided
		if (args.status) {
			cvsQuery = cvsQuery.filter((q) => q.eq(q.field('status'), args.status));
		}

		const cvs = await cvsQuery.collect();

		// Enrich CVs with user, organization, and assignment details
		const enrichedCVs = await Promise.all(
			cvs.map(async (cv) => {
				const user = await ctx.db.get(cv.userId);
				const organization = await ctx.db.get(cv.organizationId);

				// Get all service assignments for this CV
				const assignments = await ctx.db
					.query('expertServiceAssignments')
					.filter((q) => q.eq(q.field('expertCVId'), cv._id))
					.collect();

				// Enrich assignments with service details
				const enrichedAssignments = await Promise.all(
					assignments.map(async (assignment) => {
						const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
						const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

						return {
							...assignment,
							serviceVersion,
							serviceParent
						};
					})
				);

				return {
					...cv,
					user,
					organization,
					assignments: enrichedAssignments,
					pendingAssignments: enrichedAssignments.filter((a) => a.status === 'pending_review'),
					approvedAssignments: enrichedAssignments.filter((a) => a.status === 'approved'),
					rejectedAssignments: enrichedAssignments.filter((a) => a.status === 'rejected')
				};
			})
		);

		// Filter out CVs without user data
		const validCVs = enrichedCVs.filter((cv) => cv.user);

		// Apply search filter if provided
		let filteredCVs = validCVs;
		if (args.searchTerm) {
			const searchLower = args.searchTerm.toLowerCase();
			filteredCVs = validCVs.filter(
				(cv) =>
					cv.user?.firstName.toLowerCase().includes(searchLower) ||
					cv.user?.lastName.toLowerCase().includes(searchLower) ||
					cv.user?.email.toLowerCase().includes(searchLower)
			);
		}

		// Group CVs by userId
		const userGroups = new Map<string, any>();

		for (const cv of filteredCVs) {
			const userId = cv.userId;

			if (!userGroups.has(userId)) {
				userGroups.set(userId, {
					user: cv.user,
					cvs: [],
					organizations: new Set(),
					pendingCount: 0,
					lastUpdated: cv.createdAt
				});
			}

			const userGroup = userGroups.get(userId);
			userGroup.cvs.push(cv);
			userGroup.organizations.add(cv.organization?.name || 'Unknown');

			// Count pending reviews (submitted CVs with pending assignments)
			if (cv.status === 'submitted') {
				userGroup.pendingCount += cv.pendingAssignments.length;
			}

			// Track most recent update
			const updateTime = Math.max(
				cv.createdAt,
				cv.submittedAt || 0,
				cv.lockedAt || 0
			);
			userGroup.lastUpdated = Math.max(userGroup.lastUpdated, updateTime);
		}

		// Convert to array format for display
		const result = Array.from(userGroups.values()).map((userGroup) => ({
			userId: userGroup.user._id,
			user: userGroup.user,
			cvs: userGroup.cvs,
			organizations: Array.from(userGroup.organizations),
			pendingCount: userGroup.pendingCount,
			lastUpdated: userGroup.lastUpdated,
			totalCVs: userGroup.cvs.length,
			latestCV: userGroup.cvs.sort((a: any, b: any) => b.version - a.version)[0]
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

		// Get all CVs for this user
		const cvs = await ctx.db
			.query('expertCVs')
			.filter((q) => q.eq(q.field('userId'), args.userId))
			.order('desc')
			.collect();

		// Enrich CVs with full details
		const enrichedCVs = await Promise.all(
			cvs.map(async (cv) => {
				const organization = await ctx.db.get(cv.organizationId);

				// Get all service assignments for this CV
				const assignments = await ctx.db
					.query('expertServiceAssignments')
					.filter((q) => q.eq(q.field('expertCVId'), cv._id))
					.collect();

				// Enrich assignments with service details
				const enrichedAssignments = await Promise.all(
					assignments.map(async (assignment) => {
						const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
						const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

						return {
							...assignment,
							serviceVersion,
							serviceParent
						};
					})
				);

				return {
					...cv,
					organization,
					assignments: enrichedAssignments,
					pendingAssignments: enrichedAssignments.filter((a) => a.status === 'pending_review'),
					approvedAssignments: enrichedAssignments.filter((a) => a.status === 'approved'),
					rejectedAssignments: enrichedAssignments.filter((a) => a.status === 'rejected')
				};
			})
		);

		// Group by organization for display
		const organizationGroups = new Map<string, any>();

		for (const cv of enrichedCVs) {
			const orgId = cv.organizationId;

			if (!organizationGroups.has(orgId)) {
				organizationGroups.set(orgId, {
					organization: cv.organization,
					cvs: []
				});
			}

			organizationGroups.get(orgId).cvs.push(cv);
		}

		// Sort CVs by version within each organization
		for (const group of organizationGroups.values()) {
			group.cvs.sort((a: any, b: any) => b.version - a.version);
		}

		return {
			user,
			organizationGroups: Array.from(organizationGroups.values()),
			totalCVs: cvs.length,
			totalAssignments: enrichedCVs.reduce((sum, cv) => sum + cv.assignments.length, 0),
			pendingAssignments: enrichedCVs.reduce((sum, cv) => sum + cv.pendingAssignments.length, 0),
			submittedCVs: cvs.filter((cv) => cv.status === 'submitted').length,
			lockedCVs: cvs.filter((cv) => cv.status === 'locked').length
		};
	}
});

// ==========================================
// ADMIN CV REVIEW MUTATIONS (UPDATED FOR NEW SCHEMA)
// ==========================================

export const approveServiceAssignment = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		reviewNotes: v.optional(v.string()),
		reviewedBy: v.string() // Admin ID
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if assignment exists and is pending review
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		if (assignment.status !== 'pending_review') {
			throw new Error('Can only approve assignments that are pending review');
		}

		// Update assignment status
		const result = await ctx.db.patch(args.assignmentId, {
			status: 'approved',
			reviewedAt: now,
			reviewedBy: args.reviewedBy,
			approvedAt: now,
			approvedBy: args.reviewedBy,
			reviewNotes: args.reviewNotes
		});

		// Check if we should lock the CV
		await checkAndLockCV(ctx, assignment.expertCVId);

		return result;
	}
});

export const rejectServiceAssignment = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		rejectionReason: v.string(),
		reviewNotes: v.optional(v.string()),
		reviewedBy: v.string() // Admin ID
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if assignment exists and is pending review
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		if (assignment.status !== 'pending_review') {
			throw new Error('Can only reject assignments that are pending review');
		}

		// Update assignment status
		const result = await ctx.db.patch(args.assignmentId, {
			status: 'rejected',
			reviewedAt: now,
			reviewedBy: args.reviewedBy,
			rejectedAt: now,
			rejectedBy: args.reviewedBy,
			rejectionReason: args.rejectionReason,
			reviewNotes: args.reviewNotes
		});

		// Check if we should lock the CV
		await checkAndLockCV(ctx, assignment.expertCVId);

		return result;
	}
});

export const lockExpertCV = mutation({
	args: {
		expertCVId: v.id('expertCVs'),
		lockedBy: v.string()
	},
	handler: async (ctx, args) => {
		return await checkAndLockCV(ctx, args.expertCVId);
	}
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

async function checkAndLockCV(ctx: any, expertCVId: any) {
	// Get the CV
	const cv = await ctx.db.get(expertCVId);
	if (!cv || cv.status !== 'submitted') {
		return { locked: false, reason: 'CV not in submitted status' };
	}

	// Get all assignments for this CV
	const assignments = await ctx.db
		.query('expertServiceAssignments')
		.filter((q: any) => q.eq(q.field('expertCVId'), expertCVId))
		.collect();

	// Check if all assignments are decided (approved or rejected)
	const undecidedAssignments = assignments.filter(
		(a: any) => a.status === 'pending_review'
	);

	if (undecidedAssignments.length > 0) {
		return {
			locked: false,
			reason: `${undecidedAssignments.length} assignments still pending review`,
			pendingCount: undecidedAssignments.length
		};
	}

	// All assignments are decided, lock the CV
	const now = Date.now();
	await ctx.db.patch(expertCVId, {
		status: 'locked',
		lockedAt: now
	});

	return {
		locked: true,
		reason: 'All assignments decided',
		approvedCount: assignments.filter((a: any) => a.status === 'approved').length,
		rejectedCount: assignments.filter((a: any) => a.status === 'rejected').length
	};
}

// ==========================================
// UTILITY QUERIES FOR ADMIN INTERFACE (UPDATED FOR NEW SCHEMA)
// ==========================================

export const getAdminStats = query({
	args: {},
	handler: async (ctx) => {
		const allCVs = await ctx.db.query('expertCVs').collect();
		const allAssignments = await ctx.db.query('expertServiceAssignments').collect();

		const stats = {
			totalCVs: allCVs.length,
			draftCVs: allCVs.filter((cv) => cv.status === 'draft').length,
			submittedCVs: allCVs.filter((cv) => cv.status === 'submitted').length,
			lockedCVs: allCVs.filter((cv) => cv.status === 'locked').length,
			totalAssignments: allAssignments.length,
			pendingAssignments: allAssignments.filter((a) => a.status === 'pending_review').length,
			approvedAssignments: allAssignments.filter((a) => a.status === 'approved').length,
			rejectedAssignments: allAssignments.filter((a) => a.status === 'rejected').length,
			pendingReview: allAssignments.filter((a) => a.status === 'pending_review').length
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

// ==========================================
