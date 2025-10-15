<script lang="ts">
	export let id: string;
	export let checked: boolean = false;
	export let onToggle: () => void = () => {};
	export let disabled: boolean = false;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	
	// Size classes
	const sizeClasses = {
		sm: 'w-8 h-4',
		md: 'w-11 h-6', 
		lg: 'w-14 h-7'
	};
	
	const thumbSizeClasses = {
		sm: 'w-3 h-3',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};
	
	const translateClasses = {
		sm: checked ? 'translate-x-4' : 'translate-x-0',
		md: checked ? 'translate-x-5' : 'translate-x-0',
		lg: checked ? 'translate-x-7' : 'translate-x-0'
	};
</script>

<button
	{id}
	type="button"
	onclick={onToggle}
	disabled={disabled}
	class="relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {sizeClasses[size]} {checked ? 'bg-blue-600' : 'bg-gray-200'} {disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}"
	role="switch"
	aria-checked={checked}
>
	<span
		class="pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 {thumbSizeClasses[size]} {translateClasses[size]}"
	></span>
</button>
