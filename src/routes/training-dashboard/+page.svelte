<script lang="ts">
  import { page } from '$app/stores';
  import { api } from '../../convex/_generated/api';
  import { useQuery } from 'convex-svelte';
  import { getTrainingStatusDisplayName, getTrainingStatusColor, type TrainingStatus } from '../../convex/model/status';

  // Get all service assignments with training status
  const assignmentsQuery = useQuery(api.expertServiceAssignments.getExpertServiceAssignments, {});
  const assignments = assignmentsQuery?.data;
  
  // Filter assignments by training status
  $: trainingRequired = assignments?.filter((a: any) => a.trainingStatus === 'required') || [];
  $: trainingInvited = assignments?.filter((a: any) => a.trainingStatus === 'invited') || [];
  $: trainingInProgress = assignments?.filter((a: any) => a.trainingStatus === 'in_progress') || [];
  $: trainingPassed = assignments?.filter((a: any) => a.trainingStatus === 'passed') || [];
  $: trainingFailed = assignments?.filter((a: any) => a.trainingStatus === 'failed') || [];
  $: alreadyQualified = assignments?.filter((a: any) => a.trainingStatus === 'not_required') || [];

  // Stats
  $: totalAssignments = assignments?.length || 0;
  $: activeTraining = trainingInvited.length + trainingInProgress.length;
  $: completedTraining = trainingPassed.length + alreadyQualified.length;

  function getStatusBadgeClass(status: TrainingStatus): string {
    return getTrainingStatusColor(status);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Training Dashboard - SPP</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Training Dashboard</h1>
      <p class="mt-2 text-gray-600">Monitor and manage expert training progress across all services</p>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Assignments</p>
            <p class="text-2xl font-semibold text-gray-900">{totalAssignments}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Active Training</p>
            <p class="text-2xl font-semibold text-gray-900">{activeTraining}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Completed</p>
            <p class="text-2xl font-semibold text-gray-900">{completedTraining}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Failed</p>
            <p class="text-2xl font-semibold text-gray-900">{trainingFailed.length}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Training Status Sections -->
    <div class="space-y-8">
      <!-- Training Required -->
      {#if trainingRequired.length > 0}
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Training Required ({trainingRequired.length})</h2>
            <p class="text-sm text-gray-500">Experts approved but training invitation not yet sent</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each trainingRequired as assignment}
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-900">
                      {assignment.user?.firstName} {assignment.user?.lastName}
                    </h3>
                    <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadgeClass(assignment.trainingStatus)}">
                      {getTrainingStatusDisplayName(assignment.trainingStatus)}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{assignment.serviceVersion?.name}</p>
                  <p class="text-xs text-gray-500">Role: {assignment.role}</p>
                  <p class="text-xs text-gray-500">Approved: {formatDate(assignment.approvedAt || assignment.createdAt)}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Training In Progress -->
      {#if trainingInProgress.length > 0}
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Training In Progress ({trainingInProgress.length})</h2>
            <p class="text-sm text-gray-500">Experts currently taking training</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each trainingInProgress as assignment}
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-900">
                      {assignment.user?.firstName} {assignment.user?.lastName}
                    </h3>
                    <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadgeClass(assignment.trainingStatus)}">
                      {getTrainingStatusDisplayName(assignment.trainingStatus)}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{assignment.serviceVersion?.name}</p>
                  <p class="text-xs text-gray-500">Started: {assignment.trainingStartedAt ? formatDate(assignment.trainingStartedAt) : 'Unknown'}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Training Failed -->
      {#if trainingFailed.length > 0}
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Training Failed ({trainingFailed.length})</h2>
            <p class="text-sm text-gray-500">Experts who failed training and can retry</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each trainingFailed as assignment}
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-900">
                      {assignment.user?.firstName} {assignment.user?.lastName}
                    </h3>
                    <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadgeClass(assignment.trainingStatus)}">
                      {getTrainingStatusDisplayName(assignment.trainingStatus)}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{assignment.serviceVersion?.name}</p>
                  <p class="text-xs text-gray-500">Failed: {assignment.trainingFailedAt ? formatDate(assignment.trainingFailedAt) : 'Unknown'}</p>
                  {#if assignment.trainingNotes}
                    <p class="text-xs text-gray-500 mt-1">{assignment.trainingNotes}</p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Already Qualified -->
      {#if alreadyQualified.length > 0}
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Already Qualified ({alreadyQualified.length})</h2>
            <p class="text-sm text-gray-500">Experts who were already qualified for this service</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each alreadyQualified as assignment}
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-900">
                      {assignment.user?.firstName} {assignment.user?.lastName}
                    </h3>
                    <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadgeClass(assignment.trainingStatus)}">
                      {getTrainingStatusDisplayName(assignment.trainingStatus)}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{assignment.serviceVersion?.name}</p>
                  <p class="text-xs text-gray-500">Qualified: {assignment.qualifiedAt ? formatDate(assignment.qualifiedAt) : 'Unknown'}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- No Data State -->
      {#if !assignments || assignments.length === 0}
        <div class="bg-white rounded-lg shadow p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No training data</h3>
          <p class="mt-1 text-sm text-gray-500">No service assignments found with training status.</p>
        </div>
      {/if}
    </div>
  </div>
</div>
