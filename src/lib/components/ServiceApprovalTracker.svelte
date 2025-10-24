<script lang="ts">
  import { getServiceApprovalStatusDisplayName } from '../../convex/model/status';
  
  type ServiceApprovalStatus = 'approved' | 'assign_lead' | 'pay_annual_fee' | 'active';

  interface Props {
    status?: ServiceApprovalStatus;
    title?: string;
  }
  let { status = 'approved', title = 'Service Approval' }: Props = $props();

  // Define the 4 main steps with dynamic labels
  const steps = [
    { 
      key: 'approved', 
      label: 'Approved',
      getLabel: () => getServiceApprovalStatusDisplayName('approved')
    },
    { 
      key: 'assign_lead', 
      label: 'Assign Qualified Lead Expert',
      getLabel: () => getServiceApprovalStatusDisplayName('assign_lead')
    },
    { 
      key: 'pay_annual_fee', 
      label: 'Pay Annual Fee',
      getLabel: () => getServiceApprovalStatusDisplayName('pay_annual_fee')
    },
    { 
      key: 'active', 
      label: 'Active',
      getLabel: () => getServiceApprovalStatusDisplayName('active')
    }
  ];

  const getCurrentStepIndex = () => {
    if (status === 'approved') return 0;
    if (status === 'assign_lead') return 1;
    if (status === 'pay_annual_fee') return 2;
    if (status === 'active') return 3;
    return 0;
  };

  const currentStepIndex = $derived(getCurrentStepIndex());

  // Calculate progress percentage - line extends to center of current step
  const getProgressPercentage = () => {
    if (status === 'approved') return 25; // Link to Assign Lead Expert
    if (status === 'assign_lead') return 25; // Full to Assign Lead Expert
    if (status === 'pay_annual_fee') return 50; // Full to Pay Annual Fee
    if (status === 'active') return 70; // Full to Active
    return 0;
  };

  const progressPercentage = $derived(getProgressPercentage());

  // Check if step should show checkmark - completed steps keep their checkmarks
  const shouldShowCheckmark = (stepIndex: number) => {
    // Show checkmark for completed steps (steps before the current actionable step)
    if (status === 'approved' && stepIndex === 0) return true;         // Approved completed
    if (status === 'assign_lead' && stepIndex === 0) return true;     // Approved completed (same as approved)
    if (status === 'pay_annual_fee' && stepIndex <= 1) return true;   // Approved + Assign Lead completed
    if (status === 'active' && stepIndex <= 3) return true;           // All steps completed
    return false;
  };

  const isCurrentStep = (stepIndex: number) => {
    // Current step is the NEXT actionable step based on status
    if (status === 'approved' && stepIndex === 1) return true;        // Assign Lead Expert
    if (status === 'assign_lead' && stepIndex === 1) return true;     // Assign Lead Expert (same as approved)
    if (status === 'pay_annual_fee' && stepIndex === 2) return true;  // Pay Annual Fee
    if (status === 'active' && stepIndex === 3) return true;         // Active (completed)
    return false;
  };

  const isCompletedStep = (stepIndex: number) => {
    // Completed steps are those before the current step
    return stepIndex < currentStepIndex;
  };
</script>

<div class="w-full max-w-md mx-auto py-12">
  <!-- Progress tracker -->
  <div class="relative flex items-center justify-center">
    <!-- Steps container with proper spacing -->
    <div class="relative grid grid-cols-4 gap-0 w-full">
      {#each steps as step, i}
        <div class="flex flex-col items-center relative">
          <!-- Circle node -->
          <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
            {shouldShowCheckmark(i) ? 'bg-blue-500 border-blue-500' : isCurrentStep(i) ? 'bg-white border-blue-500' : 'bg-white border-gray-300'}">
            
            {#if shouldShowCheckmark(i)}
              <!-- White checkmark for completed steps -->
              <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </div>
          
          <!-- Text label below with proper text handling -->
          <div class="mt-3 text-center px-2">
            <div class="text-sm font-medium {shouldShowCheckmark(i) || isCurrentStep(i) ? 'text-black font-bold' : 'text-gray-500'} break-words hyphens-auto">
              {step.getLabel()}
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Horizontal line - positioned exactly between circle centers -->
    <div class="absolute h-0.5 bg-gray-300 top-4" style="left: calc(12.5% + 16px); right: calc(12.5% + 16px);"></div>
    
    <!-- Progress line (blue for completed steps) -->
    <div 
      class="absolute h-0.5 bg-blue-500 top-4 transition-all duration-300"
      style={`left: calc(12.5% + 16px); width: ${progressPercentage}%;`}
    ></div>
  </div>
</div>
