import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import * as ExpertCVs from './model/expertCVs';

// ==========================================
// EXPERT CV QUERIES
// ==========================================

export const getExpertCVs = query({
	args: {
		userId: v.optional(v.id('users')),
		organizationId: v.optional(v.id('organizations')),
		status: v.optional(
			v.union(v.literal('draft'), v.literal('submitted'), v.literal('locked'))
		)
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query('expertCVs');

		if (args.userId) {
			query = query.filter((q) => q.eq(q.field('userId'), args.userId));
		}

		if (args.organizationId) {
			query = query.filter((q) => q.eq(q.field('organizationId'), args.organizationId));
		}

		if (args.status) {
			query = query.filter((q) => q.eq(q.field('status'), args.status));
		}

		const cvs = await query.order('desc').collect();

		// Enrich with user details
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
					pendingCount: assignments.filter((a) => a.status === 'pending_review').length
				};
			})
		);

		return enrichedCVs;
	}
});

export const getExpertCVById = query({
	args: { id: v.id('expertCVs') },
	handler: async (ctx, args) => {
		// Use model layer for business logic
		return await ExpertCVs.getExpertCVById(ctx, args.id);
	}
});



export const getExpertCVHistory = query({
	args: {
		userId: v.id('users'),
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		const cvs = await ctx.db
			.query('expertCVs')
			.filter((q) =>
				q.and(
					q.eq(q.field('userId'), args.userId),
					q.eq(q.field('organizationId'), args.organizationId)
				)
			)
			.order('desc')
			.collect();

		// Enrich with assignment counts
		const enrichedCVs = await Promise.all(
			cvs.map(async (cv) => {
				const assignments = await ctx.db
					.query('expertServiceAssignments')
					.filter((q) => q.eq(q.field('expertCVId'), cv._id))
					.collect();

				return {
					...cv,
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

// ==========================================
// EXPERT CV MUTATIONS
// ==========================================

export const createExpertCV = mutation({
	args: {
		userId: v.id('users'),
		organizationId: v.id('organizations'),
		experience: v.array(
			v.object({
				title: v.string(),
				company: v.string(),
				location: v.string(),
				startDate: v.string(),
				endDate: v.string(),
				current: v.boolean(),
				onSiteAuditsCompleted: v.number(),
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
		trainingQualifications: v.optional(v.array(
			v.object({
				qualificationName: v.string(),
				trainingOrganisation: v.string(),
				trainingContent: v.string(),
				dateIssued: v.string(),
				expireDate: v.string(),
				description: v.string()
			})
		)),
		createdBy: v.string(),
		notes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		// Use model layer for business logic
		const result = await ExpertCVs.createExpertCV(ctx, args);
		
		// If the model layer returns an error, throw it
		if (!result.success) {
			throw new Error(result.error || 'Failed to create CV');
		}
		
		return result.cvId;
	}
});

export const updateExpertCV = mutation({
	args: {
		id: v.id('expertCVs'),
		experience: v.optional(
			v.array(
				v.object({
					title: v.string(),
					company: v.string(),
					location: v.string(),
					startDate: v.string(),
					endDate: v.string(),
					current: v.boolean(),
					onSiteAuditsCompleted: v.number(),
					description: v.string()
				})
			)
		),
		education: v.optional(
			v.array(
				v.object({
					school: v.string(),
					degree: v.string(),
					field: v.string(),
					startDate: v.string(),
					endDate: v.string(),
					description: v.string()
				})
			)
		),
		trainingQualifications: v.optional(v.array(
			v.object({
				qualificationName: v.string(),
				trainingOrganisation: v.string(),
				trainingContent: v.string(),
				dateIssued: v.string(),
				expireDate: v.string(),
				description: v.string()
			})
		)),
		notes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		// Use model layer for business logic
		const result = await ExpertCVs.updateExpertCV(ctx, args);
		
		// If the model layer returns an error, throw it
		if (!result.success) {
			throw new Error(result.error || 'Failed to update CV');
		}
		
		return result.cvId;
	}
});

export const submitExpertCV = mutation({
	args: {
		id: v.id('expertCVs')
	},
	handler: async (ctx, args) => {
		// Use model layer for business logic
		const result = await ExpertCVs.submitExpertCV(ctx, args);
		
		// If the model layer returns an error, throw it
		if (!result.success) {
			throw new Error(result.error || 'Failed to submit CV');
		}
		
		return result.cvId;
	}
});

export const lockExpertCV = mutation({
	args: {
		id: v.id('expertCVs'),
		lockedBy: v.string()
	},
	handler: async (ctx, args) => {
		// Use model layer for business logic
		const result = await ExpertCVs.lockExpertCV(ctx, args);
		
		// If the model layer returns an error, throw it
		if (!result.success) {
			throw new Error(result.error || 'Failed to lock CV');
		}
		
		return result.cvId;
	}
});
