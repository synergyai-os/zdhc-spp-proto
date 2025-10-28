/**
 * Helper functions for managing CV data operations
 * Provides reusable handlers for experience, education, and training management
 */

import type { ExperienceEntry, EducationEntry, TrainingQualificationEntry } from '../../convex/model/types';

export function createExperienceEntry(): ExperienceEntry {
	return {
		title: '',
		company: '',
		location: '',
		startDate: '',
		endDate: '',
		current: false,
		onSiteAuditsCompleted: 0,
		description: ''
	};
}

export function createEducationEntry(): EducationEntry {
	return {
		school: '',
		degree: '',
		field: '',
		startDate: '',
		endDate: '',
		description: ''
	};
}

export function createTrainingEntry(): TrainingQualificationEntry {
	return {
		qualificationName: '',
		trainingOrganisation: '',
		trainingContent: '',
		dateIssued: '',
		expireDate: '',
		description: ''
	};
}

