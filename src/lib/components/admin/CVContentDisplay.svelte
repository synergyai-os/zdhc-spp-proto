<script lang="ts">
	interface Props {
		experience?: Array<{
			title: string;
			company: string;
			location: string;
			startDate: string;
			endDate: string;
			current: boolean;
			description?: string;
		}>;
		education?: Array<{
			degree: string;
			field: string;
			school: string;
			startDate: string;
			endDate: string;
			description?: string;
		}>;
		trainingQualifications?: Array<{
			qualificationName: string;
			trainingOrganisation: string;
			trainingContent: string;
			dateIssued: string;
			expireDate: string;
			description: string;
		}>;
	}

	let { experience = [], education = [], trainingQualifications = [] }: Props = $props();
</script>

{#if experience && experience.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">Professional Experience</h2>
		<div class="space-y-4">
			{#each experience as exp}
				<div class="border-l-4 border-blue-500 pl-4 py-2">
					<div class="flex justify-between items-start">
						<div>
							<h3 class="font-semibold text-gray-900">{exp.title}</h3>
							<p class="text-gray-600">{exp.company} • {exp.location}</p>
							<p class="text-sm text-gray-500">
								{exp.startDate} - {exp.current ? 'Present' : exp.endDate}
							</p>
						</div>
						{#if exp.current}
							<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
								Current
							</span>
						{/if}
					</div>
					{#if exp.description}
						<p class="text-gray-700 mt-2">{exp.description}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if education && education.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">Education</h2>
		<div class="space-y-4">
			{#each education as edu}
				<div class="border-l-4 border-green-500 pl-4 py-2">
					<h3 class="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
					<p class="text-gray-600">{edu.school}</p>
					<p class="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</p>
					{#if edu.description}
						<p class="text-gray-700 mt-2">{edu.description}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if trainingQualifications && trainingQualifications.length > 0}
	<div class="bg-white border border-gray-200 rounded-lg p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">Training & Qualifications</h2>
		<div class="space-y-4">
			{#each trainingQualifications as qual}
				<div class="border-l-4 border-purple-500 pl-4 py-2">
					<h3 class="font-semibold text-gray-900">{qual.qualificationName}</h3>
					<p class="text-gray-600">{qual.trainingOrganisation}</p>
					<p class="text-sm text-gray-500">Issued: {qual.dateIssued} • Expires: {qual.expireDate}</p>
					{#if qual.trainingContent}
						<p class="text-gray-700 mt-2 font-medium">Content: {qual.trainingContent}</p>
					{/if}
					{#if qual.description}
						<p class="text-gray-700 mt-1">{qual.description}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

