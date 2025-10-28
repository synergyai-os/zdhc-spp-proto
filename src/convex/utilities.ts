import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ==========================================
// Utility Functions
// ==========================================
// Common functions that were previously in expertAssignments.ts
// These are general utility functions for the platform

export const getUsers = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('users').collect();
	}
});

export const getUserById = query({
	args: { id: v.id('users') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	}
});

export const getOrganizations = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('organizations').collect();
	}
});

export const getServiceVersions = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('serviceVersions').collect();
	}
});

export const getOrganizationApprovals = query({
	args: { organizationId: v.id('organizations') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('organizationServiceApprovals')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.collect();
	}
});

export const createUser = mutation({
	args: {
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		country: v.string(),
		phone: v.optional(v.string()),
		isActive: v.boolean()
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		return await ctx.db.insert('users', {
			...args,
			createdAt: now,
			updatedAt: now
		});
	}
});

export const toggleUserActiveStatus = mutation({
	args: {
		userId: v.id('users')
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const newStatus = !user.isActive;
		
		await ctx.db.patch(args.userId, {
			isActive: newStatus,
			updatedAt: Date.now()
		});
		
		return { success: true, newStatus };
	}
});

export const createOrganization = mutation({
	args: {
		name: v.string(),
		type: v.union(v.literal('solution_provider'), v.literal('zdhc_staff')),
		contactEmail: v.string(),
		status: v.union(v.literal('active'), v.literal('inactive'), v.literal('suspended'))
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		return await ctx.db.insert('organizations', {
			...args,
			createdAt: now,
			updatedAt: now
		});
	}
});

// ==========================================
// Seed Data Functions
// ==========================================
// These functions help with creating test data

export const seedInitialData = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// Create organizations
		const org1 = await ctx.db.insert('organizations', {
			name: 'Test Solution Provider',
			type: 'solution_provider',
			contactEmail: 'contact@testsp.com',
			status: 'active',
			createdAt: now,
			updatedAt: now
		});

		const org2 = await ctx.db.insert('organizations', {
			name: 'ZDHC Foundation',
			type: 'zdhc_staff',
			contactEmail: 'admin@zdhc.org',
			status: 'active',
			createdAt: now,
			updatedAt: now
		});

		// Create service parents
		const serviceParent1 = await ctx.db.insert('serviceParents', {
			name: 'Assessment Approval',
			description: 'Services related to assessment approvals',
			isActive: true,
			createdAt: now,
			updatedAt: now
		});

		// Create service versions
		const serviceVersion1 = await ctx.db.insert('serviceVersions', {
			parentId: serviceParent1,
			version: 'V2',
			name: 'Supplier to Zero Assessment V2',
			description: 'Latest version of supplier assessment',
			isActive: true,
			releasedAt: now,
			createdAt: now,
			updatedAt: now
		});

		const serviceVersion2 = await ctx.db.insert('serviceVersions', {
			parentId: serviceParent1,
			version: 'V1',
			name: 'Supplier to Zero Assessment V1',
			description: 'Previous version of supplier assessment',
			isActive: false,
			releasedAt: now - 86400000, // 1 day ago
			deprecatedAt: now,
			createdAt: now - 86400000,
			updatedAt: now
		});

		// Create organization service approvals
		await ctx.db.insert('organizationServiceApprovals', {
			organizationId: org1,
			serviceVersionId: serviceVersion1,
			status: 'approved',
			approvedAt: now,
			approvedBy: 'zdhc-admin',
			createdAt: now,
			updatedAt: now
		});

		// Create users
		const user1 = await ctx.db.insert('users', {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john.doe@testsp.com',
			country: 'USA',
			phone: '+1-555-0123',
			isActive: true,
			createdAt: now,
			updatedAt: now
		});

		const user2 = await ctx.db.insert('users', {
			firstName: 'Jane',
			lastName: 'Smith',
			email: 'jane.smith@testsp.com',
			country: 'Canada',
			isActive: true,
			createdAt: now,
			updatedAt: now
		});

		// Create staff members
		await ctx.db.insert('staffMembers', {
			userId: user1,
			organizationId: org1,
			role: 'admin',
			permissions: ['manage_experts', 'view_reports'],
			isActive: true,
			joinedAt: now
		});

		await ctx.db.insert('staffMembers', {
			userId: user2,
			organizationId: org1,
			role: 'manager',
			permissions: ['manage_experts'],
			isActive: true,
			joinedAt: now
		});

		return {
			message: 'Initial data seeded successfully',
			organizations: [org1, org2],
			serviceVersions: [serviceVersion1, serviceVersion2],
			users: [user1, user2]
		};
	}
});

/**
 * Create a draft expert (user + CV + service assignments) in one transaction
 * Used when adding a new expert via the add-expert flow
 */
export const createDraftExpert = mutation({
	args: {
		email: v.string(),
		organizationId: v.id('organizations'),
		serviceAssignments: v.array(
			v.object({
				serviceVersionId: v.id('serviceVersions'),
				role: v.union(v.literal('lead'), v.literal('regular'))
			})
		),
		createdBy: v.string(),
		notes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// 1. Extract firstName from email (everything before @)
		const emailPrefix = args.email.split('@')[0];
		const firstName = emailPrefix || 'Unknown';

		// 2. Create user (isActive=false for draft)
		const userId = await ctx.db.insert('users', {
			firstName,
			lastName: '',
			email: args.email,
			country: '', // Not collected from users
			isActive: false, // Draft mode
			createdAt: now,
			updatedAt: now
		});

		// 3. Create CV with empty experience/education (draft status)
		const cvId = await ctx.db.insert('expertCVs', {
			userId,
			organizationId: args.organizationId,
			version: 1,
			experience: [], // Empty - expert will fill this in later
			education: [], // Empty - expert will fill this in later
			status: 'draft',
			createdAt: now,
			createdBy: args.createdBy,
			notes: args.notes
		});

		// 4. Create service assignments
		for (const assignment of args.serviceAssignments) {
			await ctx.db.insert('expertServiceAssignments', {
				userId,
				organizationId: args.organizationId,
				expertCVId: cvId,
				serviceVersionId: assignment.serviceVersionId,
				role: assignment.role,
				status: 'pending_review',
				createdAt: now,
				assignedBy: args.createdBy
			});
		}

		return {
			success: true,
			userId,
			cvId
		};
	}
});

export const clearAllData = mutation({
	args: {},
	handler: async (ctx) => {
		// Delete all data in reverse dependency order
		await ctx.db.query('userSessions').collect().then(sessions => 
			Promise.all(sessions.map(session => ctx.db.delete(session._id)))
		);
		
		await ctx.db.query('staffMembers').collect().then(members => 
			Promise.all(members.map(member => ctx.db.delete(member._id)))
		);
		
		await ctx.db.query('organizationServiceApprovals').collect().then(approvals => 
			Promise.all(approvals.map(approval => ctx.db.delete(approval._id)))
		);
		
		await ctx.db.query('serviceVersions').collect().then(versions => 
			Promise.all(versions.map(version => ctx.db.delete(version._id)))
		);
		
		await ctx.db.query('serviceParents').collect().then(parents => 
			Promise.all(parents.map(parent => ctx.db.delete(parent._id)))
		);
		
		await ctx.db.query('users').collect().then(users => 
			Promise.all(users.map(user => ctx.db.delete(user._id)))
		);
		
		await ctx.db.query('organizations').collect().then(orgs => 
			Promise.all(orgs.map(org => ctx.db.delete(org._id)))
		);

		return { message: 'All data cleared successfully' };
	}
});
