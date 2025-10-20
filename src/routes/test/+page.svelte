<script lang="ts">
  import CVStatusTracker from '$lib/components/CVStatusTracker.svelte';
  import ServiceTrainingTracker from '$lib/components/ServiceTrainingTracker.svelte';
  type CVStatus =
    | 'draft'
    | 'completed'
    | 'payment_pending'
    | 'paid'
    | 'locked_for_review'
    | 'unlocked_for_edits'
    | 'locked_final';
  let status: CVStatus = $state('draft' as CVStatus);
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
  let trainingStatus: TrainingStatus = $state('training_required');
  const trainingStatuses: TrainingStatus[] = [
    'training_required',
    'training_in_progress',
    'training_passed',
    'certification_issued',
    'active_for_delivery'
  ];
  const statuses: CVStatus[] = [
    'draft',
    'completed',
    'payment_pending',
    'paid',
    'locked_for_review',
    'unlocked_for_edits',
    'locked_final'
  ];
  function next() {
    const i = statuses.indexOf(status);
    status = statuses[Math.min(i + 1, statuses.length - 1)];
  }
  function prev() {
    const i = statuses.indexOf(status);
    status = statuses[Math.max(i - 1, 0)];
  }
</script>

<div class="max-w-5xl mx-auto p-8 space-y-6">
  <h1 class="text-2xl font-bold">CV Status Tracker Demo</h1>

  <div class="bg-white border rounded-lg p-6 shadow-sm space-y-4">
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600" for="status-select">CV status</label>
      <select id="status-select" class="border rounded px-3 py-2" bind:value={status}>
        {#each statuses as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
      <button class="px-3 py-2 bg-gray-100 rounded border" onclick={prev}>Prev</button>
      <button class="px-3 py-2 bg-gray-100 rounded border" onclick={next}>Next</button>
    </div>
    <CVStatusTracker {status} title="CV Approval Progress" />
  </div>

  <div class="mt-10 space-y-4 bg-white border rounded-lg p-6 shadow-sm">
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600" for="training-select">Service training status</label>
      <select id="training-select" class="border rounded px-3 py-2" bind:value={trainingStatus}>
        {#each trainingStatuses as ts}
          <option value={ts}>{ts}</option>
        {/each}
      </select>
      <button class="px-3 py-2 bg-gray-100 rounded border" onclick={() => {
        const i = trainingStatuses.indexOf(trainingStatus);
        trainingStatus = trainingStatuses[Math.max(i - 1, 0)];
      }}>Prev</button>
      <button class="px-3 py-2 bg-gray-100 rounded border" onclick={() => {
        const i = trainingStatuses.indexOf(trainingStatus);
        trainingStatus = trainingStatuses[Math.min(i + 1, trainingStatuses.length - 1)];
      }}>Next</button>
    </div>
    <ServiceTrainingTracker status={trainingStatus} title="Service Readiness" />
  </div>
</div>

