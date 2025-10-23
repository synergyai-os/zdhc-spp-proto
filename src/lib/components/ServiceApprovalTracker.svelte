<script lang="ts">
  type ServiceApprovalStatus = 'approved' | 'assign_lead' | 'pending_payment' | 'active';

  interface Props {
    status?: ServiceApprovalStatus;
    title?: string;
  }
  let { status = 'approved', title = 'Service Approval' }: Props = $props();

  // Define the 3 main steps with dynamic labels
  const steps = [
    { 
      key: 'approved', 
      label: 'Approved',
      getLabel: () => 'Approved'
    },
    { 
      key: 'assign_lead', 
      label: 'Assign Lead Expert',
      getLabel: () => status === 'pending_payment' ? 'Pending Payment' : 'Assign Lead Expert'
    },
    { 
      key: 'active', 
      label: 'Active',
      getLabel: () => 'Active'
    }
  ];

  const getCurrentStepIndex = () => {
    if (status === 'approved') return 0;
    if (status === 'assign_lead' || status === 'pending_payment') return 1;
    if (status === 'active') return 2;
    return 0;
  };

  const currentStepIndex = $derived(getCurrentStepIndex());

  // Calculate progress percentage - line extends to center of current step
  const getProgressPercentage = () => {
    if (status === 'approved') return 20; // Halfway to Assign Lead Expert
    if (status === 'assign_lead' || status === 'pending_payment') return 40; // Full to Assign Lead Expert
    if (status === 'active') return 90; // Full to Active
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
    
    if (status === 'approved') {
      // Halfway between first and second circle
      const halfway = firstCircleCenter + (secondCircleCenter - firstCircleCenter) / 2;
      return ((halfway - firstCircleCenter) / containerWidth) * 100;
    }
    if (status === 'assign_lead' || status === 'pending_payment') {
      // Full to second circle
      return ((secondCircleCenter - firstCircleCenter) / containerWidth) * 100;
    }
    if (status === 'active') {
      // Full to third circle
      return ((thirdCircleCenter - firstCircleCenter) / containerWidth) * 100;
    }
    return 0;
  };

  const lineWidth = $derived(getLineWidth());

  // Check if step should show checkmark - completed steps keep their checkmarks
  const shouldShowCheckmark = (stepIndex: number) => {
    // Approved step: show checkmark if we're at approved or beyond
    if (stepIndex === 0 && (status === 'approved' || status === 'assign_lead' || status === 'pending_payment' || status === 'active')) {
      return true;
    }
    
    // Assign Lead Expert step: show checkmark if we're at active
    if (stepIndex === 1 && status === 'active') {
      return true;
    }
    
    // Active step: show checkmark if we're at active
    if (stepIndex === 2 && status === 'active') {
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
