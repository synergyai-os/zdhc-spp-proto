import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { isQualified } from './model/status';
import type { Id } from './_generated/dataModel';
import { calculateServicePricingTotal } from './pricing';

/**
 * Get pending invoices (needs invoice to be sent)
 * Returns organizations with approved services that have qualified lead experts
 * but invoice hasn't been sent yet (no paymentReference)
 */
export const getPendingInvoices = query({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		
		// Get all approved service approvals
		const approvals = await ctx.db
			.query('organizationServiceApprovals')
			.filter((q) => q.eq(q.field('status'), 'approved'))
			.collect();

		const pendingInvoices = [];

		for (const approval of approvals) {
			// Must not have paid yet
			if (approval.paidAt) continue;
			
			// Must not have paymentReference (invoice not sent yet)
			if (approval.paymentReference) continue;

			// Check if organization has qualified lead expert
			const leadExperts = await ctx.db
				.query('expertServiceAssignments')
				.filter((q) => q.eq(q.field('organizationId'), approval.organizationId))
				.filter((q) => q.eq(q.field('serviceVersionId'), approval.serviceVersionId))
				.filter((q) => q.eq(q.field('role'), 'lead'))
				.collect();

			const hasQualifiedLead = leadExperts.some(
				(assignment) => assignment.trainingStatus && isQualified(assignment.trainingStatus)
			);

			if (!hasQualifiedLead) continue;

			// Get qualified lead expert details
			const qualifiedLead = leadExperts.find(
				(assignment) => assignment.trainingStatus && isQualified(assignment.trainingStatus)
			);

			// Enrich with organization, service, and user details
			const organization = await ctx.db.get(approval.organizationId);
			const serviceVersion = await ctx.db.get(approval.serviceVersionId);
			const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;
			const qualifiedLeadUser = qualifiedLead
				? await ctx.db.get(qualifiedLead.userId)
				: null;
			
			// Only proceed if we have all required data
			if (!organization || !serviceVersion) continue;

			// Get when expert first became qualified (from qualifiedAt timestamp)
			const qualifiedAt = qualifiedLead?.qualifiedAt;

			pendingInvoices.push({
				approval,
				organization,
				serviceVersion,
				serviceParent,
				qualifiedLeadExpert: qualifiedLead && qualifiedLeadUser
					? {
							userId: qualifiedLead.userId,
							userName: `${qualifiedLeadUser.firstName} ${qualifiedLeadUser.lastName}`,
							userEmail: qualifiedLeadUser.email,
							qualifiedAt: qualifiedAt || undefined
						}
					: null
			});
		}

		return pendingInvoices;
	}
});

/**
 * Get pending annual fee payments (invoice sent, waiting for payment confirmation)
 * Returns organizations with approved services that have qualified lead experts,
 * invoice has been sent (has paymentReference), but payment hasn't been confirmed yet
 */
export const getPendingAnnualFees = query({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		
		// Get all approved service approvals
		const approvals = await ctx.db
			.query('organizationServiceApprovals')
			.filter((q) => q.eq(q.field('status'), 'approved'))
			.collect();

		const pendingFees = [];

		for (const approval of approvals) {
			// Check if payment is needed (never paid or expired)
			const needsPayment = !approval.paidAt || (approval.expiresAt && approval.expiresAt < now);

			if (!needsPayment) continue;

			// Invoice must have been sent (has paymentReference)
			if (!approval.paymentReference) continue;

			// Check if organization has qualified lead expert
			const leadExperts = await ctx.db
				.query('expertServiceAssignments')
				.filter((q) => q.eq(q.field('organizationId'), approval.organizationId))
				.filter((q) => q.eq(q.field('serviceVersionId'), approval.serviceVersionId))
				.filter((q) => q.eq(q.field('role'), 'lead'))
				.collect();

			const hasQualifiedLead = leadExperts.some(
				(assignment) => assignment.trainingStatus && isQualified(assignment.trainingStatus)
			);

			if (!hasQualifiedLead) continue;

			// Get qualified lead expert details
			const qualifiedLead = leadExperts.find(
				(assignment) => assignment.trainingStatus && isQualified(assignment.trainingStatus)
			);

			// Enrich with organization, service, and user details
			const organization = await ctx.db.get(approval.organizationId);
			const serviceVersion = await ctx.db.get(approval.serviceVersionId);
			const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;
			const qualifiedLeadUser = qualifiedLead
				? await ctx.db.get(qualifiedLead.userId)
				: null;
			
			// Only proceed if we have all required data
			if (!organization || !serviceVersion) continue;

			pendingFees.push({
				approval,
				organization,
				serviceVersion,
				serviceParent,
				qualifiedLeadExpert: qualifiedLead && qualifiedLeadUser
					? {
							userId: qualifiedLead.userId,
							userName: `${qualifiedLeadUser.firstName} ${qualifiedLeadUser.lastName}`,
							userEmail: qualifiedLeadUser.email
						}
					: null,
				isExpired: approval.expiresAt ? approval.expiresAt < now : false
			});
		}

		return pendingFees;
	}
});

/**
 * Get pending CV review payments
 * Returns CVs with status 'payment_pending' that need finance team confirmation
 */
export const getPendingCVPayments = query({
	args: {},
	handler: async (ctx) => {
		// Get all CVs with payment_pending status
		const pendingCVs = await ctx.db
			.query('expertCVs')
			.filter((q) => q.eq(q.field('status'), 'payment_pending'))
			.collect();

		const enrichedCVs = await Promise.all(
			pendingCVs.map(async (cv) => {
				// Get user and organization details
				const user = await ctx.db.get(cv.userId);
				const organization = await ctx.db.get(cv.organizationId);

				// Get service assignments for this CV to calculate payment amount
				const assignments = await ctx.db
					.query('expertServiceAssignments')
					.filter((q) => q.eq(q.field('expertCVId'), cv._id))
					.collect();

				// Calculate payment amount using pricing logic
				const paymentAmount = calculateServicePricingTotal(assignments.length);

				// Get service details for display
				const serviceDetails = await Promise.all(
					assignments.map(async (assignment) => {
						const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
						const serviceParent = serviceVersion
							? await ctx.db.get(serviceVersion.parentId)
							: null;
						return {
							serviceVersion,
							serviceParent,
							assignment
						};
					})
				);

				return {
					cv,
					user,
					organization,
					assignments,
					serviceDetails,
					paymentAmount,
					servicesCount: assignments.length,
					submittedAt: cv.submittedAt
				};
			})
		);

		return enrichedCVs;
	}
});

/**
 * Get upcoming renewals (services expiring within 90 days)
 * Grouped by urgency: 0-7 days (urgent), 8-30 days (warning), 31-90 days (upcoming)
 */
export const getUpcomingRenewals = query({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const oneDay = 24 * 60 * 60 * 1000;
		const sevenDays = 7 * oneDay;
		const thirtyDays = 30 * oneDay;
		const ninetyDays = 90 * oneDay;

		// Get all approved service approvals that have been paid
		const approvals = await ctx.db
			.query('organizationServiceApprovals')
			.filter((q) => q.eq(q.field('status'), 'approved'))
			.collect();

		const renewals = [];

		for (const approval of approvals) {
			// Must have paid and have expiry date
			if (!approval.paidAt || !approval.expiresAt) continue;

			// Must be expiring within 90 days
			const daysUntilExpiry = Math.ceil((approval.expiresAt - now) / oneDay);
			if (daysUntilExpiry < 0 || daysUntilExpiry > 90) continue;

			// Determine urgency level
			let urgency: 'urgent' | 'warning' | 'upcoming';
			if (daysUntilExpiry <= 7) {
				urgency = 'urgent';
			} else if (daysUntilExpiry <= 30) {
				urgency = 'warning';
			} else {
				urgency = 'upcoming';
			}

			// Get organization and service details
			const organization = await ctx.db.get(approval.organizationId);
			const serviceVersion = await ctx.db.get(approval.serviceVersionId);
			const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

			// Get qualified lead expert
			const leadExperts = await ctx.db
				.query('expertServiceAssignments')
				.filter((q) => q.eq(q.field('organizationId'), approval.organizationId))
				.filter((q) => q.eq(q.field('serviceVersionId'), approval.serviceVersionId))
				.filter((q) => q.eq(q.field('role'), 'lead'))
				.collect();

			const qualifiedLead = leadExperts.find(
				(assignment) => assignment.trainingStatus && isQualified(assignment.trainingStatus)
			);

			const qualifiedLeadUser = qualifiedLead ? await ctx.db.get(qualifiedLead.userId) : null;
			
			// Only proceed if we have all required data
			if (!organization || !serviceVersion) continue;

			renewals.push({
				approval,
				organization,
				serviceVersion,
				serviceParent,
				daysUntilExpiry,
				urgency,
				paidAt: approval.paidAt,
				expiresAt: approval.expiresAt,
				paymentReference: approval.paymentReference,
				qualifiedLeadExpert: qualifiedLead && qualifiedLeadUser
					? {
							userId: qualifiedLead.userId,
							userName: `${qualifiedLeadUser.firstName} ${qualifiedLeadUser.lastName}`,
							userEmail: qualifiedLeadUser.email
						}
					: null
			});
		}

		// Sort by days until expiry (most urgent first)
		renewals.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

		return renewals;
	}
});

/**
 * Get payment history (all annual fees and CV payments)
 * Supports optional filters for date range, organization, and payment type
 */
export const getPaymentHistory = query({
	args: {
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		organizationId: v.optional(v.id('organizations')),
		paymentType: v.optional(v.union(v.literal('annual_fee'), v.literal('cv_review')))
	},
	handler: async (ctx, args) => {
		const history: any[] = [];

		// Get annual fee payments
		if (!args.paymentType || args.paymentType === 'annual_fee') {
			let annualFeeApprovals = await ctx.db
				.query('organizationServiceApprovals')
				.filter((q) => q.neq(q.field('paidAt'), undefined))
				.collect();

			// Apply filters
			if (args.organizationId) {
				annualFeeApprovals = annualFeeApprovals.filter(
					(a) => a.organizationId === args.organizationId
				);
			}

			if (args.startDate || args.endDate) {
				annualFeeApprovals = annualFeeApprovals.filter((a) => {
					if (!a.paidAt) return false;
					if (args.startDate && a.paidAt < args.startDate) return false;
					if (args.endDate && a.paidAt > args.endDate) return false;
					return true;
				});
			}

			// Enrich annual fee payments
			for (const approval of annualFeeApprovals) {
				const organization = await ctx.db.get(approval.organizationId);
				const serviceVersion = await ctx.db.get(approval.serviceVersionId);
				const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;
				const now = Date.now();
				const isExpired = approval.expiresAt ? approval.expiresAt < now : false;

				history.push({
					type: 'annual_fee' as const,
					paidAt: approval.paidAt!,
					organization,
					serviceVersion,
					serviceParent,
					paymentAmount: approval.paymentAmount || 2500, // Default to €2,500
					paymentReference: approval.paymentReference,
					status: isExpired ? 'expired' : 'active',
					expiresAt: approval.expiresAt
				});
			}
		}

		// Get CV review payments
		if (!args.paymentType || args.paymentType === 'cv_review') {
			let paidCVs = await ctx.db
				.query('expertCVs')
				.filter((q) => q.eq(q.field('status'), 'paid'))
				.collect();

			// Also get CVs with paidAt timestamp (for backward compatibility)
			const cvsWithPaidAt = await ctx.db
				.query('expertCVs')
				.collect();

			const additionalCVs = cvsWithPaidAt.filter(
				(cv) => cv.paidAt && cv.status !== 'paid'
			);

			paidCVs = [...paidCVs, ...additionalCVs];

			// Apply filters
			if (args.organizationId) {
				paidCVs = paidCVs.filter((cv) => cv.organizationId === args.organizationId);
			}

			if (args.startDate || args.endDate) {
				paidCVs = paidCVs.filter((cv) => {
					const paidAt = cv.paidAt || cv.submittedAt;
					if (!paidAt) return false;
					if (args.startDate && paidAt < args.startDate) return false;
					if (args.endDate && paidAt > args.endDate) return false;
					return true;
				});
			}

			// Enrich CV payments
			for (const cv of paidCVs) {
				const user = await ctx.db.get(cv.userId);
				const organization = await ctx.db.get(cv.organizationId);

				// Get service assignments to calculate payment amount
				const assignments = await ctx.db
					.query('expertServiceAssignments')
					.filter((q) => q.eq(q.field('expertCVId'), cv._id))
					.collect();

				const paymentAmount = calculateServicePricingTotal(assignments.length);
				const paidAt = cv.paidAt || cv.submittedAt || cv.createdAt;

				history.push({
					type: 'cv_review' as const,
					paidAt: paidAt!,
					user,
					organization,
					cv,
					paymentAmount,
					servicesCount: assignments.length,
					paymentReference: `CV-${cv._id}` // Fallback reference if no bank reference
				});
			}
		}

		// Sort by paidAt descending (newest first)
		history.sort((a, b) => b.paidAt - a.paidAt);

		return history;
	}
});

/**
 * Set payment reference for sending invoice (does not process payment)
 * Used when finance team wants to generate an invoice reference for manual sending
 * 
 * TODO: FUTURE IMPLEMENTATION - Email trigger to finance team
 * When a qualified lead expert passes training and becomes eligible for first annual payment,
 * an automated email should be sent to the finance team to notify them that an invoice needs
 * to be generated and sent. This should trigger:
 * 1. Email to finance team with organization details, service, qualified expert info
 * 2. Include links to admin invoice page for quick action
 * 3. Optional: Generate invoice PDF automatically
 */
export const setInvoicePaymentReference = mutation({
	args: {
		approvalId: v.id('organizationServiceApprovals'),
		paymentReference: v.string()
	},
	handler: async (ctx, args) => {
		const approval = await ctx.db.get(args.approvalId);
		if (!approval) {
			throw new Error('Organization service approval not found.');
		}

		const now = Date.now();

		// Update only the payment reference, not the payment status
		await ctx.db.patch(args.approvalId, {
			paymentReference: args.paymentReference,
			updatedAt: now
		});

		console.log(`✅ Invoice payment reference set: ${args.paymentReference} for approval ${args.approvalId}`);

		return { success: true };
	}
});

