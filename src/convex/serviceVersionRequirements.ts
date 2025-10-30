import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ==========================================
// REQUIREMENT QUERIES
// ==========================================

/**
 * Get all active (non-retired) requirements for a service version
 * Sorted by order field, then by creation date
 */
export const getRequirementsForServiceVersion = query({
	args: {
		serviceVersionId: v.id('serviceVersions')
	},
	handler: async (ctx, args) => {
		const allRequirements = await ctx.db
			.query('serviceVersionRequirements')
			.withIndex('by_service_version', (q) =>
				q.eq('serviceVersionId', args.serviceVersionId)
			)
			.collect();

		// Filter to only active requirements (not retired)
		const activeRequirements = allRequirements.filter(
			(req) => !req.retiredAt
		);

		// Sort by order field (if present), then by creation date
		return activeRequirements.sort((a, b) => {
			if (a.order !== undefined && b.order !== undefined) {
				return a.order - b.order;
			}
			if (a.order !== undefined) return -1;
			if (b.order !== undefined) return 1;
			return a.createdAt - b.createdAt;
		});
	}
});

/**
 * Get all requirements for a service version + their check-off status for a specific assignment
 * Returns requirements with isChecked status from the assignment
 */
export const getRequirementsForAssignment = query({
	args: {
		assignmentId: v.id('expertServiceAssignments')
	},
	handler: async (ctx, args) => {
		// Get the assignment
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

    // Get all active requirements for this service version
		const requirements = await ctx.db
			.query('serviceVersionRequirements')
			.withIndex('by_service_version', (q) =>
				q.eq('serviceVersionId', assignment.serviceVersionId)
			)
			.collect();

    // Filter to only active requirements and by role applicability
    const activeRequirements = requirements.filter((req) => {
      if (req.retiredAt) return false;
      const applicability = req.roleApplicability || 'both';
      if (assignment.role === 'lead') {
        return applicability === 'lead' || applicability === 'both';
      }
      // regular
      return applicability === 'regular' || applicability === 'both';
    });

		// Sort by order field
		const sortedRequirements = activeRequirements.sort((a, b) => {
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
			checkoffs.map((co) => [co.requirementId, co])
		);

		// Merge requirements with check-off status
		return sortedRequirements.map((req) => {
			const checkoff = checkoffMap.get(req._id);
			return {
				...req,
				isChecked: checkoff?.isChecked || false,
				checkedAt: checkoff?.checkedAt,
				checkedBy: checkoff?.checkedBy
			};
		});
	}
});

/**
 * Get requirement history - shows replacement chain
 * Useful for traceability: see what requirement replaced what
 */
export const getRequirementHistory = query({
	args: {
		requirementId: v.id('serviceVersionRequirements')
	},
	handler: async (ctx, args) => {
		const requirement = await ctx.db.get(args.requirementId);
		if (!requirement) {
			throw new Error('Requirement not found');
		}

		const history = {
			current: requirement,
			replaced: null as any,
			replacedBy: null as any
		};

		// Get the requirement this one replaced (if any)
		if (requirement.replacesRequirementId) {
			history.replaced = await ctx.db.get(requirement.replacesRequirementId);
		}

		// Get the requirement that replaced this one (if any)
		if (requirement.replacedByRequirementId) {
			history.replacedBy = await ctx.db.get(
				requirement.replacedByRequirementId
			);
		}

		return history;
	}
});

// ==========================================
// REQUIREMENT MUTATIONS
// ==========================================

/**
 * Create a new requirement for a service version
 */
export const createRequirement = mutation({
	args: {
		serviceVersionId: v.id('serviceVersions'),
		title: v.string(),
		description: v.optional(v.string()),
		order: v.optional(v.number()),
		isRequired: v.optional(v.boolean()),
    roleApplicability: v.optional(v.union(v.literal('regular'), v.literal('lead'), v.literal('both'))),
		createdBy: v.string(),
		replacesRequirementId: v.optional(v.id('serviceVersionRequirements')) // If replacing an old requirement
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// If this replaces an existing requirement, ensure it exists and retire it
		let replacedByRequirementId = undefined;
		if (args.replacesRequirementId) {
			const oldRequirement = await ctx.db.get(args.replacesRequirementId);
			if (!oldRequirement) {
				throw new Error('Requirement to replace not found');
			}
			if (oldRequirement.retiredAt) {
				throw new Error('Requirement is already retired');
			}
			// We'll set replacedByRequirementId after creating the new requirement
		}

		// Create the new requirement
		const newRequirementId = await ctx.db.insert('serviceVersionRequirements', {
			serviceVersionId: args.serviceVersionId,
			title: args.title,
			description: args.description,
			order: args.order,
			isRequired: args.isRequired,
      roleApplicability: args.roleApplicability || 'both',
			createdAt: now,
			createdBy: args.createdBy,
			replacesRequirementId: args.replacesRequirementId
		});

		// If replacing an old requirement, update it to point back to the new one
		if (args.replacesRequirementId) {
			await ctx.db.patch(args.replacesRequirementId, {
				retiredAt: now,
				retiredBy: args.createdBy,
				replacedByRequirementId: newRequirementId,
				retirementReason: `Replaced by requirement: ${args.title}`
			});
		}

		return newRequirementId;
	}
});

/**
 * Retire a requirement (without replacing it)
 * Use this when a requirement is no longer needed
 */
export const retireRequirement = mutation({
	args: {
		requirementId: v.id('serviceVersionRequirements'),
		retiredBy: v.string(),
		retirementReason: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const requirement = await ctx.db.get(args.requirementId);
		if (!requirement) {
			throw new Error('Requirement not found');
		}

		if (requirement.retiredAt) {
			throw new Error('Requirement is already retired');
		}

		const now = Date.now();
		await ctx.db.patch(args.requirementId, {
			retiredAt: now,
			retiredBy: args.retiredBy,
			retirementReason: args.retirementReason || 'No longer needed'
		});

		return { success: true };
	}
});

/**
 * Update requirement order within a service version
 * Useful for reordering requirements in the UI
 */
export const updateRequirementOrder = mutation({
	args: {
		requirementOrders: v.array(
			v.object({
				requirementId: v.id('serviceVersionRequirements'),
				order: v.number()
			})
		)
	},
	handler: async (ctx, args) => {
		for (const item of args.requirementOrders) {
			await ctx.db.patch(item.requirementId, {
				order: item.order
			});
		}

		return { success: true };
	}
});

/**
 * Check-off a single requirement for an assignment
 */
export const checkOffRequirement = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		requirementId: v.id('serviceVersionRequirements'),
		isChecked: v.boolean(),
		checkedBy: v.string()
	},
	handler: async (ctx, args) => {
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		// Check if CV is already locked (can't change check-offs after lock)
		const cv = await ctx.db.get(assignment.expertCVId);
		if (!cv || cv.status === 'locked_final') {
			throw new Error(
				'Cannot change requirement check-offs - CV is already locked'
			);
		}

		// Verify requirement exists and is active
		const requirement = await ctx.db.get(args.requirementId);
		if (!requirement) {
			throw new Error('Requirement not found');
		}
		if (requirement.retiredAt) {
			throw new Error('Cannot check-off a retired requirement');
		}

		// Get existing check-offs or initialize empty array
		const existingCheckoffs = assignment.requirementCheckoffs || [];
		const now = Date.now();

		// Find if this requirement is already checked off
		const existingIndex = existingCheckoffs.findIndex(
			(co) => co.requirementId === args.requirementId
		);

		let updatedCheckoffs;
		if (existingIndex >= 0) {
			// Update existing check-off
			updatedCheckoffs = [...existingCheckoffs];
			updatedCheckoffs[existingIndex] = {
				requirementId: args.requirementId,
				isChecked: args.isChecked,
				checkedAt: now,
				checkedBy: args.checkedBy
			};
		} else {
			// Add new check-off
			updatedCheckoffs = [
				...existingCheckoffs,
				{
					requirementId: args.requirementId,
					isChecked: args.isChecked,
					checkedAt: now,
					checkedBy: args.checkedBy
				}
			];
		}

		// Update assignment
		await ctx.db.patch(args.assignmentId, {
			requirementCheckoffs: updatedCheckoffs
		});

		return { success: true };
	}
});

/**
 * Bulk check-off multiple requirements at once
 * Useful when checking all requirements at once
 */
export const bulkCheckOffRequirements = mutation({
	args: {
		assignmentId: v.id('expertServiceAssignments'),
		checkoffs: v.array(
			v.object({
				requirementId: v.id('serviceVersionRequirements'),
				isChecked: v.boolean()
			})
		),
		checkedBy: v.string()
	},
	handler: async (ctx, args) => {
		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error('Assignment not found');
		}

		// Check if CV is already locked (can't change check-offs after lock)
		const cv = await ctx.db.get(assignment.expertCVId);
		if (!cv || cv.status === 'locked_final') {
			throw new Error(
				'Cannot change requirement check-offs - CV is already locked'
			);
		}

		// Get existing check-offs
		const existingCheckoffs = assignment.requirementCheckoffs || [];
		const now = Date.now();

		// Create a map of new check-offs for quick lookup
		const newCheckoffMap = new Map(
			args.checkoffs.map((co) => [co.requirementId, co.isChecked])
		);

		// Build updated check-offs array
		// Keep existing check-offs that aren't being updated
		// Add/update check-offs from the bulk operation
		const updatedCheckoffs: Array<{
			requirementId: any;
			isChecked: boolean;
			checkedAt: number;
			checkedBy: string;
		}> = [];

		// Add existing check-offs that aren't being updated
		for (const existing of existingCheckoffs) {
			if (!newCheckoffMap.has(existing.requirementId)) {
				updatedCheckoffs.push(existing);
			}
		}

		// Add/update check-offs from bulk operation
		for (const [requirementId, isChecked] of newCheckoffMap.entries()) {
			// Verify requirement exists and is active
			const requirement = await ctx.db.get(requirementId);
			if (!requirement) {
				console.warn(`Requirement ${requirementId} not found, skipping`);
				continue;
			}
			if (requirement.retiredAt) {
				console.warn(
					`Requirement ${requirementId} is retired, skipping`
				);
				continue;
			}

			updatedCheckoffs.push({
				requirementId,
				isChecked,
				checkedAt: now,
				checkedBy: args.checkedBy
			});
		}

		// Update assignment
		await ctx.db.patch(args.assignmentId, {
			requirementCheckoffs: updatedCheckoffs
		});

		return { success: true };
	}
});

