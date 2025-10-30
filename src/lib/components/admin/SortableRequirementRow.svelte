<script lang="ts">
  import { useSortable } from '@dnd-kit-svelte/sortable';

  interface Requirement {
    _id: string;
    title: string;
    description?: string;
    createdAt: number;
    order?: number;
    replacesRequirementId?: string;
    roleApplicability?: 'regular' | 'lead' | 'both';
  }

  interface Props {
    requirement: Requirement;
    index: number;
    total: number;
    onMove: (fromIndex: number, toIndex: number) => void;
    onReplace: (id: string) => void;
    onRetire: (id: string) => void;
    disabled?: boolean;
  }

  let { requirement, index, total, onMove, onReplace, onRetire, disabled = false }: Props = $props();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(requirement._id) });

  const styleAttr = $derived.by(() => {
    const parts: string[] = [];
    if (transform.current) parts.push(`transform: translate3d(${transform.current.x}px, ${transform.current.y}px, 0)`);
    if (transition.current) parts.push(`transition: ${transition.current}`);
    parts.push(`opacity: ${isDragging.current ? 0.6 : 1}`);
    return parts.join('; ');
  });

  function moveUp() {
    onMove(index, Math.max(0, index - 1));
  }

  function moveDown() {
    onMove(index, Math.min(total - 1, index + 1));
  }
</script>

<div use:setNodeRef style={styleAttr} class="divide-y-0">
  <div class="req-card p-6 hover:bg-gray-50 flex items-start justify-between" role="listitem">
    <div class="flex-1">
      <div class="flex items-center space-x-3 mb-2">
        <button class="cursor-grab text-gray-400 hover:text-gray-600" aria-label="Reorder requirement" {...attributes.current} {...listeners.current}>
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="6" r="1"/>
            <circle cx="5" cy="10" r="1"/>
            <circle cx="5" cy="14" r="1"/>
            <circle cx="9" cy="6" r="1"/>
            <circle cx="9" cy="10" r="1"/>
            <circle cx="9" cy="14" r="1"/>
          </svg>
        </button>
        <h3 class="text-base font-medium text-gray-900">{requirement.title}</h3>
        {#if requirement.order !== undefined}
          <span class="text-xs text-gray-500">Order: {requirement.order}</span>
        {/if}
      </div>

      {#if requirement.description}
        <p class="text-sm text-gray-600 mt-1">{requirement.description}</p>
      {/if}

      <div class="mt-2 text-xs text-gray-500">
        Created: {new Date(requirement.createdAt).toLocaleDateString()}
        {#if requirement.replacesRequirementId}
          <span class="ml-4">Replaces requirement ID: {requirement.replacesRequirementId}</span>
        {/if}
        {#if requirement.roleApplicability}
          <span class="ml-4 inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            Role: {requirement.roleApplicability}
          </span>
        {/if}
      </div>
    </div>

    <div class="flex items-center space-x-2">
      <button type="button" title="Move up" onclick={moveUp} class="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200">↑</button>
      <button type="button" title="Move down" onclick={moveDown} class="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200">↓</button>
      <button type="button" onclick={() => onReplace(requirement._id)} class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200" disabled={disabled}>Replace</button>
      <button type="button" onclick={() => onRetire(requirement._id)} class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200" disabled={disabled}>Retire</button>
    </div>
  </div>
</div>

<style>
  .req-card { user-select: none; }
  .cursor-grab { cursor: grab; }
  .cursor-grab:active { cursor: grabbing; }
  [draggable="true"] { -webkit-user-drag: element; }
  /* Prevent image ghosting selection */
  .req-card * { -webkit-user-drag: none; }
</style>


