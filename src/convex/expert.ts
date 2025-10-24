import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { CV_STATUS_VALIDATOR, TRAINING_STATUS_VALIDATOR } from './model/status';



/**
 * Get expert CVs with optional filters
 * 
 * What it does:
 * 1. Queries expertCVs table with optional filters
 * 2. Enriches each CV with user and organization data
 * 3. Adds assignment counts and status summaries
 * 
 * Usage: Used by checkout page to get completed CVs for payment
 */
export const getCVs = query({
	args: {
		userId: v.optional(v.id('users')),
		organizationId: v.optional(v.id('organizations')),
		status: v.optional(CV_STATUS_VALIDATOR)
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query('expertCVs');

		// Apply filters
		if (args.userId) {
			query = query.filter((q) => q.eq(q.field('userId'), args.userId));
		}

		if (args.organizationId) {
			query = query.filter((q) => q.eq(q.field('organizationId'), args.organizationId));
		}

		if (args.status) {
			query = query.filter((q) => q.eq(q.field('status'), args.status));
		}

		// Get CVs ordered by newest first
		const cvs = await query.order('desc').collect();

		// Enrich with user details and assignment counts
		const enrichedCVs = await Promise.all(
			cvs.map(async (cv) => {
				const user = await ctx.db.get(cv.userId);
				const organization = await ctx.db.get(cv.organizationId);

				// Get assignment count for this CV
				const assignments = await ctx.db
					.query('expertServiceAssignments')
					.filter((q) => q.eq(q.field('expertCVId'), cv._id))
					.collect();

				return {
					...cv,
					user,
					organization,
					assignmentCount: assignments.length,
					approvedCount: assignments.filter((a) => a.status === 'approved').length,
					pendingCount: assignments.filter((a) => a.status === 'pending_review').length,
					rejectedCount: assignments.filter((a) => a.status === 'rejected').length
				};
			})
		);

		return enrichedCVs;
	}
});

/**
 * Get the latest CV(s) with optional filters
 * 
 * What it does:
 * 1. Finds CVs with optional filters (userId, organizationId, status)
 * 2. Groups by user and gets the latest CV for each user
 * 3. Returns single CV if userId provided, or array of latest CVs if not
 * 
 * Usage: 
 * - Edit CV page: getLatestCV({ userId, organizationId }) -> single CV
 * - Admin dashboard: getLatestCV({ organizationId }) -> array of latest CVs per user
 * - Checkout: getLatestCV({ organizationId, status: 'completed' }) -> latest completed CVs
 */
export const getLatestCV = query({
	args: {
		userId: v.optional(v.id('users')),
		organizationId: v.optional(v.id('organizations')),
		status: v.optional(CV_STATUS_VALIDATOR)
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query('expertCVs');

		// Apply filters
		if (args.userId) {
			query = query.filter((q) => q.eq(q.field('userId'), args.userId));
		}

		if (args.organizationId) {
			query = query.filter((q) => q.eq(q.field('organizationId'), args.organizationId));
		}

		if (args.status) {
			query = query.filter((q) => q.eq(q.field('status'), args.status));
		}

		// Get all matching CVs ordered by newest first
		const cvs = await query.order('desc').collect();

		// Enrich CVs with user data
		const enrichedCVs = await Promise.all(
			cvs.map(async (cv) => {
				const user = await ctx.db.get(cv.userId);
				return { ...cv, user };
			})
		);

		// If userId provided, return single latest CV for that user
		if (args.userId) {
			return enrichedCVs.length > 0 ? enrichedCVs[0] : null;
		}

		// If no userId, group by user and return latest CV for each user
		const userLatestCVs = new Map();
		enrichedCVs.forEach(cv => {
			if (!userLatestCVs.has(cv.userId)) {
				userLatestCVs.set(cv.userId, cv);
			}
		});

		return Array.from(userLatestCVs.values());
	}
});

/**
 * Get all service assignments for a specific CV
 * 
 * What it does:
 * 1. Verifies the CV belongs to the specified user and organization (security)
 * 2. Finds all service assignments linked to this CV
 * 3. Returns the assignments with their details
 * 
 * Usage: Used by the edit CV page to show which services are assigned
 */
export const getServicesByCV = query({
	args: {
		cvId: v.id('expertCVs'),
		userId: v.id('users'),
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		// 1. First verify the CV exists and belongs to this user/org (security check)
		const cv = await ctx.db.get(args.cvId);
		if (!cv) {
			throw new Error('CV not found');
		}
		if (cv.userId !== args.userId || cv.organizationId !== args.organizationId) {
			throw new Error('CV does not belong to this user/organization');
		}

		// 2. Query the 'expertServiceAssignments' table
		const assignments = await ctx.db
			.query('expertServiceAssignments')
			// 3. Filter by CV ID
			.filter((q) => q.eq(q.field('expertCVId'), args.cvId))
			// 4. Get all results
			.collect();

		// 5. Enrich each assignment with service name
		const enrichedAssignments = await Promise.all(
			assignments.map(async (assignment) => {
				// Get the service version details
				const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
				return {
					...assignment, // Keep all original assignment data
					serviceName: serviceVersion?.name || 'Unknown Service', // Add service name
					serviceDescription: serviceVersion?.description || '' // Add service description
				};
			})
		);

		// 6. Return the enriched assignments
		return enrichedAssignments;
	}
});

/**
 * Add a new service assignment to an expert's CV
 * 
 * What it does:
 * 1. Verifies the CV exists and belongs to the user/org (security)
 * 2. Creates a new service assignment with default role 'regular'
 * 3. Returns the created assignment ID
 * 
 * Usage: Used when user checks a service checkbox
 */
export const addService = mutation({
	args: {
		cvId: v.id('expertCVs'),
		userId: v.id('users'),
		organizationId: v.id('organizations'),
		serviceVersionId: v.id('serviceVersions'),
		role: v.optional(v.union(v.literal('lead'), v.literal('regular')))
	},
	handler: async (ctx, args) => {
		// 1. Verify the CV exists and belongs to this user/org (security check)
		const cv = await ctx.db.get(args.cvId);
		if (!cv) {
			throw new Error('CV not found');
		}
		if (cv.userId !== args.userId || cv.organizationId !== args.organizationId) {
			throw new Error('CV does not belong to this user/organization');
		}

		// 2. Check if assignment already exists (prevent duplicates)
		const existingAssignment = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) =>
				q.and(
					q.eq(q.field('expertCVId'), args.cvId),
					q.eq(q.field('serviceVersionId'), args.serviceVersionId)
				)
			)
			.first();

		if (existingAssignment) {
			throw new Error('Service assignment already exists');
		}

		// 3. Create new service assignment
		const assignmentId = await ctx.db.insert('expertServiceAssignments', {
			userId: args.userId,
			organizationId: args.organizationId,
			expertCVId: args.cvId,
			serviceVersionId: args.serviceVersionId,
			role: args.role || 'regular', // Use provided role or default to 'regular'
			status: 'pending_review', // Default status
			// Don't set trainingStatus here - it will be set when CV is locked
			createdAt: Date.now(),
			assignedBy: 'user' // TODO: Get actual user ID
		});

		return assignmentId;
	}
});

/**
 * Remove a service assignment from an expert's CV
 * 
 * What it does:
 * 1. Verifies the CV exists and belongs to the user/org (security)
 * 2. Finds the specific service assignment
 * 3. Deletes the assignment
 * 
 * Usage: Used when user unchecks a service checkbox
 */
export const removeService = mutation({
	args: {
		cvId: v.id('expertCVs'),
		userId: v.id('users'),
		organizationId: v.id('organizations'),
		serviceVersionId: v.id('serviceVersions')
	},
	handler: async (ctx, args) => {
		// 1. Verify the CV exists and belongs to this user/org (security check)
		const cv = await ctx.db.get(args.cvId);
		if (!cv) {
			throw new Error('CV not found');
		}
		if (cv.userId !== args.userId || cv.organizationId !== args.organizationId) {
			throw new Error('CV does not belong to this user/organization');
		}

		// 2. Find the specific service assignment
		const assignment = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) =>
				q.and(
					q.eq(q.field('expertCVId'), args.cvId),
					q.eq(q.field('serviceVersionId'), args.serviceVersionId)
				)
			)
			.first();

		if (!assignment) {
			throw new Error('Service assignment not found');
		}

		// 3. Delete the assignment
		await ctx.db.delete(assignment._id);

		return { success: true };
	}
});

/**
 * Update the role of an existing service assignment
 * 
 * What it does:
 * 1. Verifies the assignment exists and belongs to the user/org (security)
 * 2. Updates the role field
 * 3. Returns success confirmation
 * 
 * Usage: Used when user changes role dropdown
 */
export const updateServiceRole = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		newRole: v.union(v.literal('lead'), v.literal('regular'))
	},
	handler: async (ctx, args) => {
		// 1. Verify the assignment exists
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Service assignment not found');
		}

		// 2. Update the role
		await ctx.db.patch(args.assignmentId, { role: args.newRole });

		return { success: true };
	}
});

/**
 * Update CV status
 * 
 * Usage: Used to transition CV status (e.g., draft → completed)
 */
export const updateCVStatus = mutation({
	args: {
		cvId: v.id('expertCVs'),
		newStatus: CV_STATUS_VALIDATOR
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		
		// Prepare update data
		const updateData: any = { 
			status: args.newStatus
		};

		// Set appropriate timestamp based on status
		if (args.newStatus === 'paid') {
			updateData.paidAt = now;
		} else if (args.newStatus === 'locked_for_review') {
			updateData.lockedAt = now;
		} else if (args.newStatus === 'unlocked_for_edits') {
			updateData.lockedAt = now;
		} else if (args.newStatus === 'locked_final') {
			updateData.lockedAt = now;
		}

		// Update the CV status and timestamp
		await ctx.db.patch(args.cvId, updateData);

		return { success: true };
	}
});

export const updateCV = mutation({
	args: {
		cvId: v.id('expertCVs'),
		organizationId: v.id('organizations'),
		experience: v.optional(v.array(v.object({
			title: v.string(),
			company: v.string(),
			location: v.optional(v.string()),
			startDate: v.string(),
			endDate: v.optional(v.string()),
			current: v.boolean(),
			description: v.optional(v.string())
		}))),
		education: v.optional(v.array(v.object({
			school: v.string(),
			degree: v.string(),
			field: v.string(),
			startDate: v.string(),
			endDate: v.string(),
			description: v.string()
		})))
	},
	handler: async (ctx, args) => {
		// Get the CV to check organization
		const cv = await ctx.db.get(args.cvId);
		if (!cv) {
			throw new Error('CV not found');
		}

		// Basic security: Check organization
		if (cv.organizationId !== args.organizationId) {
			throw new Error('Unauthorized: Wrong organization');
		}

		// Update CV data
		const updateData: any = {};
		if (args.experience !== undefined) {
			updateData.experience = args.experience;
		}
		if (args.education !== undefined) {
			updateData.education = args.education;
		}

		await ctx.db.patch(args.cvId, updateData);
		return { success: true };
	}
});

/**
 * Get user details by ID
 * 
 * What it returns:
 * - _id, firstName, lastName, email, isActive
 * 
 * Usage: Used by edit CV page to show user info in header
 */
export const getUser = query({
	args: {
		userId: v.id('users')
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) {
			return null;
		}
		return {
			_id: user._id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			isActive: user.isActive
		};
	}
});

// ==========================================
// TRAINING LIFECYCLE MUTATIONS
// ==========================================

export const sendTrainingInvitation = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		invitedBy: v.string() // Manager ID
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if assignment exists and is approved
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		if (assignment.status !== 'approved') {
			throw new Error('Can only send training invitations for approved assignments');
		}

		if (assignment.trainingStatus !== 'required') {
			throw new Error('Training invitation already sent or not required');
		}

		// Update assignment with training invitation
		const result = await ctx.db.patch(args.assignmentId, {
			trainingStatus: 'invited',
			trainingInvitedAt: now,
			trainingNotes: `Training invitation sent by ${args.invitedBy} at ${new Date(now).toISOString()}`
		});

		return {
			success: true,
			assignmentId: args.assignmentId,
			trainingStatus: 'invited',
			invitedAt: now
		};
	}
});

export const startTraining = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		academyTrainingId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if assignment exists and is invited
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		if (assignment.trainingStatus !== 'invited') {
			throw new Error('Can only start training for invited assignments');
		}

		// Update assignment with training start
		const updateData: any = {
			trainingStatus: 'in_progress',
			trainingStartedAt: now
		};

		if (args.academyTrainingId) {
			updateData.academyTrainingId = args.academyTrainingId;
		}

		const result = await ctx.db.patch(args.assignmentId, updateData);

		return {
			success: true,
			assignmentId: args.assignmentId,
			trainingStatus: 'in_progress',
			startedAt: now
		};
	}
});

export const completeTraining = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		passed: v.boolean(),
		academyTrainingId: v.optional(v.string()),
		completedBy: v.optional(v.string()) // Academy system or admin override
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if assignment exists and is in progress
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		if (assignment.trainingStatus !== 'in_progress') {
			throw new Error('Can only complete training for assignments in progress');
		}

		const newStatus = args.passed ? 'passed' : 'failed';
		const updateData: any = {
			trainingStatus: newStatus,
			trainingCompletedAt: now
		};

		if (args.academyTrainingId) {
			updateData.academyTrainingId = args.academyTrainingId;
		}

		if (args.completedBy) {
			updateData.trainingNotes = `Training ${newStatus} by ${args.completedBy} at ${new Date(now).toISOString()}`;
		}

		if (args.passed) {
			updateData.qualifiedAt = now;
		} else {
			updateData.trainingFailedAt = now;
		}

		const result = await ctx.db.patch(args.assignmentId, updateData);

		// If training passed, create global qualification record
		if (args.passed) {
			await createGlobalQualification(ctx, assignment, now, args.academyTrainingId, args.completedBy);
		}

		return {
			success: true,
			assignmentId: args.assignmentId,
			trainingStatus: newStatus,
			completedAt: now,
			passed: args.passed
		};
	}
});

export const checkExistingQualification = query({
	args: {
		userId: v.id('users'),
		serviceVersionId: v.id('serviceVersions')
	},
	handler: async (ctx, args) => {
		// Check if user already has qualification for this service version
		const qualification = await ctx.db
			.query('expertQualifications')
			.withIndex('by_user_service', (q) =>
				q.eq('userId', args.userId).eq('serviceVersionId', args.serviceVersionId)
			)
			.first();

		return qualification ? {
			exists: true,
			qualification,
			trainingPassedAt: qualification.trainingPassedAt,
			originalOrganizationId: qualification.originalOrganizationId
		} : {
			exists: false
		};
	}
});

// ==========================================
// QUALIFICATION MANAGEMENT
// ==========================================

export const getExpertQualifications = query({
	args: {
		userId: v.optional(v.id('users')),
		serviceVersionId: v.optional(v.id('serviceVersions')),
		organizationId: v.optional(v.id('organizations'))
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query('expertQualifications');

		if (args.userId) {
			query = query.filter((q) => q.eq(q.field('userId'), args.userId));
		}

		if (args.serviceVersionId) {
			query = query.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId));
		}

		const qualifications = await query.order('desc').collect();

		// Enrich with related data
		const enrichedQualifications = await Promise.all(
			qualifications.map(async (qualification) => {
				const user = await ctx.db.get(qualification.userId);
				const serviceVersion = await ctx.db.get(qualification.serviceVersionId);
				const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;
				const originalAssignment = await ctx.db.get(qualification.originalAssignmentId);
				const originalOrganization = await ctx.db.get(qualification.originalOrganizationId);

				return {
					...qualification,
					user,
					serviceVersion,
					serviceParent,
					originalAssignment,
					originalOrganization
				};
			})
		);

		return enrichedQualifications;
	}
});

export const getQualificationByUserAndService = query({
	args: {
		userId: v.id('users'),
		serviceVersionId: v.id('serviceVersions')
	},
	handler: async (ctx, args) => {
		const qualification = await ctx.db
			.query('expertQualifications')
			.withIndex('by_user_service', (q) =>
				q.eq('userId', args.userId).eq('serviceVersionId', args.serviceVersionId)
			)
			.first();

		if (!qualification) {
			return null;
		}

		// Enrich with related data
		const user = await ctx.db.get(qualification.userId);
		const serviceVersion = await ctx.db.get(qualification.serviceVersionId);
		const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;
		const originalAssignment = await ctx.db.get(qualification.originalAssignmentId);
		const originalOrganization = await ctx.db.get(qualification.originalOrganizationId);

		return {
			...qualification,
			user,
			serviceVersion,
			serviceParent,
			originalAssignment,
			originalOrganization
		};
	}
});

export const checkQualificationExists = query({
	args: {
		userId: v.id('users'),
		serviceVersionId: v.id('serviceVersions')
	},
	handler: async (ctx, args) => {
		const qualification = await ctx.db
			.query('expertQualifications')
			.withIndex('by_user_service', (q) =>
				q.eq('userId', args.userId).eq('serviceVersionId', args.serviceVersionId)
			)
			.first();

		return {
			exists: !!qualification,
			qualification: qualification || null
		};
	}
});

export const createQualification = mutation({
	args: {
		userId: v.id('users'),
		serviceVersionId: v.id('serviceVersions'),
		trainingPassedAt: v.number(),
		originalAssignmentId: v.id('expertServiceAssignments'),
		originalOrganizationId: v.id('organizations'),
		trainingCompletedBy: v.optional(v.string()),
		academyTrainingId: v.optional(v.string()),
		certificateUrl: v.optional(v.string()),
		notes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if qualification already exists
		const existingQualification = await ctx.db
			.query('expertQualifications')
			.withIndex('by_user_service', (q) =>
				q.eq('userId', args.userId).eq('serviceVersionId', args.serviceVersionId)
			)
			.first();

		if (existingQualification) {
			throw new Error('Qualification already exists for this user and service');
		}

		// Verify the original assignment exists and belongs to the user
		const originalAssignment = await ctx.db.get(args.originalAssignmentId);
		if (!originalAssignment) {
			throw new Error('Original assignment not found');
		}

		if (originalAssignment.userId !== args.userId || 
			originalAssignment.serviceVersionId !== args.serviceVersionId) {
			throw new Error('Original assignment does not match user and service');
		}

		// Create qualification record
		const qualificationId = await ctx.db.insert('expertQualifications', {
			userId: args.userId,
			serviceVersionId: args.serviceVersionId,
			trainingPassedAt: args.trainingPassedAt,
			trainingCompletedBy: args.trainingCompletedBy,
			originalAssignmentId: args.originalAssignmentId,
			originalOrganizationId: args.originalOrganizationId,
			academyTrainingId: args.academyTrainingId,
			certificateUrl: args.certificateUrl,
			notes: args.notes,
			createdAt: now
		});

		return {
			success: true,
			qualificationId,
			timestamp: now
		};
	}
});

export const updateQualification = mutation({
	args: {
		qualificationId: v.id('expertQualifications'),
		certificateUrl: v.optional(v.string()),
		notes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if qualification exists
		const qualification = await ctx.db.get(args.qualificationId);
		if (!qualification) {
			throw new Error('Qualification not found');
		}

		// Update qualification
		const updateData: any = {};
		if (args.certificateUrl !== undefined) {
			updateData.certificateUrl = args.certificateUrl;
		}
		if (args.notes !== undefined) {
			updateData.notes = args.notes;
		}

		await ctx.db.patch(args.qualificationId, updateData);

		return {
			success: true,
			qualificationId: args.qualificationId,
			timestamp: now
		};
	}
});

export const deleteQualification = mutation({
	args: {
		qualificationId: v.id('expertQualifications'),
		deletedBy: v.string()
	},
	handler: async (ctx, args) => {
		// Check if qualification exists
		const qualification = await ctx.db.get(args.qualificationId);
		if (!qualification) {
			throw new Error('Qualification not found');
		}

		// Delete the qualification
		await ctx.db.delete(args.qualificationId);

		return {
			success: true,
			deletedId: args.qualificationId,
			timestamp: Date.now(),
			deletedBy: args.deletedBy
		};
	}
});

// ==========================================
// UTILITY FUNCTIONS FOR TRAINING
// ==========================================

async function createGlobalQualification(
	ctx: any,
	assignment: any,
	trainingPassedAt: number,
	academyTrainingId?: string,
	completedBy?: string
) {
	// Create global qualification record
	const qualificationId = await ctx.db.insert('expertQualifications', {
		userId: assignment.userId,
		serviceVersionId: assignment.serviceVersionId,
		trainingPassedAt,
		trainingCompletedBy: completedBy,
		originalAssignmentId: assignment._id,
		originalOrganizationId: assignment.organizationId,
		academyTrainingId,
		createdAt: trainingPassedAt
	});

	// Update assignment to reference the qualification
	await ctx.db.patch(assignment._id, {
		qualificationId: qualificationId.toString()
	});

	return qualificationId;
}
