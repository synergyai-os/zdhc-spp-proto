import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import type { 
  UpdateExpertCVArgs, 
  CreateExpertCVArgs, 
  SubmitExpertCVArgs, 
  LockExpertCVArgs,
  CVUpdateResult,
  TrainingQualificationEntry
} from './types';
import { validateExperienceData, validateEducationData } from './validators';

// ==========================================
// CORE CV BUSINESS LOGIC
// ==========================================

export async function updateExpertCV(ctx: MutationCtx, args: UpdateExpertCVArgs): Promise<CVUpdateResult> {
  try {
    // Validate CV exists and is in draft status
    const cv = await ctx.db.get(args.id);
    if (!cv) {
      return { success: false, error: 'CV not found' };
    }

    if (cv.status !== 'draft') {
      return { success: false, error: 'Only draft CVs can be updated' };
    }

    // For draft CVs, we don't validate data quality - just save what's provided
    // Validation will happen when the CV is submitted for review

    // Build update data
    const updateData: any = {};

    if (args.experience !== undefined) {
      updateData.experience = args.experience;
    }

    if (args.education !== undefined) {
      updateData.education = args.education;
    }

    if (args.trainingQualifications !== undefined) {
      updateData.trainingQualifications = args.trainingQualifications;
    }

    if (args.notes !== undefined) {
      updateData.notes = args.notes;
    }

    // Perform the update
    await ctx.db.patch(args.id, updateData);

    return { success: true, cvId: args.id };
  } catch (error) {
    console.error('Error updating expert CV:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

export async function createExpertCV(ctx: MutationCtx, args: CreateExpertCVArgs): Promise<CVUpdateResult> {
  try {
    const now = Date.now();

    // Get the next version number
    const existingCVs = await ctx.db
      .query('expertCVs')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('organizationId'), args.organizationId)
        )
      )
      .collect();

    const nextVersion = existingCVs.length + 1;

    // Auto-copy from latest CV if exists and is locked
    let experience = args.experience;
    let education = args.education;
    let trainingQualifications = args.trainingQualifications || [];

    if (existingCVs.length > 0) {
      const latestCV = existingCVs.sort((a, b) => b.version - a.version)[0];
      // Copy from locked CVs (locked_final, locked_for_review, etc.)
      if (latestCV.status.startsWith('locked')) {
        experience = latestCV.experience;
        education = latestCV.education;
        trainingQualifications = latestCV.trainingQualifications || [];
      }
    }

    // Validate experience data (after potential auto-copy)
    const experienceValidation = validateExperienceData(experience);
    if (!experienceValidation.isValid) {
      return { 
        success: false, 
        error: `Experience validation failed: ${experienceValidation.errors.join(', ')}` 
      };
    }

    // Validate education data (after potential auto-copy)
    const educationValidation = validateEducationData(education);
    if (!educationValidation.isValid) {
      return { 
        success: false, 
        error: `Education validation failed: ${educationValidation.errors.join(', ')}` 
      };
    }

    // Create the CV
    const cvId = await ctx.db.insert('expertCVs', {
      userId: args.userId,
      organizationId: args.organizationId,
      version: nextVersion,
      experience,
      education,
      trainingQualifications,
      status: 'draft',
      createdAt: now,
      createdBy: args.createdBy,
      notes: args.notes
    });

    return { success: true, cvId };
  } catch (error) {
    console.error('Error creating expert CV:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

export async function submitExpertCV(ctx: MutationCtx, args: SubmitExpertCVArgs): Promise<CVUpdateResult> {
  try {
    const now = Date.now();

    // Check if CV exists and is in draft status
    const cv = await ctx.db.get(args.id);
    if (!cv) {
      return { success: false, error: 'CV not found' };
    }

    if (cv.status !== 'draft') {
      return { success: false, error: 'Only draft CVs can be submitted' };
    }

    // Validate experience data before submission
    const experienceValidation = validateExperienceData(cv.experience);
    if (!experienceValidation.isValid) {
      return { 
        success: false, 
        error: `Cannot submit CV: Experience validation failed - ${experienceValidation.errors.join(', ')}` 
      };
    }

    // Validate education data before submission
    const educationValidation = validateEducationData(cv.education);
    if (!educationValidation.isValid) {
      return { 
        success: false, 
        error: `Cannot submit CV: Education validation failed - ${educationValidation.errors.join(', ')}` 
      };
    }

    // Submit the CV
    await ctx.db.patch(args.id, {
      status: 'submitted',
      submittedAt: now,
      paidAt: now
    });

    return { success: true, cvId: args.id };
  } catch (error) {
    console.error('Error submitting expert CV:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

export async function lockExpertCV(ctx: MutationCtx, args: LockExpertCVArgs): Promise<CVUpdateResult> {
  try {
    const now = Date.now();

    // Check if CV exists and is in submitted status
    const cv = await ctx.db.get(args.id);
    if (!cv) {
      return { success: false, error: 'CV not found' };
    }

    if (cv.status !== 'submitted') {
      return { success: false, error: 'Only submitted CVs can be locked' };
    }

    // Check if all service assignments are decided
    const assignments = await ctx.db
      .query('expertServiceAssignments')
      .filter((q) => q.eq(q.field('expertCVId'), args.id))
      .collect();

    const undecidedAssignments = assignments.filter(
      (a) => a.status === 'pending_review'
    );

    if (undecidedAssignments.length > 0) {
      return { 
        success: false, 
        error: `Cannot lock CV: ${undecidedAssignments.length} service assignments are still pending review` 
      };
    }

    // Lock the CV
    await ctx.db.patch(args.id, {
      status: 'locked',
      lockedAt: now
    });

    return { success: true, cvId: args.id };
  } catch (error) {
    console.error('Error locking expert CV:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

// ==========================================
// QUERY HELPERS
// ==========================================

export async function getExpertCVById(ctx: QueryCtx, cvId: Id<'expertCVs'>) {
  const cv = await ctx.db.get(cvId);
  if (!cv) return null;

  // Get related data
  const user = await ctx.db.get(cv.userId);
  const organization = await ctx.db.get(cv.organizationId);

  // Get all service assignments for this CV
  const assignments = await ctx.db
    .query('expertServiceAssignments')
    .filter((q) => q.eq(q.field('expertCVId'), cv._id))
    .collect();

  // Enrich assignments with service details
  const enrichedAssignments = await Promise.all(
    assignments.map(async (assignment) => {
      const serviceVersion = await ctx.db.get(assignment.serviceVersionId);
      const serviceParent = serviceVersion ? await ctx.db.get(serviceVersion.parentId) : null;

      return {
        ...assignment,
        serviceVersion,
        serviceParent
      };
    })
  );

  return {
    ...cv,
    user,
    organization,
    assignments: enrichedAssignments
  };
}

export async function getLatestExpertCV(ctx: QueryCtx, userId: Id<'users'>, organizationId: Id<'organizations'>) {
  const cvs = await ctx.db
    .query('expertCVs')
    .filter((q) =>
      q.and(
        q.eq(q.field('userId'), userId),
        q.eq(q.field('organizationId'), organizationId)
      )
    )
    .order('desc')
    .collect();

  return cvs.length > 0 ? cvs[0] : null;
}
