<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Nexus product & design context

**Before touching any screen, component, or route, read `DESIGN.md` at the repo root.** Every screen is live-connected to the FastAPI backend — there is no mock data. `DESIGN.md` defines:

- What Nexus is (sovereign, MCP-native skill server for engineering orgs)
- The product-first mental model: Product → Sources → Council → Skills (with composition)
- Hard tenancy isolation per product; RBAC personas (Org Admin / Product Admin / SME)
- The locked information architecture (`/p/[product]/...` namespaced routes)
- Model-agnostic skill file structure (master / tech_stack / language / security)
- LLM Council rosters per skill kind, with cost estimates (cost transparency is a UX requirement)
- **§7.1–7.5** — the runtime mechanics: delta-only ingestion, change-gated council cadence with weekly cap + override, the priors mechanism (starting revision + corrections corpus + rejection log), corrections compaction, and the `EVIDENCE_CHUNKS_PER_SESSION_CAP`. Read these before changing anything that touches sources, council, proposals, or skill detail — backend and UI are wired against the contracts described there.
- Design system rules: **Tailwind v4 + shadcn-style primitives** (migration complete 2026-05-15), fixed design tokens and agent hues
- Pointers to the canonical plan files in `~/.claude/plans/`

The redesign is complete. `DESIGN.md` is the durable source of truth for all design decisions; the plan files are historical context.

**Two revision counters, easy to confuse** (see DESIGN.md §7.3):

- `provenance.revision_count` is per-session, hard-capped at `0 | 1`, used by the confidence formula.
- `provenance.cumulative_revisions` is across all sessions for a skill, monotonic, used by the priors badge.

Do not collapse them into one field.
