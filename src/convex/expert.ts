import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get the latest CV for a specific expert and organization
 * 
 * What it does:
 * 1. Finds all CVs for this user + organization
 * 2. Orders them by newest first
 * 3. Returns the most recent one (or null if none exist)
 * 
 * Usage: Used by the edit CV page to load current CV data
 */
export const getLatestCV = query({
	args: {
		userId: v.id('users'),
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		// 1. Query the 'expertCVs' table
		const cvs = await ctx.db
			.query('expertCVs')
			// 2. Filter by userId AND organizationId
			.filter((q) =>
				q.and(
					q.eq(q.field('userId'), args.userId),
					q.eq(q.field('organizationId'), args.organizationId)
				)
			)
			// 3. Order by newest first (descending)
			.order('desc')
			// 4. Get all results
			.collect();

		// 5. Return first result or null if no CVs exist
		return cvs.length > 0 ? cvs[0] : null;
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
			role: 'regular', // Default role
			status: 'pending_review', // Default status
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
