<script lang="ts">
	import UserCard from './UserCard.svelte';

	interface Expert {
		name: string;
		role: string;
		initials: string;
		isLead?: boolean;
		additionalServices?: string[];
	}

	interface Service {
		name: string;
		icon: string;
		iconColor: string;
		experts: Expert[];
	}

	interface Props {
		service: Service;
	}

	let { service }: Props = $props();

	// Icon color classes
	const iconClasses: Record<string, string> = {
		green: 'bg-green-100 text-green-600',
		purple: 'bg-purple-100 text-purple-600',
		orange: 'bg-orange-100 text-orange-600',
		blue: 'bg-blue-100 text-blue-600'
	};
</script>

<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
	<div class="flex items-center space-x-3 mb-4">
		<div
			class="w-8 h-8 {iconClasses[service.iconColor]} rounded-lg flex items-center justify-center"
		>
			{@html service.icon}
		</div>
		<h3 class="text-lg font-bold text-gray-800">{service.name}</h3>
		<span
			class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
		>
			{service.experts.length} Expert{service.experts.length !== 1 ? 's' : ''}
		</span>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
		{#each service.experts as expert (expert.name)}
			<UserCard user={expert} size="sm" />
		{/each}
	</div>
</div>
