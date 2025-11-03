# Patterns and Lessons Learned

This document captures reusable patterns, techniques, and lessons learned during development to help maintain consistency and avoid repeating mistakes.

## Data Table Design for Complex Status Display

**When**: Building tables with multiple status indicators, badges, or complex state information.

**Problem**: Displaying too many visual elements (icons, colors, text, badges) per item creates cognitive overload and makes tables hard to scan quickly.

**Solution**: Use progressive disclosure - show summary counts first, expand for details:
- Default view: Service count + status breakdown (e.g., "5 services: 3 ✅ qualified, 2 ❌ rejected")
- Expandable rows: Click to see full service list with detailed status
- Status hierarchy: Primary status (Ready/Payment Pending) at column level, detailed per-service status on expand

**Key Principles**:
- **Summary first**: Managers need quick scan-ability, not full detail at first glance
- **Progressive disclosure**: Details available on demand (expand/collapse)
- **Visual hierarchy**: Primary actions/issues stand out, details are secondary
- **Reduce badge overload**: Too many colored badges with icons creates visual noise

**Anti-pattern to avoid**: Showing all service badges with full status (icon + color + text + role) in main table view - becomes cluttered and hard to scan.

## Two-Column Layout Pattern for Detail Pages

**When**: Building detail/view pages that need a consistent sidebar + main content layout.

**Problem**: Inconsistent layouts across pages make navigation confusing. Different widths and component placement break user expectations.

**Solution**: Use a standardized two-column flex layout:
- **Left Sidebar**: Fixed width (`w-80 flex-shrink-0`) for summary info, quick actions, or navigation
- **Main Content**: Flexible width (`flex-1`) for primary content cards
- **Container**: Use `max-w-7xl` for wider layouts (vs `max-w-4xl` for single-column)
- **Spacing**: Consistent `gap-6` between columns, `space-y-6` for vertical card spacing

**Example Structure**:
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
- **Placement logic**: Summary/header info in sidebar, actionable content in main area

**Where used**: Expert profile pages (`/experts/[expertId]/+page.svelte`), CV detail views

## Status Tracker Component Integration

**When**: Integrating visual progress trackers that use different status formats than your business logic.

**Problem**: UI tracker components often use simplified status types (e.g., `'paid' | 'in_review' | 'approved'`) while business logic uses more granular statuses (e.g., `'locked_for_review' | 'unlocked_for_edits' | 'locked_final'`).

**Solution**: Create mapping functions using `$derived.by()` to convert business statuses to tracker format:
- Map granular statuses to simplified tracker statuses
- Return `null` when tracker shouldn't be shown
- Use conditional rendering based on both the mapped status and a visibility check

**Example**:
```svelte
const getCVTrackerStatus = $derived.by((): TrackerStatus | null => {
  if (!expertCV?.data) return null;
  const cvStatus = expertCV.data.status;
  
  // Map business statuses to tracker format
  if (cvStatus === 'paid') return 'paid';
  if (cvStatus === 'locked_for_review') return 'in_review';
  if (cvStatus === 'unlocked_for_edits') return 'waiting_for_response';
  if (cvStatus === 'locked_final') return 'approved';
  
  // Don't show tracker for pre-payment statuses
  return null;
});

const shouldShowTracker = $derived.by(() => {
  return ['paid', 'locked_for_review', 'unlocked_for_edits', 'locked_final']
    .includes(expertCV?.data?.status);
});
```

**Key Principles**:
- **Single source of truth**: Business statuses stay in database, mapping happens in UI layer
- **Type safety**: Use TypeScript union types for tracker statuses
- **Conditional rendering**: Check both mapped status and visibility before rendering
- **Graceful degradation**: Return `null` for states that don't need tracker

## Timeline/Activity Feed Pattern

**When**: Displaying chronological history of events with user-friendly formatting.

**Problem**: Raw timestamps and technical event descriptions aren't user-friendly. Users want to see "what happened when" with contextual duration information.

**Solution**: Build timeline components that:
- Sort events chronologically (latest first or oldest first based on context)
- Group related events (e.g., by CV version)
- Calculate and display duration between consecutive events
- Use human-readable descriptions (remove technical jargon like "for CV version X")
- Provide visual hierarchy with color-coded event types

**Example Structure**:
```typescript
// Calculate duration between events
function formatDurationDays(earlier: number, later: number): string {
  const diffDays = Math.floor((later - earlier) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    // Handle hours/minutes for same-day events
  }
  return diffDays === 1 ? '1 day' : `${diffDays} days`;
}

// Group events by version/context
const timelineGroups = $derived.by(() => {
  const groups = new Map<number, TimelineGroup>();
  // Process and group events...
  return Array.from(groups.values()).sort(/* latest first */);
});
```

**Key Principles**:
- **Remove redundancy**: Don't repeat context in every event description
- **Duration context**: Show time elapsed between events (e.g., "3 days later")
- **Visual indicators**: Use icons and colors for quick event type recognition
- **Error handling**: Wrap timeline processing in try-catch for defensive programming
- **Empty states**: Handle cases where no history exists gracefully

## Error Handling in Derived State

**When**: Using `$derived.by()` for complex computations that might fail with malformed data.

**Problem**: Runtime errors in derived state can crash the entire component, especially when processing external data that might be missing properties or have unexpected structure.

**Solution**: Always wrap complex derived computations in try-catch blocks:
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

