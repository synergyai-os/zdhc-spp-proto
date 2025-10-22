import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get approved services for a specific organization
 * 
 * This function returns all service versions that are:
 * 1. Active (isActive: true)
 * 2. Approved for the given organization
 * 
 * @param organizationId - The organization ID to get approved services for
 * @returns Array of approved service versions with enriched data
 */
export const getApprovedServices = query({
	args: {
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		// 1. Get all active service versions
		const serviceVersions = await ctx.db
			.query('serviceVersions')
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();

		// 2. Get organization approvals for this org
		const organizationApprovals = await ctx.db
			.query('organizationServiceApprovals')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.filter((q) => q.eq(q.field('status'), 'approved'))
			.collect();

		// 3. Create a set of approved service version IDs for quick lookup
		const approvedServiceVersionIds = new Set(
			organizationApprovals.map(approval => approval.serviceVersionId)
		);

		// 4. Filter service versions to only include approved ones
		const approvedServices = serviceVersions.filter(serviceVersion =>
			approvedServiceVersionIds.has(serviceVersion._id)
		);

		// 5. Enrich with service parent information
		const enrichedServices = await Promise.all(
			approvedServices.map(async (serviceVersion) => {
				const serviceParent = await ctx.db.get(serviceVersion.parentId);
				return {
					...serviceVersion,
					serviceParent
				};
			})
		);

		return enrichedServices;
	}
});

/**
 * Get all service assignments for a specific organization
 * 
 * This function returns all expert service assignments for an organization,
 * enriched with user, service, and service parent information.
 * 
 * @param organizationId - The organization ID to get assignments for
 * @returns Array of service assignments with enriched data
 */
export const getServiceAssignmentsByOrg = query({
	args: {
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		// 1. Get all service assignments for this organization
		const assignments = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.collect();

		// 2. Enrich assignments with related data
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
