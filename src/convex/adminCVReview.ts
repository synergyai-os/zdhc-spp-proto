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

				// Enrich assignments with service details and requirements
				const enrichedAssignments = await Promise.all(
					assignments.map(async (assignment) => {
						const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
						const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

						// Get requirements for this service version
						const requirements = await ctx.db
							.query('serviceVersionRequirements')
							.withIndex('by_service_version', (q: any) =>
								q.eq('serviceVersionId', assignment.serviceVersionId)
							)
							.collect();

						// Filter to active requirements by role applicability and sort
						const activeRequirements = requirements
							.filter((req) => {
								if (req.retiredAt) return false;
								const applicability = req.roleApplicability || 'both';
								if (assignment.role === 'lead') {
									return applicability === 'lead' || applicability === 'both';
								}
								return applicability === 'regular' || applicability === 'both';
							})
							.sort((a, b) => {
								if (a.order !== undefined && b.order !== undefined) {
									return a.order - b.order;
								}
								if (a.order !== undefined) return -1;
								if (b.order !== undefined) return 1;
								return a.createdAt - b.createdAt;
							});

						// Get check-offs from assignment
						const checkoffs = assignment.requirementCheckoffs || [];
						const checkoffMap = new Map(
							checkoffs.map((co: any) => [co.requirementId, co])
						);

						// Merge requirements with check-off status
						const requirementsWithStatus = activeRequirements.map((req) => {
							const checkoff = checkoffMap.get(req._id);
							return {
								...req,
								isChecked: checkoff?.isChecked || false,
								checkedAt: checkoff?.checkedAt,
								checkedBy: checkoff?.checkedBy
							};
						});

						return {
							...assignment,
							serviceVersion,
							serviceParent,
							requirements: requirementsWithStatus
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

		// Group CVs by organization first, then by user within each organization
		// This allows users to appear multiple times (once per organization)
		// Structure: Map<orgId, Map<userId, userGroup>>
		const orgGroups = new Map<string, Map<string, any>>();

		for (const cv of filteredCVs) {
			const orgId = cv.organizationId || cv.organization?._id || 'unknown';
			const userId = cv.userId;

			// Get or create organization group
			if (!orgGroups.has(orgId)) {
				orgGroups.set(orgId, new Map());
			}
			const orgGroup = orgGroups.get(orgId)!;

			// Get or create user group within this organization
			if (!orgGroup.has(userId)) {
				orgGroup.set(userId, {
					user: cv.user,
					organization: cv.organization,
					organizationId: orgId,
					cvs: [],
					pendingCount: 0,
					lastUpdated: cv.createdAt
				});
			}

			const userGroup = orgGroup.get(userId)!;
			userGroup.cvs.push(cv);

			// Count pending reviews (CVs that need admin attention)
			// This includes: payment_pending, paid, locked_for_review, unlocked_for_edits
			if (['payment_pending', 'paid', 'locked_for_review', 'unlocked_for_edits'].includes(cv.status)) {
				userGroup.pendingCount += cv.pendingAssignments.length;
			}

			// Track most recent update
			const updateTime = Math.max(
				cv.createdAt,
				cv.submittedAt || 0,
				cv.paidAt || 0,
				cv.lockedAt || 0
			);
			userGroup.lastUpdated = Math.max(userGroup.lastUpdated, updateTime);
		}

		// Flatten to one row per user-organization combination
		const result: any[] = [];
		for (const orgGroup of orgGroups.values()) {
			for (const userGroup of orgGroup.values()) {
				// Get the latest CV for this user-organization combination
				const latestCV = userGroup.cvs.sort((a: any, b: any) => b.version - a.version)[0];
				
				result.push({
					userId: userGroup.user._id,
					user: userGroup.user,
					cvs: userGroup.cvs,
					organizations: [userGroup.organization?.name || 'Unknown'],
					organizationId: userGroup.organizationId,
					pendingCount: userGroup.pendingCount,
					lastUpdated: userGroup.lastUpdated,
					totalCVs: userGroup.cvs.length,
					latestCV: latestCV
				});
			}
		}

		// Sort by last updated (most recent first)
		const finalResult = result.sort((a, b) => b.lastUpdated - a.lastUpdated);
		console.log('🎯 Final result:', finalResult.length, 'user-organization combinations');
		console.log('🎯 User-Org combinations:', finalResult.map((row: any) => ({ 
			userId: row.userId, 
			userName: row.user.firstName + ' ' + row.user.lastName,
			orgName: row.organizations[0],
			cvStatuses: row.cvs.map((cv: any) => cv.status)
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

				// Enrich assignments with service details and requirements
				const enrichedAssignments = await Promise.all(
					assignments.map(async (assignment) => {
						const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
						const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

						// Get requirements for this service version
						const requirements = await ctx.db
							.query('serviceVersionRequirements')
							.withIndex('by_service_version', (q: any) =>
								q.eq('serviceVersionId', assignment.serviceVersionId)
							)
							.collect();

						// Filter to active requirements and sort
						const activeRequirements = requirements
							.filter((req) => !req.retiredAt)
							.sort((a, b) => {
								if (a.order !== undefined && b.order !== undefined) {
									return a.order - b.order;
								}
								if (a.order !== undefined) return -1;
								if (b.order !== undefined) return 1;
								return a.createdAt - b.createdAt;
							});

						// Get check-offs from assignment
						const checkoffs = assignment.requirementCheckoffs || [];
						const checkoffMap = new Map(
							checkoffs.map((co: any) => [co.requirementId, co])
						);

						// Merge requirements with check-off status
						const requirementsWithStatus = activeRequirements.map((req) => {
							const checkoff = checkoffMap.get(req._id);
							return {
								...req,
								isChecked: checkoff?.isChecked || false,
								checkedAt: checkoff?.checkedAt,
								checkedBy: checkoff?.checkedBy
							};
						});

						return {
							...assignment,
							serviceVersion,
							serviceParent,
							requirements: requirementsWithStatus
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

		// Check if assignment exists
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		// Check if CV is already locked (can't change decisions after lock)
		const cv = await ctx.db.get(assignment.expertCVId);
		if (!cv || cv.status === 'locked_final') {
			throw new Error('Cannot change assignment status - CV is already locked');
		}

		// Update assignment status immediately (for admin feedback)
		// Training status will be set later when CV is locked
		const updateData: any = {
			status: 'approved',
			reviewedAt: now,
			reviewedBy: args.reviewedBy,
			approvedAt: now,
			approvedBy: args.reviewedBy,
			reviewNotes: args.reviewNotes
		};

		// Update assignment status
		await ctx.db.patch(args.assignmentId, updateData);

		return { success: true };
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

		// Check if assignment exists
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		// Check if CV is already locked (can't change decisions after lock)
		const cv = await ctx.db.get(assignment.expertCVId);
		if (!cv || cv.status === 'locked_final') {
			throw new Error('Cannot change assignment status - CV is already locked');
		}

		// Update assignment status immediately (for admin feedback)
		// Training status will be set later when CV is locked
		const updateData: any = {
			status: 'rejected',
			reviewedAt: now,
			reviewedBy: args.reviewedBy,
			rejectedAt: now,
			rejectedBy: args.reviewedBy,
			rejectionReason: args.rejectionReason,
			reviewNotes: args.reviewNotes
		};

		// Update assignment status
		await ctx.db.patch(args.assignmentId, updateData);

		return { success: true };
	}
});

export const lockExpertCV = mutation({
	args: {
		expertCVId: v.id('expertCVs'),
		lockedBy: v.string()
	},
	handler: async (ctx, args) => {
		return await lockCVFinalHandler(ctx, args.expertCVId, args.lockedBy);
	}
});

/**
 * Explicit CV locking - admin-controlled finalization
 * Only callable when all assignments are decided (approved/rejected)
 */
export const lockCVFinal = mutation({
	args: {
		cvId: v.id('expertCVs'),
		lockedBy: v.string()
	},
	handler: async (ctx, args) => {
		return await lockCVFinalHandler(ctx, args.cvId, args.lockedBy);
	}
});

/**
 * Handler function for CV locking logic
 */
async function lockCVFinalHandler(ctx: any, cvId: any, lockedBy: string) {
	const cv = await ctx.db.get(cvId);
	if (!cv) {
		throw new Error('CV not found');
	}

	if (cv.status !== 'locked_for_review') {
		throw new Error('CV must be in locked_for_review status to be locked');
	}

	// Get all assignments for this CV
	const assignments = await ctx.db
		.query('expertServiceAssignments')
		.filter((q: any) => q.eq(q.field('expertCVId'), cvId))
		.collect();

	// Check if all assignments are decided (approved or rejected)
	const undecidedAssignments = assignments.filter(
		(a: any) => a.status === 'pending_review'
	);

	if (undecidedAssignments.length > 0) {
		throw new Error(`${undecidedAssignments.length} assignments still pending review`);
	}

	// All assignments are decided - lock the CV
	const now = Date.now();
	await ctx.db.patch(cvId, {
		status: 'locked_final',
		lockedAt: now
	});

	// Process training status and send invitations for approved assignments
	await handlePostLockActions(ctx, cvId, assignments);

	return {
		success: true,
		locked: true,
		approvedCount: assignments.filter((a: any) => a.status === 'approved').length,
		rejectedCount: assignments.filter((a: any) => a.status === 'rejected').length
	};
}

/**
 * Toggle assignment status - allows admin to change decisions until CV is locked
 * Can switch between approved/rejected or set to pending_review
 */
export const toggleAssignmentStatus = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		newStatus: v.union(v.literal('approved'), v.literal('rejected'), v.literal('pending_review')),
		reviewedBy: v.string(),
		reviewNotes: v.optional(v.string()),
		rejectionReason: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if assignment exists
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		// Check if CV is already locked (can't change decisions after lock)
		const cv = await ctx.db.get(assignment.expertCVId);
		if (!cv || cv.status === 'locked_final') {
			throw new Error('Cannot change assignment status - CV is already locked');
		}

		// Build update data based on new status
		const updateData: any = {
			status: args.newStatus,
			reviewedAt: now,
			reviewedBy: args.reviewedBy,
			reviewNotes: args.reviewNotes
		};

		// Set appropriate timestamps and fields based on status
		if (args.newStatus === 'approved') {
			updateData.approvedAt = now;
			updateData.approvedBy = args.reviewedBy;
			// Clear rejection fields if switching from rejected
			updateData.rejectedAt = undefined;
			updateData.rejectedBy = undefined;
			updateData.rejectionReason = undefined;
		} else if (args.newStatus === 'rejected') {
			updateData.rejectedAt = now;
			updateData.rejectedBy = args.reviewedBy;
			updateData.rejectionReason = args.rejectionReason || 'No reason provided';
			// Clear approval fields if switching from approved
			updateData.approvedAt = undefined;
			updateData.approvedBy = undefined;
		} else if (args.newStatus === 'pending_review') {
			// Clear all decision fields when resetting to pending
			updateData.approvedAt = undefined;
			updateData.approvedBy = undefined;
			updateData.rejectedAt = undefined;
			updateData.rejectedBy = undefined;
			updateData.rejectionReason = undefined;
		}

		// Update assignment status
		await ctx.db.patch(args.assignmentId, updateData);

		return { success: true };
	}
});

/**
 * Clear training status for approved assignments whose CVs are not locked
 * This fixes the issue where old assignments have training status set prematurely
 */
export const clearPrematureTrainingStatus = mutation({
	args: {},
	handler: async (ctx) => {
		// Get all approved assignments
		const approvedAssignments = await ctx.db
			.query('expertServiceAssignments')
			.filter((q: any) => q.eq(q.field('status'), 'approved'))
			.collect();

		let clearedCount = 0;

		for (const assignment of approvedAssignments) {
			// Get the CV for this assignment
			const cv = await ctx.db.get(assignment.expertCVId);
			
			// If CV is not locked_final, clear the training status
			if (cv && cv.status !== 'locked_final' && assignment.trainingStatus) {
				await ctx.db.patch(assignment._id, {
					trainingStatus: undefined,
					trainingNotes: undefined,
					qualificationId: undefined,
					qualifiedAt: undefined
				});
				clearedCount++;
			}
		}

		return {
			success: true,
			clearedCount,
			message: `Cleared training status for ${clearedCount} assignments`
		};
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
		lockedAt: now
	});

	// Handle post-lock actions
	await handlePostLockActions(ctx, expertCVId, assignments);

	return {
		locked: true,
		reason: 'All assignments decided',
		approvedCount: assignments.filter((a: any) => a.status === 'approved').length,
		rejectedCount: assignments.filter((a: any) => a.status === 'rejected').length
	};
}

/**
 * Handle post-lock actions when a CV becomes locked_final
 * This includes academy qualification checks, email notifications, and webhook integrations
 */
async function handlePostLockActions(ctx: any, expertCVId: any, assignments: any[]) {
	console.log('🎯 Handling post-lock actions for CV:', expertCVId);
	
	// Get the CV and user details
	const cv = await ctx.db.get(expertCVId);
	if (!cv) {
		console.error('❌ CV not found for post-lock actions:', expertCVId);
		return;
	}

	const user = await ctx.db.get(cv.userId);
	if (!user) {
		console.error('❌ User not found for post-lock actions:', cv.userId);
		return;
	}

	console.log('👤 Processing post-lock actions for user:', user.firstName, user.lastName, user.email);

	// Filter to only approved assignments (these need academy processing)
	const approvedAssignments = assignments.filter(a => a.status === 'approved');
	console.log('✅ Approved assignments:', approvedAssignments.length);

	// Process each approved assignment
	for (const assignment of approvedAssignments) {
		await processApprovedAssignment(ctx, assignment, user, cv);
	}

	// Send summary email to user
	await sendCVReviewCompleteEmail(user, cv, approvedAssignments);

	// Send webhook to academy system
	await sendAcademyWebhook(user, cv, approvedAssignments);
}

/**
 * Process an approved service assignment for academy qualification
 */
async function processApprovedAssignment(ctx: any, assignment: any, user: any, cv: any) {
	console.log('🔍 Processing approved assignment:', assignment._id);

	// Check if user already has qualification for this service version
	const existingQualification = await ctx.db
		.query('expertQualifications')
		.withIndex('by_user_service', (q: any) =>
			q.eq('userId', assignment.userId).eq('serviceVersionId', assignment.serviceVersionId)
		)
		.first();

	if (existingQualification) {
		console.log('✅ User already qualified for service:', assignment.serviceVersionId);
		
		// Update assignment with existing qualification info
		await ctx.db.patch(assignment._id, {
			trainingStatus: 'not_required',
			qualificationId: existingQualification._id.toString(),
			qualifiedAt: existingQualification.trainingPassedAt,
			trainingNotes: `Already qualified - training completed on ${new Date(existingQualification.trainingPassedAt).toISOString()}`
		});
	} else {
		console.log('📚 User needs academy training for service:', assignment.serviceVersionId);
		
		// Update assignment to require training
		await ctx.db.patch(assignment._id, {
			trainingStatus: 'required',
			trainingNotes: 'Training required - will be invited to academy'
		});

		// TODO: Send academy invitation
		// await sendAcademyInvitation(user, assignment);
		console.log('📧 TODO: Send academy invitation for user:', user.email, 'service:', assignment.serviceVersionId);
	}
}

/**
 * Send email notification when CV review is complete
 */
async function sendCVReviewCompleteEmail(user: any, cv: any, approvedAssignments: any[]) {
	console.log('📧 TODO: Send CV review complete email to:', user.email);
	console.log('📧 Email content would include:');
	console.log('   - CV review completed');
	console.log('   - Approved services:', approvedAssignments.length);
	console.log('   - Next steps for academy training (if needed)');
	console.log('   - Contact information for support');
	
	// TODO: Implement actual email sending
	// await emailService.sendCVReviewComplete({
	//   to: user.email,
	//   firstName: user.firstName,
	//   lastName: user.lastName,
	//   approvedServices: approvedAssignments.map(a => a.serviceVersion?.name),
	//   needsTraining: approvedAssignments.some(a => a.trainingStatus === 'required')
	// });
}

/**
 * Send webhook to academy system for training management
 */
async function sendAcademyWebhook(user: any, cv: any, approvedAssignments: any[]) {
	console.log('🔗 TODO: Send webhook to academy system');
	console.log('🔗 Webhook payload would include:');
	console.log('   - User details:', user.email);
	console.log('   - CV ID:', cv._id);
	console.log('   - Approved services requiring training');
	console.log('   - Organization context');
	
	// TODO: Implement actual webhook sending
	// await webhookService.sendToAcademy({
	//   event: 'cv_review_complete',
	//   userId: user._id,
	//   userEmail: user.email,
	//   cvId: cv._id,
	//   approvedServices: approvedAssignments.filter(a => a.trainingStatus === 'required'),
	//   organizationId: cv.organizationId
	// });
}

// ==========================================
// ITEM-LEVEL REVIEW LOCKING (ADMIN CONTROL)
// ==========================================

/**
 * Set items under review - lock/unlock specific CV items for review
 * Admin can select specific items to review, protecting them from edits
 */
export const setItemsUnderReview = mutation({
	args: {
		cvId: v.id('expertCVs'),
		section: v.union(
			v.literal('experience'),
			v.literal('education'),
			v.literal('training'),
			v.literal('approvals')
		),
		itemIndices: v.array(v.number()), // Array of item indices to lock/unlock
		lock: v.boolean() // true to lock, false to unlock
	},
	handler: async (ctx, args) => {
		const cv = await ctx.db.get(args.cvId);
		if (!cv) {
			throw new Error('CV not found');
		}

		// Only allow this when CV is in review states
		if (cv.status !== 'locked_for_review' && cv.status !== 'unlocked_for_edits') {
			throw new Error('Can only set review locks when CV is locked_for_review or unlocked_for_edits');
		}

		const now = Date.now();
		const sectionFieldMap: Record<string, keyof typeof cv> = {
			experience: 'experience',
			education: 'education',
			training: 'trainingQualifications',
			approvals: 'otherApprovals'
		};

		const fieldName = sectionFieldMap[args.section];
		if (!fieldName) {
			throw new Error(`Invalid section: ${args.section}`);
		}

		const sectionArray = cv[fieldName] as any[] | undefined;
		if (!sectionArray) {
			throw new Error(`Section ${args.section} not found or empty`);
		}

		// Validate indices
		for (const index of args.itemIndices) {
			if (index < 0 || index >= sectionArray.length) {
				throw new Error(`Invalid index ${index} for section ${args.section}`);
			}
		}

		// Create updated array with locked/unlocked items
		const updatedArray = sectionArray.map((item, index) => {
			if (args.itemIndices.includes(index)) {
				return {
					...item,
					lockedForReviewAt: args.lock ? now : undefined
				};
			}
			return item; // Keep unchanged
		});

		// Update the CV
		await ctx.db.patch(args.cvId, {
			[fieldName]: updatedArray
		});

		return {
			success: true,
			lockedCount: args.lock ? args.itemIndices.length : 0,
			unlockedCount: args.lock ? 0 : args.itemIndices.length
		};
	}
});

// ==========================================
// UTILITY QUERIES FOR ADMIN INTERFACE (UPDATED FOR NEW SCHEMA)
// ==========================================

export const getAdminStats = query({
	args: {},
	handler: async (ctx) => {
		const allCVs = await ctx.db.query('expertCVs').collect();
		const allAssignments = await ctx.db.query('expertServiceAssignments').collect();

		// Group CVs by organization first, then by user within each organization
		// This matches the table logic where users appear once per organization
		// Structure: Map<orgId, Map<userId, cvs[]>>
		const orgGroups = new Map<string, Map<string, any[]>>();

		for (const cv of allCVs) {
			const orgId = cv.organizationId || 'unknown';
			const userId = cv.userId;

			// Get or create organization group
			if (!orgGroups.has(orgId)) {
				orgGroups.set(orgId, new Map());
			}
			const orgGroup = orgGroups.get(orgId)!;

			// Get or create user group within this organization
			if (!orgGroup.has(userId)) {
				orgGroup.set(userId, []);
			}
			orgGroup.get(userId)!.push(cv);
		}

		// Count user-organization combinations where ANY CV matches each status
		// This matches the table filtering logic which checks if any CV matches
		const draftCount = Array.from(orgGroups.values()).reduce((count, orgGroup) => {
			return count + Array.from(orgGroup.values()).filter((userCVs) =>
				userCVs.some((cv) => cv.status === 'draft')
			).length;
		}, 0);

		const completedCount = Array.from(orgGroups.values()).reduce((count, orgGroup) => {
			return count + Array.from(orgGroup.values()).filter((userCVs) =>
				userCVs.some((cv) => cv.status === 'completed')
			).length;
		}, 0);

		const paymentPendingCount = Array.from(orgGroups.values()).reduce((count, orgGroup) => {
			return count + Array.from(orgGroup.values()).filter((userCVs) =>
				userCVs.some((cv) => cv.status === 'payment_pending')
			).length;
		}, 0);

		const paidCount = Array.from(orgGroups.values()).reduce((count, orgGroup) => {
			return count + Array.from(orgGroup.values()).filter((userCVs) =>
				userCVs.some((cv) => cv.status === 'paid')
			).length;
		}, 0);

		const lockedForReviewCount = Array.from(orgGroups.values()).reduce((count, orgGroup) => {
			return count + Array.from(orgGroup.values()).filter((userCVs) =>
				userCVs.some((cv) => cv.status === 'locked_for_review')
			).length;
		}, 0);

		const unlockedForEditsCount = Array.from(orgGroups.values()).reduce((count, orgGroup) => {
			return count + Array.from(orgGroup.values()).filter((userCVs) =>
				userCVs.some((cv) => cv.status === 'unlocked_for_edits')
			).length;
		}, 0);

		const lockedFinalCount = Array.from(orgGroups.values()).reduce((count, orgGroup) => {
			return count + Array.from(orgGroup.values()).filter((userCVs) =>
				userCVs.some((cv) => cv.status === 'locked_final')
			).length;
		}, 0);

		// Count stats matching table display logic
		const stats = {
			totalCVs: allCVs.length,
			draftCVs: draftCount,
			completedCVs: completedCount,
			paymentPendingCVs: paymentPendingCount,
			paidCVs: paidCount,
			lockedForReviewCVs: lockedForReviewCount,
			unlockedForEditsCVs: unlockedForEditsCount,
			lockedFinalCVs: lockedFinalCount,
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
