<script lang="ts">
  type TrainingStatus = 'invited' | 'in_progress' | 'qualified' | 'failed' | 'did_not_pass_training';

  interface Props {
    status?: TrainingStatus;
    title?: string;
  }
  let { status = 'invited', title = 'Service Readiness' }: Props = $props();

  // Define the 3 main steps with dynamic labels
  const steps = [
    { 
      key: 'invited', 
      label: 'Invited for Training',
      getLabel: () => 'Invited for Training'
    },
    { 
      key: 'in_progress', 
      label: 'Complete Training',
      getLabel: () => status === 'failed' ? 'Did not pass<br/>(Retry Training)' : 'Complete Training'
    },
    { 
      key: 'qualified', 
      label: 'Qualified for Service',
      getLabel: () => status === 'did_not_pass_training' ? 'Did not pass training' : 'Qualified for Service'
    }
  ];

  const getCurrentStepIndex = () => {
    if (status === 'invited') return 0;
    if (status === 'in_progress' || status === 'failed') return 1;
    if (status === 'qualified' || status === 'did_not_pass_training') return 2;
    return 0;
  };

  const currentStepIndex = $derived(getCurrentStepIndex());

  // Calculate progress percentage - line extends to center of current step
  const getProgressPercentage = () => {
    if (status === 'invited') return 20; // Halfway to Training in Progress
    if (status === 'in_progress' || status === 'failed') return 40; // Full to Training in Progress
    if (status === 'qualified' || status === 'did_not_pass_training') return 90; // Full to Qualified
    return 0;
  };

  const progressPercentage = $derived(getProgressPercentage());

  // Calculate actual line width based on circle positions
  const getLineWidth = () => {
    // Calculate the exact pixel positions for each circle center
    // Container width is max-w-md (28rem = 448px)
    const containerWidth = 448; // max-w-md in pixels
    const circleRadius = 16; // w-8 h-8 = 32px, radius = 16px
    
    // Circle centers as percentages of container width
    const firstCircleCenter = (containerWidth * 0.1667) + circleRadius; // 16.67% + 16px
    const secondCircleCenter = (containerWidth * 0.5) + circleRadius; // 50% + 16px  
    const thirdCircleCenter = (containerWidth * 0.8333) + circleRadius; // 83.33% + 16px
    
    if (status === 'invited') {
      // Halfway between first and second circle
      const halfway = firstCircleCenter + (secondCircleCenter - firstCircleCenter) / 2;
      return ((halfway - firstCircleCenter) / containerWidth) * 100;
    }
    if (status === 'in_progress' || status === 'failed') {
      // Full to second circle
      return ((secondCircleCenter - firstCircleCenter) / containerWidth) * 100;
    }
    if (status === 'qualified' || status === 'did_not_pass_training') {
      // Full to third circle
      return ((thirdCircleCenter - firstCircleCenter) / containerWidth) * 100;
    }
    return 0;
  };

  const lineWidth = $derived(getLineWidth());

  // Check if step should show checkmark - completed steps keep their checkmarks
  const shouldShowCheckmark = (stepIndex: number) => {
    // Invited step: show checkmark if we're at invited or beyond (including failed/did_not_pass_training)
    if (stepIndex === 0 && (status === 'invited' || status === 'in_progress' || status === 'failed' || status === 'qualified' || status === 'did_not_pass_training')) {
      return true;
    }
    
    // Complete Training step: show checkmark if training is completed (qualified or did_not_pass_training)
    if (stepIndex === 1 && (status === 'qualified' || status === 'did_not_pass_training')) {
      return true;
    }
    
    // Qualified step: show checkmark ONLY if we're at qualified (not did_not_pass_training)
    if (stepIndex === 2 && status === 'qualified') {
      return true;
    }
    
    return false;
  };

  // Check if step should show X icon for failed status
  const shouldShowX = (stepIndex: number) => {
    // Complete Training step: show X if training failed
    if (stepIndex === 1 && status === 'failed') {
      return true;
    }
    // Qualified step: show X if training did not pass
    if (stepIndex === 2 && status === 'did_not_pass_training') {
      return true;
    }
    
    return false;
  };

  const isCurrentStep = (stepIndex: number) => {
    // Current step is the step that matches the current status (being worked on)
    if (status === 'in_progress' && stepIndex === 1) return true;                    // Complete Training (current action)
    if ((status === 'qualified' || status === 'did_not_pass_training') && stepIndex === 2) return true;  // Qualified/Did not pass (completed)
    return false;
  };
</script>

<div class="w-full max-w-md mx-auto">
  <!-- Title at the top, centered -->
  <h3 class="text-2xl font-bold text-black text-center mb-8">{title}</h3>
  
  <!-- Progress tracker -->
  <div class="relative flex items-center justify-center">
    <!-- Steps container with proper spacing -->
    <div class="relative grid grid-cols-3 gap-0 w-full">
      {#each steps as step, i}
        <div class="flex flex-col items-center relative">
          <!-- Circle node -->
          <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
            {shouldShowX(i) || shouldShowCheckmark(i) ? 'bg-blue-500 border-blue-500' : isCurrentStep(i) ? 'bg-white border-blue-500' : 'bg-white border-gray-300'}">
            
            {#if shouldShowCheckmark(i)}
              <!-- White checkmark for completed steps -->
              <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            {:else if shouldShowX(i)}
              <!-- White X for failed training -->
              <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
          </div>
          
          <!-- Text label below with proper text handling -->
          <div class="mt-3 text-center px-2">
            <div class="text-sm font-medium {shouldShowCheckmark(i) || isCurrentStep(i) ? 'text-black font-bold' : 'text-gray-500'} break-words hyphens-auto">
              {@html step.getLabel()}
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Horizontal line - positioned exactly between circle centers -->
    <div class="absolute h-0.5 bg-gray-300 top-4" style="left: calc(16.67% + 16px); right: calc(16.67% + 16px);"></div>
    
    <!-- Progress line (blue for completed steps) -->
    <div 
      class="absolute h-0.5 bg-blue-500 top-4 transition-all duration-300"
      style={`left: calc(16.67% + 16px); width: ${lineWidth}%;`}
    ></div>
  </div>
</div>


