<script lang="ts">
  type TrainingStatus =
    | 'proposed'
    | 'training_required'
    | 'training_in_progress'
    | 'training_failed'
    | 'training_passed'
    | 'certification_issued'
    | 'active_for_delivery'
    | 'suspended'
    | 'revoked';

  interface Props {
    status?: TrainingStatus;
    title?: string;
  }
  let { status = 'training_required', title = 'Service Readiness' }: Props = $props();

  const steps: { key: TrainingStatus; label: string; help: string }[] = [
    { key: 'training_required', label: 'Training Required', help: 'Start the mandatory training' },
    { key: 'training_in_progress', label: 'In Progress', help: 'Complete all modules' },
    { key: 'training_passed', label: 'Passed', help: 'You passed the exam' },
    { key: 'certification_issued', label: 'Certified', help: 'Certificate available' },
    { key: 'active_for_delivery', label: 'Active', help: 'Eligible to deliver service' }
  ];

  const idxOf = (s: TrainingStatus) => steps.findIndex((st) => st.key === s);
  const currentIndex: number = $derived(Math.max(0, idxOf(status)));
  const totalSteps: number = steps.length - 1;
  const percent: number = $derived(Math.max(0, Math.min(100, (currentIndex / totalSteps) * 100)));

  function isCompleted(i: number): boolean {
    if (i < currentIndex) return true;
    // Terminal active state renders last as completed
    if (status === 'active_for_delivery' && i === currentIndex) return true;
    if (status === 'certification_issued' && i === currentIndex) return true;
    if (status === 'training_passed' && i === currentIndex) return true;
    return false;
  }

  function isActive(i: number): boolean {
    if ((status === 'active_for_delivery' || status === 'certification_issued' || status === 'training_passed') && i === currentIndex) return false;
    return i === currentIndex;
  }

  function circleClasses(i: number): string {
    const base = 'z-10 flex items-center justify-center rounded-full border-2 transition-all duration-200';
    const sizeActive = ' w-8 h-8';
    const sizeDefault = ' w-7 h-7';
    if (isActive(i)) return base + sizeActive + ' bg-white border-blue-600 ring-4 ring-blue-100 text-blue-600';
    if (isCompleted(i)) return base + sizeDefault + ' bg-blue-600 border-blue-600 text-white';
    return base + sizeDefault + ' bg-white border-gray-300 text-gray-400';
  }
</script>

<div class="w-full">
  <h3 class="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
  <div class="relative flex items-center">
    <div class="absolute left-0 right-0 h-[3px] bg-gray-200 top-1/2 -translate-y-1/2"></div>
    <div class="absolute left-0 h-[6px] bg-blue-500/80 top-1/2 -translate-y-1/2 rounded transition-[width] duration-200" style={`width: ${percent}%`}></div>
    <div class="w-full grid" style={`grid-template-columns: repeat(${steps.length}, minmax(0, 1fr)); gap: 0;`}>
      {#each steps as s, i}
        <div class="flex flex-col items-center">
          <div class={circleClasses(i)}>
            {#if isCompleted(i)}
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            {:else if isActive(i)}
              <span class="w-3.5 h-3.5 rounded-full bg-blue-600"></span>
            {/if}
          </div>
          <div class="mt-2 text-center">
            <div class="text-sm font-semibold {isActive(i) ? 'text-gray-900' : isCompleted(i) ? 'text-gray-700' : 'text-gray-500'}">{s.label}</div>
            <div class="text-xs text-gray-500 mt-1">{s.help}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  /* Tailwind driven */
</style>


