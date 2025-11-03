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

