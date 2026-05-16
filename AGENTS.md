<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Nexus product & design context

**Before touching any screen, component, route, or mock data, read `DESIGN.md` at the repo root.** It defines:

- What Nexus is (sovereign, MCP-native skill server for engineering orgs)
- The product-first mental model: Product → Sources → Council → Skills (with composition)
- Hard tenancy isolation per product; RBAC personas (Org Admin / Product Admin / SME)
- The locked information architecture (`/p/[product]/...` namespaced routes)
- Model-agnostic skill file structure (master / tech_stack / language / security)
- LLM Council rosters per skill kind, with cost estimates (cost transparency is a UX requirement)
- Design system rules: **no Tailwind**, inline styles, fixed design tokens and agent hues
- Pointers to the canonical plan files in `~/.claude/plans/`

The in-flight redesign target is `~/.claude/plans/composed-forging-treasure.md`. Treat that plan as the source of truth for *what* is changing; treat `DESIGN.md` as the durable *why*.
