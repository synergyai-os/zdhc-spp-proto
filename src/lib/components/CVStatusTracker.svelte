<script lang="ts">
  type CVStatus =
    | 'draft'
    | 'completed'
    | 'payment_pending'
    | 'paid'
    | 'locked_for_review'
    | 'unlocked_for_edits'
    | 'locked_final';

  interface Props {
    status?: CVStatus;
    title?: string;
  }
  let { status = 'draft', title = 'CV Status' }: Props = $props();

  const steps: { key: CVStatus; label: string; help: string }[] = [
    { key: 'draft', label: 'Draft', help: 'Fill in experience and education' },
    { key: 'completed', label: 'Completed', help: 'Ready to proceed to payment' },
    { key: 'payment_pending', label: 'Payment Pending', help: 'Waiting for payment confirmation' },
    { key: 'paid', label: 'Paid', help: 'Payment confirmed, preparing review' },
    { key: 'locked_for_review', label: 'In Review', help: 'Reviewer is assessing your CV' },
    { key: 'unlocked_for_edits', label: 'Needs edits', help: 'Make changes and resubmit' },
    { key: 'locked_final', label: 'Finalized', help: 'Review complete' }
  ];

  const statusIndex = (s: CVStatus) => steps.findIndex((st) => st.key === s);
  // Reactive values for current index and progress percent
  const currentIndex: number = $derived(statusIndex(status));
  const totalSteps: number = steps.length - 1;
  const percent: number = $derived(Math.max(0, Math.min(100, (currentIndex / totalSteps) * 100)));

  function isCompleted(idx: number): boolean {
    // All prior steps are completed; terminal status marks the last step as completed too
    if (idx < currentIndex) return true;
    if (status === 'locked_final' && idx === currentIndex) return true;
    return false;
  }

  function isActive(idx: number): boolean {
    // The terminal step should appear completed, not active
    if (status === 'locked_final' && idx === currentIndex) return false;
    return idx === currentIndex;
  }

  function circleClasses(idx: number): string {
    const base = 'z-10 flex items-center justify-center rounded-full border-2 transition-all duration-200';
    const sizeActive = ' w-10 h-10';
    const sizeDefault = ' w-8 h-8';
    if (isActive(idx)) {
      // Active step is emphasized but not marked as completed
      return base + sizeActive + ' bg-white border-blue-600 ring-4 ring-blue-100 text-blue-600';
    }
    if (isCompleted(idx)) {
      // Completed steps are fully filled
      return base + sizeDefault + ' bg-blue-600 border-blue-600 text-white';
    }
    return base + sizeDefault + ' bg-white border-gray-300 text-gray-400';
  }
</script>

<div class="w-full">
  <h3 class="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
  <div class="relative flex items-center">
    <!-- Base line across the full tracker -->
    <div class="absolute left-0 right-0 h-[3px] bg-gray-200 top-1/2 -translate-y-1/2"></div>

    <!-- Progress line showing how far along we are -->
    <div
      class="absolute left-0 h-[6px] bg-blue-500/80 top-1/2 -translate-y-1/2 rounded transition-[width] duration-200"
      style={`width: ${percent}%;`}
    ></div>

    <!-- Steps -->
    <div class="w-full grid" style={`grid-template-columns: repeat(${steps.length}, minmax(0, 1fr)); gap: 0;`}>
      {#each steps as s, i}
        <div class="flex flex-col items-center">
          <div class={circleClasses(i)}>
            {#if isCompleted(i)}
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            {:else if isActive(i)}
              <span class="w-3.5 h-3.5 rounded-full bg-white"></span>
            {/if}
          </div>
          <div class="mt-3 text-center">
            <div class="text-sm font-semibold {isActive(i) ? 'text-gray-900' : isCompleted(i) ? 'text-gray-700' : 'text-gray-500'}">
              {s.label}
            </div>
            <div class="text-xs text-gray-500 mt-1">{s.help}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Current status banner -->
  <div class="mt-6">
    <div class="rounded-lg border px-4 py-3 flex items-center gap-3"
      class:border-blue-200={status === 'completed' || status === 'payment_pending'}
      class:border-yellow-200={status === 'payment_pending'}
      class:border-green-200={status === 'paid' || status === 'locked_final'}
      class:border-orange-200={status === 'locked_for_review'}
      class:border-red-200={status === 'unlocked_for_edits'}
    >
      <div class="text-sm text-gray-700">
        <strong>Current status:</strong> {steps[statusIndex(status)]?.label}
      </div>
    </div>
  </div>
</div>

<style>
  /* No additional styles; relies on Tailwind */
  
</style>


