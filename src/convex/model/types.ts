import type { Id } from '../_generated/dataModel';

// Core CV data structures
export interface FieldExperienceTypes {
  assessment: boolean;
  sampling: boolean;
  training: boolean;
}

export interface FieldExperienceCounts {
  assessment: { total: number; last12m: number };
  sampling: { total: number; last12m: number };
  training: { total: number; last12m: number };
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  fieldExperienceTypes?: FieldExperienceTypes;
  fieldExperienceCounts?: FieldExperienceCounts;
}

export interface EducationEntry {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface TrainingQualificationEntry {
  qualificationName: string;
  trainingOrganisation: string;
  trainingContent: string;
  dateIssued: string;
  expireDate: string;
  description: string;
}

export interface OtherApprovalEntry {
  organisationName: string;
  role: string;
  dateIssued: string;
}

// CV update arguments
export interface UpdateExpertCVArgs {
  id: Id<'expertCVs'>;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  trainingQualifications?: TrainingQualificationEntry[];
  notes?: string;
}

// CV creation arguments
export interface CreateExpertCVArgs {
  userId: Id<'users'>;
  organizationId: Id<'organizations'>;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  trainingQualifications?: TrainingQualificationEntry[];
  createdBy: string;
  notes?: string;
}

// CV submission arguments
export interface SubmitExpertCVArgs {
  id: Id<'expertCVs'>;
}

// CV locking arguments
export interface LockExpertCVArgs {
  id: Id<'expertCVs'>;
  lockedBy: string;
}

// Result types
export interface CVUpdateResult {
  success: boolean;
  cvId?: Id<'expertCVs'>;
  error?: string;
}

export interface CVValidationResult {
  isValid: boolean;
  errors: string[];
}
