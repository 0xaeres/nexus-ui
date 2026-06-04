<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Nexus UI — agent & contributor context

Web UI for [Nexus](../nexus) — the sovereign, MCP-native context engine.

**Before touching any screen, component, or route, read [`DESIGN.md`](./DESIGN.md).**
Every screen is live-connected to the FastAPI backend — there is no mock data.

## Read first

- [`DESIGN.md`](./DESIGN.md) — what Nexus is, the locked information
  architecture, the design system rules.
- [`README.md`](./README.md) — quick start.
- [`../nexus/AGENTS.md`](../nexus/AGENTS.md) — backend invariants.

## The two invariants — never break these

1. **Product = root entity.** Every screen is product-scoped under
   `/p/[product]/...`. There is no cross-product view. Business unit is
   display metadata (`owner.team`) only, not a route or access boundary.
2. **Humans approve, agents draft.** The council writes proposals; the UI
   surfaces them at `/p/[product]/review`. Nothing becomes a skill without
   an explicit user action.

## What the backend actually serves

Backend was deliberately slimmed down (see `../nexus/ENGINEERING.md §13`).
**Don't reintroduce UI surface for cut features:**

- No Assistant chat (`/p/[product]/assistant` is gone).
- No org library (`/settings/org` is gone; no Adopted Standards section in
  Skills; no composition graph on skill detail).
- No Activity timeline route, no Proposals power-user route, no Settings
  route.
- Skills are delivered as a bounded three-skill product pack: context,
  architecture, and engineering, with `tier`, `parent`, `related`, and
  `coverage`.
- No org library or reusable composition graph. `related` is pack metadata,
  not cross-product adoption/composition.
- No `cumulative_revisions` counter — only `provenance.revision_count`
  (capped at `0 | 1`).

## Council shape

The council is a bounded expert-pack graph:

```
Planner → Expert fanout → Synthesizer → Repair → Judge
      → optional targeted callback → Finalizer
```

The UI does not expose roster selection. It watches session events, lists all
generated proposal IDs, and routes SMEs to product-scoped review.

## Product onboarding

`/new` creates product metadata and a required GitHub source. It collects a
product service-account PAT plus one or more GitHub repo URLs. Do not add
Confluence/Jira fields to onboarding until their source sync paths exist; they
belong in Sources later.

## Design system (locked)

Tailwind v4 + shadcn-style primitives + `lucide-react` for affordances +
`simple-icons` for vendor brands (GitHub etc).

Design tokens live in `app/globals.css` (`@theme inline` block). **Don't
add raw hex / rgb / hsl literals in component code** — use the tokens.

Typography is a fixed scale: H1 / H2 / H3 / Body / Muted / Subtle / Code /
Small / SectionLabel. **Don't write inline `text-lg`, `text-[10px]`,
`text-[11px]`** — use the scale primitives or `text-base` / `text-xs`.

## Conventions

- Next.js App Router; one screen component per file under
  `components/screens/`.
- API access goes through `lib/api/index.ts` — one typed function per
  endpoint, no business logic.
- Types live in `lib/types.ts`. Don't re-declare backend types in
  component files.
- `useProduct()` is the canonical hook for current product + permissions.

## Before you commit

```bash
npm run build           # type-check + production build; must be clean
```

There's no separate `tsc --noEmit` — the build runs it. Visual smoke-test
the screens you touched in `npm run dev`.
