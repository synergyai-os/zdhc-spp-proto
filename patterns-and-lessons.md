# Patterns and Lessons Learned

This document captures reusable patterns, techniques, and lessons learned during development to help maintain consistency and avoid repeating mistakes.

**Important**: Context7 documentation is always the leading and most accurate source for framework-specific patterns (e.g., Svelte 5 runes, Convex integration, etc.). This document is continuously updated and improved as we learn while building, but Context7 should be consulted first when validating framework patterns or when confidence is below 95%.

## Tech Stack

- **Svelte 5** (with runes: `$state`, `$props`, `$derived`, `$effect`)
- **SvelteKit** (file-based routing)
- **TypeScript** (full type safety)
- **Convex** (backend-as-a-service with `convex-svelte`)
- **Tailwind CSS 4.1.14** (utility-first styling)

---

## Svelte 5 Runes Best Practices

### Component Props with `$props()`

**Always use**: `let { propName } = $props()` instead of `export let propName`.

```svelte
<script lang="ts">
  let { userId, orgId, optional = 'default' } = $props<{
    userId: string;
    orgId: string;
    optional?: string;
  }>();
</script>
```

**Key Points**:
- Use TypeScript interfaces for prop types
- Destructure props directly in `$props()`
- Default values work the same as Svelte 4

### Reactive State with `$state()`

**Always use**: `let count = $state(0)` instead of `let count = 0` for reactive variables.

```svelte
<script>
  let count = $state(0);
  let user = $state({ name: 'John', age: 30 });
</script>
```

**Key Points**:
- Objects and arrays are deeply reactive automatically
- No need for `.value` property (unlike Svelte stores)
- Changes trigger reactivity automatically

### Derived State with `$derived()` and `$derived.by()`

**Use `$derived()` for simple expressions**:
```svelte
let count = $state(0);
const doubled = $derived(count * 2);
```

**Use `$derived.by()` for complex computations**:
```svelte
const processedData = $derived.by(() => {
  if (!data?.items) return [];
  return data.items.map(item => transform(item));
});
```

**Critical Restrictions** (validated with Context7):
- **No state mutations**: Cannot update `$state` variables inside `$derived.by()` - use `$effect()` for side effects
- **No recursive references**: A derived value cannot reference itself recursively
- **No async outside effects**: `$derived` with `await` must be created within an effect tree
- **Cannot export**: Derived state cannot be exported directly from modules - export a function that returns the value instead
- **Use `$effect()` for side effects**: Don't mutate state in `$derived`, use `$effect()` instead

### Side Effects with `$effect()`

**Always use**: `$effect()` for side effects (DOM manipulation, analytics, etc.), not for derived state.

```svelte
<script>
  let count = $state(0);
  
  // ✅ Correct: Side effect
  $effect(() => {
    console.log('Count changed:', count);
    document.title = `Count: ${count}`;
  });
  
  // ❌ Wrong: This should be $derived()
  $effect(() => {
    doubled = count * 2; // Don't do this!
  });
</script>
```

**Key Points**:
- Use `$effect()` for side effects (DOM, logging, external APIs)
- Use `$derived()` for computed values
- `$effect()` automatically tracks dependencies

### Error Handling in Derived State

**Always wrap** complex `$derived.by()` computations in try-catch blocks:

```svelte
const processedData = $derived.by(() => {
  try {
    if (!data?.items || !Array.isArray(data.items)) return [];
    // Complex processing...
    return result;
  } catch (error) {
    console.error('Error processing data:', error);
    return []; // Return safe default
  }
});
```

**Key Principles**:
- **Defensive checks**: Validate data structure before processing
- **Safe defaults**: Return empty arrays/objects rather than undefined
- **Error logging**: Log errors for debugging while preventing crashes
- **Type guards**: Check for required properties before accessing them

### `{@const}` Placement Rules

**When**: Using `{@const}` tags to define local constants in Svelte 5 templates.

**Problem**: `{@const}` must be the immediate child of certain block constructs. Placing it inside nested elements causes compilation errors.

**Solution**: Place `{@const}` declarations as the first statements after opening block tags:

```svelte
{#each items as item, index}
  {@const dotColor = getColor(item)}
  {@const icon = getIcon(item)}
  <div class="relative pb-4">
    <div class="absolute -left-[9px] w-3 h-3 {dotColor}"></div>
    <span>{icon}</span>
  </div>
{/each}
```

**Supported Block Types** (validated with Context7):
`{@const}` must be the immediate child of: `{#snippet}`, `{#if}`, `{:else if}`, `{:else}`, `{#each}`, `{:then}`, `{:catch}`, `<svelte:fragment>`, `<svelte:boundary>`, or `<Component>` tags.

**Key Principles**:
- **Immediate child**: Must be first line after supported block types
- **Not inside elements**: Cannot be inside `<div>`, `<span>`, or other HTML tags
- **Before usage**: Place before any template elements that use the constant
- **Multiple declarations**: Can have multiple `{@const}` tags in sequence

---

## Convex-Svelte Integration Patterns

### Query Component Pattern

**CRITICAL**: Convex `useQuery` calls must be at the component top level, but we need reusability. Use the **Query Component Pattern**:

```svelte
<!-- src/lib/components/queries/ExpertQueries.svelte -->
<script lang="ts">
  import { useQuery } from 'convex-svelte';
  import { api } from '$lib';

  let { expertId, orgId, children } = $props<{
    expertId: string;
    orgId: string;
    children: any;
  }>();

  // All useQuery calls at top level (Convex requirement)
  const latestCV = useQuery(api.expertCVs.getLatestExpertCV, () => ({
    userId: expertId as any,
    organizationId: orgId as any
  }));

  const userData = useQuery(api.utilities.getUserById, () => ({
    id: (latestCV?.data?.userId || expertId) as any
  }));

  // Prepare data for children
  const queryData = $derived({
    latestCV,
    userData,
    currentCVData: latestCV?.data,
    isLoading: latestCV?.isLoading || userData?.isLoading || false,
    hasError: latestCV?.error || userData?.error || false
  });
</script>

{#if children}
  {@render children(queryData)}
{/if}
```

**Usage with Svelte 5 snippets**:
```svelte
<ExpertQueries expertId={expertId} orgId={orgId}>
  {#snippet children(queryData)}
    {#if queryData.isLoading}
      <div>Loading...</div>
    {:else if queryData.hasError}
      <div>Error: {queryData.hasError}</div>
    {:else}
      <div>Data: {JSON.stringify(queryData.currentCVData)}</div>
    {/if}
  {/snippet}
</ExpertQueries>
```

**Key Principles**:
- All `useQuery` calls must be at component top level
- Encapsulate queries in reusable components
- Use Svelte 5 snippets to pass data to children
- Derive aggregated state from query results

### Conditional Convex Queries with Dummy IDs

**Problem**: Convex queries must be called unconditionally, but you may need data that depends on another query first.

**Solution**: Always call `useQuery` with valid arguments, using dummy fallback IDs when data is unavailable:

```svelte
const latestCV = useQuery(api.expertCVs.getLatestExpertCV, () => ({
  userId: expertId as any,
  organizationId: orgId as any
}));

// ✅ Correct: Always call with valid ID (dummy if needed)
const userData = useQuery(api.utilities.getUserById, () => ({
  id: (latestCV?.data?.userId || 'j1j1j1j1j1j1j1j1j1j1j1j1') as any
}));

// ❌ Wrong: Conditional useQuery call
// if (latestCV?.data?.userId) {
//   const userData = useQuery(...); // Don't do this!
// }
```

**Key Principles**:
- Never conditionally call `useQuery` - always call it with valid arguments
- Use dummy IDs (like `'j1j1j1j1j1j1j1j1j1j1j1j1'`) when real data isn't available yet
- The query will return `null` or empty when the ID is invalid
- Check `query?.data` before using the result

### Mutations with `useConvexClient()`

**Pattern**: Get client once, call mutations as needed:

```svelte
<script>
  import { useConvexClient } from 'convex-svelte';
  import { api } from '$lib';

  const client = useConvexClient();

  async function handleSave() {
    try {
      const result = await client.mutation(api.expert.update, {
        cvId: currentCVId,
        data: formData
      });
      console.log('Saved:', result);
    } catch (error) {
      console.error('Save failed:', error);
    }
  }
</script>
```

**Key Principles**:
- Get client once with `useConvexClient()`
- Mutations return promises - await them if you need the result
- Handle errors appropriately
- Fire-and-forget is fine if you don't need the result

---

## UI Layout Patterns

### Two-Column Layout for Detail Pages

**When**: Building detail/view pages that need a consistent sidebar + main content layout.

**Solution**: Use a standardized two-column flex layout:

```svelte
<div class="flex gap-6">
  <!-- LEFT SIDEBAR: Summary & Quick Actions -->
  <div class="w-80 flex-shrink-0 space-y-4">
    <SummaryCard />
    <QuickActions />
  </div>

  <!-- MAIN CONTENT AREA -->
  <div class="flex-1 space-y-6">
    <PrimaryCard />
    <SecondaryCard />
  </div>
</div>
```

**Key Principles**:
- **Consistent widths**: Always use `w-80` for sidebar to maintain visual consistency
- **Flex-shrink-0**: Prevents sidebar from collapsing on smaller screens
- **Vertical spacing**: Use `space-y-4` or `space-y-6` consistently within sections
- **Container**: Use `max-w-7xl` for wider layouts (vs `max-w-4xl` for single-column)

**Where used**: Expert profile pages (`/experts/[expertId]/+page.svelte`), CV detail views

---

## Status Mapping Patterns

### Business Status to UI Component Mapping

**When**: Integrating visual components that use different status formats than your business logic.

**Problem**: UI components often use simplified status types while business logic uses more granular statuses.

**Solution**: Create mapping functions using `$derived.by()` to convert business statuses to component format:

```svelte
const getCVTrackerStatus = $derived.by((): TrackerStatus | null => {
  if (!expertCV?.data) return null;
  const cvStatus = expertCV.data.status;
  
  // Map granular statuses to simplified tracker format
  if (cvStatus === 'paid') return 'paid';
  if (cvStatus === 'locked_for_review') return 'in_review';
  if (cvStatus === 'unlocked_for_edits') return 'waiting_for_response';
  if (cvStatus === 'locked_final') return 'approved';
  
  return null; // Don't show tracker for unmapped statuses
});

const shouldShowTracker = $derived.by(() => {
  return ['paid', 'locked_for_review', 'unlocked_for_edits', 'locked_final']
    .includes(expertCV?.data?.status);
});
```

**Key Principles**:
- **Single source of truth**: Business statuses stay in database, mapping happens in UI layer
- **Type safety**: Use TypeScript union types for component statuses
- **Conditional rendering**: Check both mapped status and visibility before rendering
- **Graceful degradation**: Return `null` for states that don't need the component

---

## Anti-Patterns to Avoid

### ❌ Using `$effect()` for State Synchronization

```svelte
// ❌ Don't do this:
let count = $state(0);
let doubled = $state();

$effect(() => {
  doubled = count * 2; // Wrong!
});
```

```svelte
// ✅ Do this instead:
let count = $state(0);
let doubled = $derived(count * 2);
```

### ❌ Conditional `useQuery` Calls

```svelte
// ❌ Don't do this:
if (someCondition) {
  const data = useQuery(api.something.get, () => ({ id }));
}
```

```svelte
// ✅ Do this instead:
const data = useQuery(api.something.get, () => ({
  id: someCondition ? realId : dummyId
}));
```

### ❌ Exporting Derived State from Modules

```typescript
// ❌ Don't do this:
export const derivedValue = $derived(someState * 2);
```

```typescript
// ✅ Do this instead:
export function getDerivedValue(state: number) {
  return state * 2;
}
```

---

## Additional Resources

- **Context7**: Always consult Context7 for latest framework documentation
- **Svelte 5 Docs**: https://svelte.dev/docs
- **Convex Docs**: https://docs.convex.dev
- **Convex-Svelte**: https://github.com/get-convex/convex-svelte
