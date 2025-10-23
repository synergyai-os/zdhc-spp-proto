<script lang="ts">
  type CVStatus = 'paid' | 'in_review' | 'approved' | 'denied' | 'waiting_for_response';

  interface Props {
    status?: CVStatus;
    title?: string;
  }
  let { status = 'paid', title = 'CV Status' }: Props = $props();

  // Define the 3 main steps with dynamic labels
  const steps = [
    { 
      key: 'paid', 
      label: 'Paid',
      getLabel: () => 'Paid'
    },
    { 
      key: 'in_review', 
      label: 'In Review',
      getLabel: () => status === 'waiting_for_response' ? 'Waiting for Response' : 'In Review'
    },
    { 
      key: 'approved', 
      label: 'Approved',
      getLabel: () => status === 'denied' ? 'Denied' : 'Approved'
    }
  ];

  const getCurrentStepIndex = () => {
    if (status === 'paid') return 0;
    if (status === 'in_review' || status === 'waiting_for_response') return 1;
    if (status === 'approved' || status === 'denied') return 2;
    return 0;
  };

  const currentStepIndex = $derived(getCurrentStepIndex());

  // Calculate progress percentage - line extends to center of current step
  const getProgressPercentage = () => {
    if (status === 'paid') return 20; // Halfway to In Review
    if (status === 'in_review' || status === 'waiting_for_response') return 40; // Full to In Review
    if (status === 'approved' || status === 'denied') return 90; // Full to Approved
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
    
    if (status === 'paid') {
      // Halfway between first and second circle
      const halfway = firstCircleCenter + (secondCircleCenter - firstCircleCenter) / 2;
      return ((halfway - firstCircleCenter) / containerWidth) * 100;
    }
    if (status === 'in_review' || status === 'waiting_for_response') {
      // Full to second circle
      return ((secondCircleCenter - firstCircleCenter) / containerWidth) * 100;
    }
    if (status === 'approved' || status === 'denied') {
      // Full to third circle
      return ((thirdCircleCenter - firstCircleCenter) / containerWidth) * 100;
    }
    return 0;
  };

  const lineWidth = $derived(getLineWidth());

  // Check if step should show checkmark - completed steps keep their checkmarks
  const shouldShowCheckmark = (stepIndex: number) => {
    // Paid step: show checkmark if we're at paid or beyond
    if (stepIndex === 0 && (status === 'paid' || status === 'in_review' || status === 'waiting_for_response' || status === 'approved' || status === 'denied')) {
      return true;
    }
    
    // In Review step: show checkmark if we're at approved or denied
    if (stepIndex === 1 && (status === 'approved' || status === 'denied')) {
      return true;
    }
    
    // Approved step: show checkmark if we're at approved or denied
    if (stepIndex === 2 && (status === 'approved' || status === 'denied')) {
      return true;
    }
    
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
            {shouldShowCheckmark(i) || i <= currentStepIndex ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}">
            
            {#if shouldShowCheckmark(i)}
              <!-- White checkmark for completed steps -->
              <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </div>
          
          <!-- Text label below with proper text handling -->
          <div class="mt-3 text-center px-2">
            <div class="text-sm font-medium {shouldShowCheckmark(i) || i <= currentStepIndex ? 'text-black font-bold' : 'text-gray-500'} break-words hyphens-auto">
              {step.getLabel()}
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



