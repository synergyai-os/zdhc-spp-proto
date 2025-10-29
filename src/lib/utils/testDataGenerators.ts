/**
 * Test data generators for development
 * Only used in development mode to quickly populate CV data for testing
 */

import type { ExperienceEntry, EducationEntry, TrainingQualificationEntry } from '../../convex/model/types';

export function generateExperienceTestData(): ExperienceEntry[] {
	return [
		{
			title: 'Senior Chemical Engineer',
			company: 'Bureau Veritas',
			location: 'Shanghai, China',
			startDate: '2019-06-01',
			endDate: '2025-01-15',
			current: true,
			description: 'Conducted chemical management audits and assessments for major manufacturers.',
			fieldExperienceTypes: {
				assessment: true,
				sampling: true,
				training: false
			},
			fieldExperienceCounts: {
				assessment: { total: 125, last12m: 18 },
				sampling: { total: 45, last12m: 8 },
				training: { total: 0, last12m: 0 }
			}
		},
		{
			title: 'Chemical Engineer',
			company: 'SGS',
			location: 'Beijing, China',
			startDate: '2015-08-15',
			endDate: '2019-05-31',
			current: false,
			description: 'Performed chemical testing, certification, and quality assurance services.',
			fieldExperienceTypes: {
				assessment: true,
				sampling: false,
				training: false
			},
			fieldExperienceCounts: {
				assessment: { total: 80, last12m: 12 },
				sampling: { total: 0, last12m: 0 },
				training: { total: 0, last12m: 0 }
			}
		}
	];
}

export function generateEducationTestData(): EducationEntry[] {
	return [
		{
			school: 'Tsinghua University',
			degree: 'Master of Engineering',
			field: 'Chemical Engineering',
			startDate: '2013-09-01',
			endDate: '2015-06-30',
			description: 'Specialized in Environmental Chemistry and Process Engineering.'
		},
		{
			school: 'Beijing University of Chemical Technology',
			degree: 'Bachelor of Science',
			field: 'Chemical Engineering',
			startDate: '2009-09-01',
			endDate: '2013-06-30',
			description: 'Core courses in organic chemistry, process design, and environmental protection.'
		}
	];
}

export function generateTrainingTestData(): TrainingQualificationEntry[] {
	return [
		{
			qualificationName: 'ISO 14001:2015 & ISO 45001:2018 Internal Auditor Training Course',
			trainingOrganisation: 'Bureau Veritas',
			trainingContent: 'Internal Auditor Training Course',
			dateIssued: '2019-02-01',
			expireDate: '2027-02-01',
			description: 'Comprehensive training in environmental and occupational health & safety management systems.'
		},
		{
			qualificationName: 'ZDHC MRSL Conformance Testing Certification',
			trainingOrganisation: 'ZDHC Academy',
			trainingContent: 'MRSL Conformance Testing and Chemical Management',
			dateIssued: '2021-05-15',
			expireDate: '2026-05-15',
			description: 'Certified in Manufacturing Restricted Substances List testing and compliance.'
		}
	];
}

