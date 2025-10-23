import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ==========================================
// EXPERT SERVICE ASSIGNMENT QUERIES
// ==========================================

export const getExpertServiceAssignments = query({
	args: {
		userId: v.optional(v.id('users')),
		organizationId: v.optional(v.id('organizations')),
		expertCVId: v.optional(v.id('expertCVs')),
		serviceVersionId: v.optional(v.id('serviceVersions')),
		status: v.optional(
			v.union(
				v.literal('pending_review'),
				v.literal('approved'),
				v.literal('rejected'),
				v.literal('inactive')
			)
		)
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query('expertServiceAssignments');

		if (args.userId) {
			query = query.filter((q) => q.eq(q.field('userId'), args.userId));
		}

		if (args.organizationId) {
			query = query.filter((q) => q.eq(q.field('organizationId'), args.organizationId));
		}

		if (args.expertCVId) {
			query = query.filter((q) => q.eq(q.field('expertCVId'), args.expertCVId));
		}

		if (args.serviceVersionId) {
			query = query.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId));
		}

		if (args.status) {
			query = query.filter((q) => q.eq(q.field('status'), args.status));
		}

		const assignments = await query.order('desc').collect();

		// Enrich with related data
		const enrichedAssignments = await Promise.all(
			assignments.map(async (assignment) => {
				const user = await ctx.db.get(assignment.userId);
				const organization = await ctx.db.get(assignment.organizationId);
				const expertCV = await ctx.db.get(assignment.expertCVId);
				const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
				const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

				return {
					...assignment,
					user,
					organization,
					expertCV,
					serviceVersion,
					serviceParent
				};
			})
		);

		return enrichedAssignments;
	}
});

export const getExpertServiceAssignmentsByOrg = query({
	args: { organizationId: v.id('organizations') },
	handler: async (ctx, args) => {
		const assignments = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.collect();

		// Enrich with related data
		const enrichedAssignments = await Promise.all(
			assignments.map(async (assignment) => {
				const user = await ctx.db.get(assignment.userId);
				const expertCV = await ctx.db.get(assignment.expertCVId);
				const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
				const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

				return {
					...assignment,
					user,
					expertCV,
					serviceVersion,
					serviceParent
				};
			})
		);

		return enrichedAssignments;
	}
});

export const getAssignmentsByServiceVersion = query({
	args: { serviceVersionId: v.id('serviceVersions') },
	handler: async (ctx, args) => {
		const assignments = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId))
			.collect();

		// Enrich with related data
		const enrichedAssignments = await Promise.all(
			assignments.map(async (assignment) => {
				const user = await ctx.db.get(assignment.userId);
				const organization = await ctx.db.get(assignment.organizationId);
				const expertCV = await ctx.db.get(assignment.expertCVId);
				const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
				const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

				return {
					...assignment,
					user,
					organization,
					expertCV,
					serviceVersion,
					serviceParent
				};
			})
		);

		return enrichedAssignments;
	}
});

// ==========================================
// EXPERT SERVICE ASSIGNMENT MUTATIONS
// ==========================================

export const createExpertServiceAssignment = mutation({
	args: {
		userId: v.id('users'),
		organizationId: v.id('organizations'),
		expertCVId: v.id('expertCVs'),
		serviceVersionId: v.id('serviceVersions'),
		role: v.union(v.literal('lead'), v.literal('regular')),
		assignedBy: v.string()
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check if assignment already exists for this CV + service combination
		const existingAssignment = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) =>
				q.and(
					q.eq(q.field('expertCVId'), args.expertCVId),
					q.eq(q.field('serviceVersionId'), args.serviceVersionId)
				)
			)
			.first();

		if (existingAssignment) {
			throw new Error(
				'Assignment already exists for this CV and service combination'
			);
		}

		// Verify the CV belongs to the user and organization
		const cv = await ctx.db.get(args.expertCVId);
		if (!cv) {
			throw new Error('CV not found');
		}

		if (cv.userId !== args.userId || cv.organizationId !== args.organizationId) {
			throw new Error('CV does not belong to the specified user and organization');
		}

		// Only allow assignments for draft CVs
		if (cv.status !== 'draft') {
			throw new Error('Can only create assignments for draft CVs');
		}

		return await ctx.db.insert('expertServiceAssignments', {
			userId: args.userId,
			organizationId: args.organizationId,
			expertCVId: args.expertCVId,
			serviceVersionId: args.serviceVersionId,
			role: args.role,
			status: 'pending_review',
			createdAt: now,
			assignedBy: args.assignedBy
		});
	}
});


// ==========================================
// BULK OPERATIONS
// ==========================================

export const createMultipleServiceAssignments = mutation({
	args: {
		userId: v.id('users'),
		organizationId: v.id('organizations'),
		expertCVId: v.id('expertCVs'),
		serviceAssignments: v.array(
			v.object({
				serviceVersionId: v.id('serviceVersions'),
				role: v.union(v.literal('lead'), v.literal('regular'))
			})
		),
		assignedBy: v.string()
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const assignmentIds = [];

		// Verify the CV belongs to the user and organization
		const cv = await ctx.db.get(args.expertCVId);
		if (!cv) {
			throw new Error('CV not found');
		}

		if (cv.userId !== args.userId || cv.organizationId !== args.organizationId) {
			throw new Error('CV does not belong to the specified user and organization');
		}

		// Only allow assignments for draft CVs
		if (cv.status !== 'draft') {
			throw new Error('Can only create assignments for draft CVs');
		}

		for (const serviceAssignment of args.serviceAssignments) {
			// Check if assignment already exists
			const existingAssignment = await ctx.db
				.query('expertServiceAssignments')
				.filter((q) =>
					q.and(
						q.eq(q.field('expertCVId'), args.expertCVId),
						q.eq(q.field('serviceVersionId'), serviceAssignment.serviceVersionId)
					)
				)
				.first();

			if (!existingAssignment) {
				const assignmentId = await ctx.db.insert('expertServiceAssignments', {
					userId: args.userId,
					organizationId: args.organizationId,
					expertCVId: args.expertCVId,
					serviceVersionId: serviceAssignment.serviceVersionId,
					role: serviceAssignment.role,
					status: 'pending_review',
					createdAt: now,
					assignedBy: args.assignedBy
				});
				assignmentIds.push(assignmentId);
			}
		}

		return {
			success: true,
			createdCount: assignmentIds.length,
			assignmentIds,
			message: `Created ${assignmentIds.length} service assignments`
		};
	}
});

export const updateMultipleAssignmentStatuses = mutation({
	args: {
		assignmentIds: v.array(v.id('expertServiceAssignments')),
		status: v.union(
			v.literal('pending_review'),
			v.literal('approved'),
			v.literal('rejected'),
			v.literal('inactive')
		),
		updatedBy: v.string(),
		notes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const updateData: any = {
			status: args.status,
			reviewedAt: now,
			reviewedBy: args.updatedBy
		};

		// Set appropriate timestamp based on status
		switch (args.status) {
			case 'approved':
				updateData.approvedAt = now;
				updateData.approvedBy = args.updatedBy;
				break;
			case 'rejected':
				updateData.rejectedAt = now;
				updateData.rejectedBy = args.updatedBy;
				break;
		}

		if (args.notes) {
			updateData.reviewNotes = args.notes;
		}

		// Update all assignments
		const results = await Promise.all(
			args.assignmentIds.map((id) => ctx.db.patch(id, updateData))
		);

		return {
			success: true,
			updatedCount: results.length,
			status: args.status,
			timestamp: now
		};
	}
});

export const deleteAssignment = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments')
	},
	handler: async (ctx, args) => {
		// Check if assignment exists
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		// Only allow deletion of draft CVs or inactive assignments
		const cv = await ctx.db.get(assignment.expertCVId);
		if (cv && cv.status !== 'draft') {
			throw new Error('Can only delete assignments for draft CVs');
		}

		// Delete the assignment
		await ctx.db.delete(args.assignmentId);

		return {
			success: true,
			deletedId: args.assignmentId,
			timestamp: Date.now()
		};
	}
});
