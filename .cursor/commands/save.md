# save

First, analyse our work and 'patterns-and-lessons.md'. Evaluate if we need to add, update or remove something so this resource becomes better and better over time.

## Maintaining patterns-and-lessons.md Quality

**CRITICAL**: This document must stay focused on **tech-stack patterns** that help AI assistants understand the codebase. It is NOT a place for domain-specific or business-logic patterns.

### ✅ INCLUDE in patterns-and-lessons.md:
- **Framework-specific patterns**: Svelte 5 runes (`$state`, `$props`, `$derived`, `$effect`), Convex-Svelte integration
- **Tech-stack integration patterns**: How Svelte 5 works with Convex, TypeScript patterns, Tailwind CSS patterns
- **Reusable code patterns**: Query Component Pattern, conditional query handling, error handling in derived state
- **Anti-patterns**: Common mistakes with correct alternatives (framework-level only)
- **Syntax rules**: `{@const}` placement, rune restrictions, etc.

### ❌ EXCLUDE from patterns-and-lessons.md:
- **Domain-specific UI patterns**: Data table designs, status display patterns, timeline components
- **Business logic patterns**: Service assignment workflows, CV approval flows, etc.
- **Overly specific patterns**: Patterns that only apply to one feature or component
- **Temporary workarounds**: Hacks or temporary solutions that should be fixed, not documented

### Evaluation Checklist:
Before adding/updating patterns-and-lessons.md:
1. **Is this framework/tech-stack specific?** ✅ If yes, consider including
2. **Will this help a NEW AI assistant understand the codebase?** ✅ If yes, include
3. **Is this reusable across multiple components?** ✅ If yes, include
4. **Is this domain/business-logic specific?** ❌ If yes, DON'T include
5. **Does this describe how to use a framework feature?** ✅ If yes, include

### Context7 Integration:
- **Context7 is always leading**: Check Context7 for latest framework documentation before updating
- **Validate against Context7**: Framework-specific rules must be validated with Context7
- **patterns-and-lessons.md is supplementary**: Captures our specific implementation patterns, but Context7 is authoritative

### Review Process:
When updating patterns-and-lessons.md:
1. **Validate** with Context7 if it's framework-specific
2. **Check** if pattern is reusable and tech-stack focused
3. **Remove** any domain-specific fluff that accumulated
4. **Keep** it concise and focused on what AI assistants need

---

Commit the files we worked on.
- First review what changes we did and only then commit the changes done in this chat.
- Don't save to github.
