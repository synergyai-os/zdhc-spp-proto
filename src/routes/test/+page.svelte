<script lang="ts">
  import CVStatusTracker from '$lib/components/CVStatusTracker.svelte';
  import ServiceTrainingTracker from '$lib/components/ServiceTrainingTracker.svelte';
  import ServiceApprovalTracker from '$lib/components/ServiceApprovalTracker.svelte';
  
  type CVStatus = 'paid' | 'in_review' | 'approved' | 'denied' | 'waiting_for_response';
  
    let status: CVStatus = $state('paid' as CVStatus);
  
    type TrainingStatus =
    | 'invited'
    | 'in_progress'
    | 'qualified'
    | 'failed'
    | 'did_not_pass_training';

  let trainingStatus: TrainingStatus = $state('invited');
  const trainingStatuses: TrainingStatus[] = [
    'invited',
    'in_progress',
    'failed',
    'qualified',
    'did_not_pass_training'
  ];

  type ServiceApprovalStatus = 'approved' | 'assign_lead' | 'pay_annual_fee' | 'active';

  let serviceApprovalStatus: ServiceApprovalStatus = $state('approved');
  const serviceApprovalStatuses: ServiceApprovalStatus[] = [
    'approved',
    'assign_lead',
    'pay_annual_fee',
    'active'
  ];

  const statuses: CVStatus[] = [
    'paid',
    'in_review',
    'waiting_for_response',
    'approved',
    'denied'
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

  <div class="mt-10 space-y-4 bg-white border rounded-lg p-6 shadow-sm">
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600" for="service-approval-select">Service approval status</label>
      <select id="service-approval-select" class="border rounded px-3 py-2" bind:value={serviceApprovalStatus}>
        {#each serviceApprovalStatuses as sas}
          <option value={sas}>{sas}</option>
        {/each}
      </select>
      <button class="px-3 py-2 bg-gray-100 rounded border" onclick={() => {
        const i = serviceApprovalStatuses.indexOf(serviceApprovalStatus);
        serviceApprovalStatus = serviceApprovalStatuses[Math.max(i - 1, 0)];
      }}>Prev</button>
      <button class="px-3 py-2 bg-gray-100 rounded border" onclick={() => {
        const i = serviceApprovalStatuses.indexOf(serviceApprovalStatus);
        serviceApprovalStatus = serviceApprovalStatuses[Math.min(i + 1, serviceApprovalStatuses.length - 1)];
      }}>Next</button>
    </div>
    
    <ServiceApprovalTracker status={serviceApprovalStatus} title="Service Approval" />
  </div>
</div>

