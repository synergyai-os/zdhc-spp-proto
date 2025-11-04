# root-cause

- Investigate and find the root cause.
- Start by reading 'patterns-and-lessons.md' for previous issues and ideas to solve or approach our challenge.

## Context7 Integration

**CRITICAL**: Context7 documentation is always the leading and most accurate source for framework-specific patterns. When investigating root causes:
- Check Context7 first for latest framework documentation and best practices
- Use Context7 to validate framework-specific behavior (e.g., Svelte 5 runes, Convex patterns)
- patterns-and-lessons.md is continuously updated and improved as we learn while building, but Context7 should always be consulted first when validating framework patterns
- If confidence is below 95%, use Context7 to get latest docs or best practices before proposing solutions

## Updating patterns-and-lessons.md

**IMPORTANT**: If you discover a new pattern while investigating root causes, evaluate it against these criteria:

### ✅ Add to patterns-and-lessons.md if:
- **Framework/tech-stack specific**: Related to Svelte 5, Convex-Svelte, TypeScript, Tailwind
- **Reusable across components**: Pattern that applies to multiple features
- **Helps AI assistants**: Will help a NEW AI assistant understand how the tech stack works
- **Common mistake**: Anti-pattern that others might repeat

### ❌ DON'T add to patterns-and-lessons.md if:
- **Domain-specific**: Business logic or domain-specific UI patterns
- **One-off solution**: Pattern that only applies to a single feature
- **Temporary workaround**: Hack that should be fixed, not documented

**Remember**: This document is for tech-stack patterns, not business logic or domain-specific solutions.

---

- Don't build anything unless you are 95% confident you can solve it. 
- If not, only research and report back your level of confidence in the fix (0 - 100%).
- Use context7 if required to get latest docs or best practices.
