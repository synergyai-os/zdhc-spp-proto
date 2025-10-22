import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { CV_STATUS_VALIDATOR, SERVICE_STATUS_VALUES } from './model/status';

// ==========================================
// ADMIN CV REVIEW QUERIES (UPDATED FOR NEW SCHEMA)
// ==========================================

export const getExpertsForCVReview = query({
	args: {
		status: v.optional(CV_STATUS_VALIDATOR),
		organizationId: v.optional(v.id('organizations')),
		searchTerm: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		console.log('🔍 getExpertsForCVReview called with args:', args);
		
		// Get all CVs - admin needs to see everything including drafts for support
		let cvsQuery = ctx.db.query('expertCVs');

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
		console.log('📊 Raw CVs from database:', cvs.length, 'CVs');
		console.log('📊 CV statuses:', cvs.map(cv => ({ id: cv._id, status: cv.status, userId: cv.userId })));

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

			// Count pending reviews (CVs that need admin attention)
			// This includes: payment_pending, paid, locked_for_review, unlocked_for_edits
			if (['payment_pending', 'paid', 'locked_for_review', 'unlocked_for_edits'].includes(cv.status)) {
				userGroup.pendingCount += cv.pendingAssignments.length;
			}

			// Track most recent update
			const updateTime = Math.max(
				cv.createdAt,
				cv.completedAt || 0,
				cv.paymentInitiatedAt || 0,
				cv.paidAt || 0,
				cv.submittedAt || 0,
				cv.lockedForReviewAt || 0,
				cv.unlockedForEditsAt || 0,
				cv.lockedFinalAt || 0
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
		const finalResult = result.sort((a, b) => b.lastUpdated - a.lastUpdated);
		console.log('🎯 Final result:', finalResult.length, 'users');
		console.log('🎯 User CV statuses:', finalResult.map(user => ({ 
			userId: user.userId, 
			userName: user.user.firstName + ' ' + user.user.lastName,
			cvStatuses: user.cvs.map(cv => cv.status)
		})));
		
		return finalResult;
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
			lockedForReviewCVs: cvs.filter((cv) => cv.status === 'locked_for_review').length,
			lockedFinalCVs: cvs.filter((cv) => cv.status === 'locked_final').length
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

		if (assignment.status !== 'pending_review') { // 'pending_review'
			throw new Error('Can only approve assignments that are pending review');
		}

		// Check if user already has qualification for this service version
		const existingQualification = await ctx.db
			.query('expertQualifications')
			.withIndex('by_user_service', (q) =>
				q.eq('userId', assignment.userId).eq('serviceVersionId', assignment.serviceVersionId)
			)
			.first();

		// Determine training status based on existing qualification
		const trainingStatus = existingQualification ? 'not_required' : 'required';
		const updateData: any = {
			status: 'approved',
			trainingStatus,
			reviewedAt: now,
			reviewedBy: args.reviewedBy,
			approvedAt: now,
			approvedBy: args.reviewedBy,
			reviewNotes: args.reviewNotes
		};

		// If already qualified, set qualification reference and timestamp
		if (existingQualification) {
			updateData.qualificationId = existingQualification._id.toString();
			updateData.qualifiedAt = existingQualification.trainingPassedAt;
			updateData.trainingNotes = `Already qualified - training completed on ${new Date(existingQualification.trainingPassedAt).toISOString()}`;
		}

		// Update assignment status
		const result = await ctx.db.patch(args.assignmentId, updateData);

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

		if (assignment.status !== 'pending_review') { // 'pending_review'
			throw new Error('Can only reject assignments that are pending review');
		}

		// Update assignment status
		const result = await ctx.db.patch(args.assignmentId, {
			status: 'rejected', // 'rejected'
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
	if (!cv || cv.status !== 'locked_for_review') {
		return { locked: false, reason: 'CV not in locked_for_review status' };
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

	// All assignments are decided, lock the CV to final status
	const now = Date.now();
	await ctx.db.patch(expertCVId, {
		status: 'locked_final',
		lockedFinalAt: now
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
			completedCVs: allCVs.filter((cv) => cv.status === 'completed').length,
			paymentPendingCVs: allCVs.filter((cv) => cv.status === 'payment_pending').length,
			paidCVs: allCVs.filter((cv) => cv.status === 'paid').length,
			lockedForReviewCVs: allCVs.filter((cv) => cv.status === 'locked_for_review').length,
			unlockedForEditsCVs: allCVs.filter((cv) => cv.status === 'unlocked_for_edits').length,
			lockedFinalCVs: allCVs.filter((cv) => cv.status === 'locked_final').length,
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
