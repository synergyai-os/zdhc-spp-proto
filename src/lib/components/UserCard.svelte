<script lang="ts">
	interface User {
		name: string;
		role: string;
		initials: string;
		status?: 'active' | 'inactive';
		badge?: string;
		badgeColor?: 'blue' | 'yellow' | 'green';
		isLead?: boolean;
		additionalServices?: string[];
	}
	
	interface Props {
		user: User;
		size?: 'sm' | 'md' | 'lg';
		showBadge?: boolean;
	}
	
	let { user, size = 'md', showBadge = true }: Props = $props();
	
	// Size classes
	const sizeClasses = {
		sm: 'w-6 h-6 text-xs',
		md: 'w-8 h-8 text-sm', 
		lg: 'w-10 h-10 text-base'
	};
	
	const containerClasses = {
		sm: 'p-2',
		md: 'p-3',
		lg: 'p-4'
	};
	
	// Status color classes
	const statusClasses = {
		active: 'bg-green-100 text-green-800',
		inactive: 'bg-red-100 text-red-800'
	};
	
	// Badge color classes
	const badgeClasses = {
		blue: 'bg-blue-100 text-blue-800',
		yellow: 'bg-yellow-200 text-yellow-800',
		green: 'bg-green-100 text-green-800'
	};
	
	// Background color for lead experts
	const leadBackground = user.isLead ? 'bg-yellow-50' : '';
</script>

<div class="border border-gray-200 rounded-lg {containerClasses[size]} {leadBackground} hover:shadow-md transition-shadow">
	<div class="flex items-center {size === 'sm' ? 'space-x-2' : 'space-x-3'}">
		<div class="{sizeClasses[size]} {user.isLead ? 'bg-yellow-100' : 'bg-gray-100'} rounded-full flex items-center justify-center">
			<span class="{user.isLead ? 'text-yellow-700' : 'text-gray-600'} font-semibold">
				{user.isLead ? 'L' : user.initials}
			</span>
		</div>
		<div class="flex-1">
			<h4 class="font-semibold text-gray-800 {size === 'sm' ? 'text-sm' : 'text-base'}">
				{user.name}
			</h4>
			<p class="text-xs text-gray-600">{user.role}</p>
			
			<!-- Additional services badge -->
			{#if user.additionalServices && user.additionalServices.length > 0}
				<span class="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
					Also in {user.additionalServices.join(', ')}
				</span>
			{/if}
		</div>
		
		{#if showBadge}
			<div class="flex flex-col items-end space-y-1">
				{#if user.isLead}
					<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800">
						LEAD
					</span>
				{/if}
				
				{#if user.status && user.status !== 'active'}
					<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {statusClasses[user.status]}">
						{user.status}
					</span>
				{/if}
				
				{#if user.badge && user.badgeColor}
					<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {badgeClasses[user.badgeColor]}">
						{user.badge}
					</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
