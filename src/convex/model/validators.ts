import type { ExperienceEntry, EducationEntry, CVValidationResult } from './types';

// Experience validation
export function validateExperienceEntry(experience: ExperienceEntry): CVValidationResult {
  const errors: string[] = [];

  if (!experience.title?.trim()) {
    errors.push('Job title is required');
  }

  if (!experience.company?.trim()) {
    errors.push('Company name is required');
  }

  if (!experience.startDate?.trim()) {
    errors.push('Start date is required');
  }

  if (!experience.current && !experience.endDate?.trim()) {
    errors.push('End date is required for non-current positions');
  }

  // Validate date format (basic check)
  if (experience.startDate && !isValidDate(experience.startDate)) {
    errors.push('Invalid start date format');
  }

  if (experience.endDate && !isValidDate(experience.endDate)) {
    errors.push('Invalid end date format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Education validation
export function validateEducationEntry(education: EducationEntry): CVValidationResult {
  const errors: string[] = [];

  if (!education.school?.trim()) {
    errors.push('School name is required');
  }

  if (!education.degree?.trim()) {
    errors.push('Degree is required');
  }

  if (!education.field?.trim()) {
    errors.push('Field of study is required');
  }

  if (!education.startDate?.trim()) {
    errors.push('Start date is required');
  }

  if (!education.endDate?.trim()) {
    errors.push('End date is required');
  }

  // Validate date format (basic check)
  if (education.startDate && !isValidDate(education.startDate)) {
    errors.push('Invalid start date format');
  }

  if (education.endDate && !isValidDate(education.endDate)) {
    errors.push('Invalid end date format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate experience array
export function validateExperienceData(experience: ExperienceEntry[]): CVValidationResult {
  const allErrors: string[] = [];

  experience.forEach((entry, index) => {
    const result = validateExperienceEntry(entry);
    if (!result.isValid) {
      allErrors.push(`Experience ${index + 1}: ${result.errors.join(', ')}`);
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

// Validate education array
export function validateEducationData(education: EducationEntry[]): CVValidationResult {
  const allErrors: string[] = [];

  education.forEach((entry, index) => {
    const result = validateEducationEntry(entry);
    if (!result.isValid) {
      allErrors.push(`Education ${index + 1}: ${result.errors.join(', ')}`);
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

// Helper function to validate date format
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
