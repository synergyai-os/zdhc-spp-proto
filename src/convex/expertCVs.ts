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

// ==========================================
// SEED DATA FUNCTIONS
// ==========================================

export const seedExpertCVsTestData = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// Get existing users and organizations
		const users = await ctx.db.query('users').collect();
		const organizations = await ctx.db
			.query('organizations')
			.filter((q) => q.eq(q.field('type'), 'solution_provider'))
			.collect();
		const serviceVersions = await ctx.db
			.query('serviceVersions')
			.filter((q) => q.eq(q.field('isActive'), true))
			.collect();

		if (users.length === 0 || organizations.length === 0 || serviceVersions.length === 0) {
			throw new Error(
				'Need users, organizations, and service versions. Run seedInitialData and seedServiceData first.'
			);
		}

		const results = [];

		// Create test CVs for each user-organization combination
		for (const user of users.slice(0, 3)) {
			for (const org of organizations.slice(0, 2)) {
				// Create CV v1 (locked - with approved services)
				const cv1 = await ctx.db.insert('expertCVs', {
					userId: user._id,
					organizationId: org._id,
					version: 1,
					experience: [
						{
							title: 'Senior Environmental Consultant',
							company: 'GreenTech Solutions',
							location: 'Amsterdam, Netherlands',
							startDate: '2020-01-01',
							endDate: '2024-01-01',
							current: false,
							description: 'Led environmental assessments and compliance projects.'
						}
					],
					education: [
						{
							school: 'University of Amsterdam',
							degree: 'MSc Environmental Science',
							field: 'Environmental Science',
							startDate: '2018-09-01',
							endDate: '2020-06-01',
							description: 'Specialized in sustainable development and environmental policy.'
						}
					],
					status: 'locked',
					createdAt: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
					createdBy: 'system-seed',
					submittedAt: now - 25 * 24 * 60 * 60 * 1000,
					paidAt: now - 25 * 24 * 60 * 60 * 1000,
					lockedAt: now - 20 * 24 * 60 * 60 * 1000,
					notes: 'First CV version - approved for ETP Assessment'
				});

				// Create service assignments for CV v1 (approved)
				for (const service of serviceVersions.slice(0, 2)) {
					await ctx.db.insert('expertServiceAssignments', {
						userId: user._id,
						organizationId: org._id,
						expertCVId: cv1,
						serviceVersionId: service._id,
						role: 'regular',
						status: 'approved',
						reviewedAt: now - 20 * 24 * 60 * 60 * 1000,
						reviewedBy: 'zdhc-admin',
						approvedAt: now - 20 * 24 * 60 * 60 * 1000,
						approvedBy: 'zdhc-admin',
						createdAt: now - 25 * 24 * 60 * 60 * 1000,
						assignedBy: 'spp-manager'
					});
				}

				// Create CV v2 (submitted - under review)
				const cv2 = await ctx.db.insert('expertCVs', {
					userId: user._id,
					organizationId: org._id,
					version: 2,
					experience: [
						{
							title: 'Senior Environmental Consultant',
							company: 'GreenTech Solutions',
							location: 'Amsterdam, Netherlands',
							startDate: '2020-01-01',
							endDate: '2024-01-01',
							current: false,
							description: 'Led environmental assessments and compliance projects.'
						},
						{
							title: 'Lead Sustainability Manager',
							company: 'EcoCorp International',
							location: 'Rotterdam, Netherlands',
							startDate: '2024-01-01',
							endDate: '',
							current: true,
							description: 'Leading sustainability initiatives and chemical management programs.'
						}
					],
					education: [
						{
							school: 'University of Amsterdam',
							degree: 'MSc Environmental Science',
							field: 'Environmental Science',
							startDate: '2018-09-01',
							endDate: '2020-06-01',
							description: 'Specialized in sustainable development and environmental policy.'
						},
						{
							school: 'TU Delft',
							degree: 'Professional Certificate',
							field: 'Chemical Management',
							startDate: '2023-09-01',
							endDate: '2023-12-01',
							description: 'Advanced certification in chemical management and ZDHC standards.'
						}
					],
					status: 'submitted',
					createdAt: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
					createdBy: 'spp-manager',
					submittedAt: now - 5 * 24 * 60 * 60 * 1000,
					paidAt: now - 5 * 24 * 60 * 60 * 1000,
					notes: 'Second CV version - adding Chemical Management service'
				});

				// Create service assignments for CV v2 (pending review)
				await ctx.db.insert('expertServiceAssignments', {
					userId: user._id,
					organizationId: org._id,
					expertCVId: cv2,
					serviceVersionId: serviceVersions[2]?._id || serviceVersions[0]._id,
					role: 'lead',
					status: 'pending_review',
					createdAt: now - 5 * 24 * 60 * 60 * 1000,
					assignedBy: 'spp-manager'
				});

				// Create CV v3 (draft - being prepared)
				const cv3 = await ctx.db.insert('expertCVs', {
					userId: user._id,
					organizationId: org._id,
					version: 3,
					experience: [
						{
							title: 'Lead Sustainability Manager',
							company: 'EcoCorp International',
							location: 'Rotterdam, Netherlands',
							startDate: '2024-01-01',
							endDate: '',
							current: true,
							description: 'Leading sustainability initiatives and chemical management programs.'
						}
					],
					education: [
						{
							school: 'TU Delft',
							degree: 'Professional Certificate',
							field: 'Chemical Management',
							startDate: '2023-09-01',
							endDate: '2023-12-01',
							description: 'Advanced certification in chemical management and ZDHC standards.'
						}
					],
					status: 'draft',
					createdAt: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
					createdBy: 'spp-manager',
					notes: 'Third CV version - preparing for Supplier Assessment services'
				});

				results.push({
					user: user.email,
					organization: org.name,
					cv1: { id: cv1, status: 'locked', assignments: 2 },
					cv2: { id: cv2, status: 'submitted', assignments: 1 },
					cv3: { id: cv3, status: 'draft', assignments: 0 }
				});
			}
		}

		return {
			message: `Created ${results.length * 3} test CVs with various statuses`,
			results,
			summary: {
				lockedCVs: results.length, // Each user-org has 1 locked CV
				submittedCVs: results.length, // Each user-org has 1 submitted CV
				draftCVs: results.length, // Each user-org has 1 draft CV
				totalAssignments: results.length * 3 // 2 approved + 1 pending per user-org
			}
		};
	}
});
