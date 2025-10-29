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
		description: '',
		fieldExperienceTypes: {
			assessment: false,
			sampling: false,
			training: false
		},
		fieldExperienceCounts: {
			assessment: { total: 0, last12m: 0 },
			sampling: { total: 0, last12m: 0 },
			training: { total: 0, last12m: 0 }
		}
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

