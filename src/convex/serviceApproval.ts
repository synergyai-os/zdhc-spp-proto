import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { ServiceApprovalStatus } from './model/status';
import { isQualified } from './model/status';
import type { Id } from './_generated/dataModel';

// ==========================================
// QUERIES
// ==========================================

/**
 * Get ServiceApprovalTracker status for an organization's service
 * Simple business logic: Approved → Assign Lead → Pay Fee → Active
 */
export const getServiceApprovalStatus = query({
	args: {
		organizationId: v.id('organizations'),
		serviceVersionId: v.id('serviceVersions')
	},
	handler: async (ctx, args) => {
		// Get the organization's approval for this service
		const approval = await ctx.db
			.query('organizationServiceApprovals')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId))
			.filter((q) => q.eq(q.field('status'), 'approved'))
			.first();

		if (!approval) {
			return { 
				status: 'not_approved' as const, 
				canShowTracker: false,
				hasQualifiedLead: false,
				isPaid: false,
				isExpired: false
			};
		}

		// Check if organization has qualified lead experts for this service
		const leadExperts = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId))
			.filter((q) => q.eq(q.field('role'), 'lead'))
			.collect();

		// Filter to only qualified leads using the isQualified function
		const qualifiedLeads = leadExperts.filter(assignment => 
			assignment.trainingStatus && isQualified(assignment.trainingStatus)
		);

		const hasQualifiedLead = qualifiedLeads.length > 0;
		const isPaid = approval.paidAt !== undefined;
		const isExpired = approval.expiresAt ? Date.now() > approval.expiresAt : false;

		// Determine ServiceApprovalTracker status
		let status: ServiceApprovalStatus;
		if (!hasQualifiedLead) {
			status = 'assign_lead'; // Need qualified lead first
		} else if (hasQualifiedLead && !isPaid) {
			status = 'pay_annual_fee'; // Has lead, needs payment
		} else if (hasQualifiedLead && isPaid && !isExpired) {
			status = 'active'; // Everything ready
		} else if (isExpired) {
			status = 'pay_annual_fee'; // Expired, needs renewal
		} else {
			status = 'approved'; // Fallback
		}

		// Log expiration warnings
		if (approval.expiresAt) {
			const now = Date.now();
			const timeUntilExpiry = approval.expiresAt - now;
			const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months in ms
			const oneMonth = 30 * 24 * 60 * 60 * 1000; // 1 month in ms
			const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in ms

			if (timeUntilExpiry <= oneWeek && timeUntilExpiry > 0) {
				console.log(`🚨 URGENT: Service ${args.serviceVersionId} for org ${args.organizationId} expires in ${Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000))} days`);
			} else if (timeUntilExpiry <= oneMonth && timeUntilExpiry > 0) {
				console.log(`⚠️ WARNING: Service ${args.serviceVersionId} for org ${args.organizationId} expires in ${Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000))} days`);
			} else if (timeUntilExpiry <= threeMonths && timeUntilExpiry > 0) {
				console.log(`📅 NOTICE: Service ${args.serviceVersionId} for org ${args.organizationId} expires in ${Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000))} days`);
			}
		}

		return {
			status,
			canShowTracker: true,
			hasQualifiedLead,
			isPaid,
			isExpired,
			approval,
			qualifiedLeads
		};
	}
});

/**
 * Get all qualified lead experts for an organization's service
 */
export const getQualifiedLeadExperts = query({
	args: {
		organizationId: v.id('organizations'),
		serviceVersionId: v.id('serviceVersions')
	},
	handler: async (ctx, args) => {
		const leadExperts = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId))
			.filter((q) => q.eq(q.field('role'), 'lead'))
			.collect();

		// Filter to only qualified leads using the isQualified function
		return leadExperts.filter(assignment => 
			assignment.trainingStatus && isQualified(assignment.trainingStatus)
		);
	}
});

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Process annual fee payment for an organization's service
 * Sets paidAt and calculates expiresAt (1 year from payment)
 */
export const payAnnualFee = mutation({
	args: {
		organizationId: v.id('organizations'),
		serviceVersionId: v.id('serviceVersions'),
		paymentReference: v.string(),
		paymentAmount: v.number(),
		triggeredBy: v.string()
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000); // 1 year in ms

		// Get the approval
		const approval = await ctx.db
			.query('organizationServiceApprovals')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId))
			.filter((q) => q.eq(q.field('status'), 'approved'))
			.first();

		if (!approval) {
			throw new Error('Organization service approval not found.');
		}

		// Check if there's at least one qualified lead expert
		const leadExperts = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId))
			.filter((q) => q.eq(q.field('role'), 'lead'))
			.collect();

		const hasQualifiedLead = leadExperts.some(assignment => 
			assignment.trainingStatus && isQualified(assignment.trainingStatus)
		);

		if (!hasQualifiedLead) {
			throw new Error('Cannot pay annual fee: No qualified lead expert assigned.');
		}

		// Update the approval with payment info
		await ctx.db.patch(approval._id, {
			paymentReference: args.paymentReference,
			paymentAmount: args.paymentAmount,
			paidAt: now,
			expiresAt: oneYearFromNow,
			updatedAt: now
		});

		console.log(`✅ Payment processed: ${args.paymentReference} for service ${args.serviceVersionId}, expires ${new Date(oneYearFromNow).toISOString()}`);

		return { success: true, expiresAt: oneYearFromNow };
	}
});

/**
 * Assign a qualified lead expert to an organization's service
 * This enables the organization to proceed to payment
 */
export const assignQualifiedLead = mutation({
	args: {
		organizationId: v.id('organizations'),
		serviceVersionId: v.id('serviceVersions'),
		expertServiceAssignmentId: v.id('expertServiceAssignments'),
		triggeredBy: v.string()
	},
	handler: async (ctx, args) => {
		// Verify the expert assignment exists and is qualified
		const expertAssignment = await ctx.db.get(args.expertServiceAssignmentId);
		if (!expertAssignment) {
			throw new Error('Expert service assignment not found.');
		}
		if (expertAssignment.organizationId !== args.organizationId) {
			throw new Error('Expert assignment does not belong to this organization.');
		}
		if (expertAssignment.serviceVersionId !== args.serviceVersionId) {
			throw new Error('Expert assignment is not for this service.');
		}
		if (expertAssignment.role !== 'lead') {
			throw new Error('Expert is not assigned as a lead.');
		}
		if (expertAssignment.trainingStatus !== 'passed') {
			throw new Error('Expert has not passed training for this service.');
		}

		console.log(`✅ Qualified lead expert assigned: ${args.expertServiceAssignmentId} for service ${args.serviceVersionId}`);

		return { success: true };
	}
});

/**
 * Remove a lead expert from an organization's service
 * This may deactivate the service if no other qualified leads remain
 */
export const removeLeadExpert = mutation({
	args: {
		organizationId: v.id('organizations'),
		serviceVersionId: v.id('serviceVersions'),
		expertServiceAssignmentId: v.id('expertServiceAssignments'),
		removalReason: v.string(),
		triggeredBy: v.string()
	},
	handler: async (ctx, args) => {
		// Get the expert assignment
		const expertAssignment = await ctx.db.get(args.expertServiceAssignmentId);
		if (!expertAssignment) {
			throw new Error('Expert service assignment not found.');
		}

		// Update the assignment to remove lead role
		await ctx.db.patch(args.expertServiceAssignmentId, {
			role: 'regular' // Change from lead to regular
		});

		// Check if there are any remaining qualified leads
		const remainingQualifiedLeads = await ctx.db
			.query('expertServiceAssignments')
			.filter((q) => q.eq(q.field('organizationId'), args.organizationId))
			.filter((q) => q.eq(q.field('serviceVersionId'), args.serviceVersionId))
			.filter((q) => q.eq(q.field('role'), 'lead'))
			.filter((q) => q.eq(q.field('trainingStatus'), 'passed'))
			.collect();

		if (remainingQualifiedLeads.length === 0) {
			console.log(`⚠️ No qualified leads remaining for service ${args.serviceVersionId}. Service may become inactive.`);
		}

		console.log(`✅ Lead expert removed: ${args.expertServiceAssignmentId}, reason: ${args.removalReason}`);

		return { success: true, remainingQualifiedLeads: remainingQualifiedLeads.length };
	}
});
