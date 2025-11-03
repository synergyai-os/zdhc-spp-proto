# Patterns and Lessons Learned

This document captures reusable patterns, techniques, and lessons learned during development to help maintain consistency and avoid repeating mistakes.

## Route Migration Pattern

**When**: Need to restructure routes (move, rename, or reorganize).

**Approach**:
1. **Create new route structure** first
2. **Move/copy files** to new location
3. **Fix import paths** - count directory levels carefully when updating relative imports
4. **Update all references** - use `grep` to find:
   - `goto()` calls
   - `href` links
   - Navigation redirects
5. **Create redirect route** at old location as safety net (especially for prototypes)
6. **Update sub-routes** - don't forget nested routes

**Example**: Migration from `/user-management/experts/[id]/edit` to `/experts/[id]/cv`
- Created new `/experts/[id]/+page.svelte` (profile page)
- Moved CV edit to `/experts/[id]/cv/+page.svelte`
- Moved sub-routes: `/experts/[id]/cv/new-*`
- Created redirect: old route → new route
- Updated ~15 references across components

**Tips**:
- Use `grep -r "old-path" src/` to find all references
- Update relative import paths (e.g., `../../../../` vs `../../../../../`)
- Keep redirect temporarily - helps catch missed links during testing
- Update both programmatic navigation (`goto`) and static links (`href`)

## Relative Import Path Calculation

**Pattern**: When moving files, count directory levels to update imports.

**Method**:
- Count levels from file to `src/` root
- Each level = one `../`
- Example: `src/routes/experts/[expertId]/cv/+page.svelte` → `src/`
  - routes → `../`
  - experts → `../../`
  - [expertId] → `../../../`
  - cv → `../../../../`
  - Then: `../../../../convex/model/status`

**Common mistake**: Off-by-one errors when counting nested directories.

## Prototype-Friendly Practices

**For prototypes with rapid iteration**:
- **Redirects as safety net**: Old routes redirect to new ones
- **Fix broken links later**: Don't over-optimize - move fast, fix incrementally
- **Systematic updates**: Use grep to find ALL references before manual updates
- **Test incrementally**: Verify each change works before moving on

**Trade-offs**:
- Accept temporary duplication (old + new routes)
- Prioritize working code over perfect cleanup
- Fix incrementally based on actual usage

## File Organization

**Route Structure Principles**:
- Keep routes semantic: `/experts/[id]` for profile, `/experts/[id]/cv` for CV editing
- Sub-routes should match their parent route's purpose
- Profile pages (`/experts/[id]`) should be read-only views
- Edit pages (`/experts/[id]/cv`) should handle mutations

