# Anvay UI — Design Context

> **Stop. Read this before writing any UI code.**
>
> Most of what's in here is non-negotiable. The design system rules in §6
> are the single source of truth — if a tool tries to add `text-[11px]`,
> a glow card to a regular section, or a screen outside the locked IA,
> push back.

## 1. What Anvay is (one paragraph)

Anvay indexes a product's code + docs, runs a bounded expert LLM council
to draft a curated product skill pack, and serves approved skills via MCP
to any AI coding client (Claude, Cursor, Continue, …). The UI is where
humans drive sources, watch council runs, and approve / edit / reject
proposals one at a time. See
[`../anvay/README.md`](../anvay/README.md) for the backend overview.

## 2. What this repo is

Next.js 16 (App Router, TypeScript) UI. All screens are live-connected
to the FastAPI backend — there is no mock data and no env flag to switch
to one. If a screen needs data the backend doesn't yet expose, the
backend gets the route first; the UI follows.

## 3. The mental model (do not violate)

Two invariants:

1. **Product = root entity.** Every screen worth navigating to lives
   under `/p/[product]/…`. There is no cross-product list, no global
   skill catalogue, no "all sessions across the org" page. Adding one is
   a tenancy regression. Business units are optional product display metadata
   (`owner.team`) in v1, not navigation, RBAC, or tenancy.
2. **Humans approve, agents draft.** The council writes proposals; the UI
   surfaces them at `/p/[product]/review` for human approval. Nothing
   becomes a `.skill.md` without an explicit human action.

The Skill belongs to a product-scoped three-skill pack: context, architecture,
and engineering. Pack metadata is display/review context only; it is not org
library scope or cross-product composition.

```ts
interface Skill {
  id: string                    // "{product}/{name}"
  name: string
  product: ProductId
  version: number
  tier: 'product_master' | 'application' | 'domain' | 'interface' | 'tech_stack' | 'quality_security'
  parent: string | null
  related: string[]
  coverage: { repos: string[]; applications: string[]; topics: string[] }
  confidence: number
  applies_to: { files: string[]; contexts: string[] }
  provenance: Provenance
  body: string                  // markdown
}
```

There are no `kind` / `scope` / `composes_with` fields, no org-wide skill
library, and no bulk approval. A product has zero or one approved pack with
multiple skills; pending proposals keep the product in Review until cleared.

## 4. Information architecture (locked)

```
/                                Org-wide product list (ProjectsDashboard)
/setup                           First-run skills-repo bootstrap
/new                             Create a product

/p/[product]/
  /dashboard                     Pipeline cards + pending proposals + recent activity
  /ask                           Source-grounded product Q&A
  /sources                       Source list
  /sources/new                   Add a source (GitHub, filesystem, Jira, or Confluence)
  /sources/[name]                Source detail + live SSE sync log
  /ingest                        Stage gate at the ingest phase
  /council                       Session list + start dialog
  /council/[id]                  Live deliberation + draft pack preview
  /review                        ReviewStage — approve / reject / revise proposals
  /skill                         Compatibility redirect to /skills
  /skills                        Unified approved product skill view
  /skills/[id]                   Compatibility redirect to /skills
  /setup-client                  MCP client setup
```

That's the full surface. `/p/[product]/ask` is source-grounded product Q&A,
not the deleted Assistant chat surface. **Don't add `/p/[product]/assistant`,
`/p/[product]/activity`, `/p/[product]/proposals`,
`/p/[product]/settings`, or `/settings/org` back.** Those layers were
removed when the backend was slimmed — see
[`../anvay/ENGINEERING.md §13`](../anvay/ENGINEERING.md).

## 5. Council (UI shape)

The bounded expert-pack graph:

```
Planner → Expert fanout (Architect, Domain, Quality) → Synthesizer → Repair (≤3 attempts) → Eval → Finalizer
```

The CouncilLanding "start session" dialog asks only for a **topic**; there is
no skill-kind picker, roster selector, or cost-per-roster disclaimer. The
CouncilSession view (`/p/[id]/council/[sessionId]`) streams deliberation/cost
events and may surface multiple `proposal_id`s. The right panel previews the
draft pack and links to product-scoped Review.

## 6. Design system rules (non-negotiable)

Tailwind v4 + shadcn-style primitives. Migration complete; the
inline-style fallback no longer exists.

### 6.1 Styling

- **Tailwind utilities are the default.** Use the `@theme`-mapped tokens
  (`bg-bg`, `bg-surface`, `bg-surface-raised`, `text-fg`, `text-fg-muted`,
  `text-fg-subtle`, `border-border`, `border-border-strong`, `text-accent`,
  `bg-success`, etc.).
- **No inline `style={{…}}`** in screens or shell. The only exceptions are
  dynamic numeric / color values that can't be expressed as classes —
  e.g. agent hue colors from `lib/types.ts::COUNCIL_AGENT_HUES`,
  animation delays, per-row opacity in skeletons. Rare and documented.
- Design tokens live in `app/globals.css` only inside the `@theme inline`
  block. Tailwind utilities resolve them directly.

### 6.2 Card variants

`components/ui/card.tsx` exposes a `variant` prop. Use the right one:

| Variant | When | Look |
|---|---|---|
| `surface` (default) | tables, panels, content groupings, info cards | flat `bg-surface` + `border-border` |
| `stat` | metric tiles only (counts, gauges) | subtle radial glow via `glowColor` prop |
| `action` | clickable connector cards, source tiles, kickoff cards | raised `bg-surface-raised`, stronger border, hover affordance |
| `glass` | premium frosted panels | `bg-surface-glass` + `backdrop-blur-xl` + subtle glow |
| `glassAction` | interactive premium cards | glass treatment plus hover lift / stronger affordance |
| `ghost` | inline groupings with no chrome | no bg, no border |

Do **not** wrap every screen section in a glow card. Most screens should
be flat surfaces with focused use of `stat` for emphasis.

### 6.3 Icons

- **Brand / connector icons:** `@icons-pack/react-simple-icons` via the
  `BrandIcon` wrapper in `components/icons/BrandIcon.tsx`. Never emoji
  or hand-drawn glyphs for GitHub, etc.
- **UI affordances:** lucide-react (`Search`, `ChevronRight`, `Plus`,
  `RefreshCw`, `Hexagon`, `Users`, `BookOpen`, …).

### 6.4 Color identity

- Accent `#40D389` · Success `#4DD4AC` · Warning `#E8B86B` ·
  Danger `#F26D6D` · High `#FF9159` · Violet `#8AB4FF`
- Connector state, severity tiers, and the confidence ramp use these
  same hues. Per-agent hex values live in `lib/types.ts`
  (`COUNCIL_AGENT_HUES`).

### 6.5 Typography (canonical scale)

Inter for UI, JetBrains Mono for paths/IDs/timestamps/stats. Both loaded
via `next/font/google` in `app/layout.tsx`. Tailwind's `font-sans` and
`font-mono` resolve to these via `@theme inline`.

**These are the ONLY text sizes allowed.** Use the components in
`components/ui/typography.tsx`, not raw `<h1>` / `text-*`:

| Size | Use | Component |
|---|---|---|
| `text-2xl` 24px | Page titles | `<H1>` |
| `text-xl` 20px | Major sections | `<H2>` |
| `text-base` 16px | Body, buttons, table cells, card titles | `<Body>`, `<H3>` |
| `text-sm` 14px | Descriptions, mono paths, muted text | `<Muted>`, `<Subtle>`, `<Code>` |
| `text-xs` 12px | Section labels, badges, dense metadata | `<SectionLabel>`, `<Small>` |

No `text-[10px]`, no `text-[11px]`, no raw `<h1>/<h2>/<h3>`, no `text-lg`.
Enforced by:

```bash
grep -rn 'text-\[1[01]px\]\|<h1\|<h2\|<h3' components/screens components/shell app/ \
  | grep -v 'components/ui/typography.tsx'   # must be empty
```

### 6.6 Page layout primitives

`components/ui/page.tsx`:

- `<PageHeader>` — fixed 56px header, `border-b`, full-width responsive padding
  row. Do not center this region; it is navigation chrome, not page
  content. Header `H1` text is compacted to `text-xl` at the primitive
  level; header buttons/links use compact `text-xs` treatment.
- `<PageBody>` — scrollable full-width centered content region with only
  responsive horizontal padding, `py-8 space-y-8`.
- `<PageGrid>` — 12-column grid (`grid-cols-12 gap-6`).

**Exceptions:** `Skills` and `CouncilSession` keep their custom
2-/3-pane bodies (full-bleed below the header).

### 6.7 Connector scope

The UI follows the backend connector truth. The currently wired source sync
types are **GitHub**, **filesystem / local filesystem**, **Jira**, and
**Confluence**. Do not document or expose connector types beyond the backend
sync pipeline.

Product onboarding (`/new`) is intentionally narrower than Sources: it creates
the product plus a required GitHub source using a product service-account PAT
and one or more GitHub repo URLs. Jira, Confluence, and filesystem sources are
configured later from Sources; they are not onboarding fields in v1.

### 6.8 Ingestion progress UX

`components/sources/IngestionProgress.tsx` is the single source of
truth for "we are reading your code right now."

- Consumes the SSE stream at `sourceLogUrl(productId, sourceId)`.
- Renders the `Progress` bar from structured `progress` events
  (`done`/`total`/`pct`).
- Auto-retries the sync once on `level=warn` events (covers the
  llama-server embed-token-limit hint cleanly without bothering the user).
- Shows per-level icons (›/✓/✗/⚠).

The Dashboard does **not** host live ingestion content. If sources are
syncing, the Dashboard shows a single inline strip that links into
Sources.

### 6.9 Skeletons + empty states

- `components/skeletons/` holds `SourcesSkeleton`, `SkillsSkeleton`,
  `DashboardSkeleton`, `TableSkeleton`. Each major route also has a
  `loading.tsx` next to its `page.tsx`.
- `app/not-found.tsx` and `app/error.tsx` are custom 404 + error
  boundaries that match the design system.
- Append `?loading=1` to a URL to preview the skeleton state.

### 6.10 Server vs client components

Page components stay server components by default. `'use client'` is
only on files that need interaction state, effects, browser APIs, or
a Radix primitive that internally uses hooks.

### 6.11 Keyboard shortcuts

Global handler in `components/shell/Shell.tsx`. Ignores key events from
inputs / textareas / contentEditable; suspends `g`-sequence while the
palette or help dialog owns the keyboard.

| Keys | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Toggle command palette |
| `?` | Toggle the shortcuts help dialog |
| `Esc` | Close palette / help |
| `g h` | Products (`/`) |
| `g n` | New product (`/new`) |
| `g a` | Ask (product-scoped) |
| `g i` | Ingest (product-scoped) |
| `g c` | Council |
| `g r` | Review |
| `g k` | Skill |
| `g s` | Sources |
| `g m` | Setup client |

`g`-prefix is Vim-style with an 800ms window. All product-scoped
shortcuts resolve against the current product (`/p/${currentProductId}/…`).

### 6.12 Command palette glass treatment

Convention from Linear / Vercel / cmdk: **blurred, dimmed backdrop** with
a **crisp, near-solid elevated panel** floating on top.

- **Overlay:** `bg-black/55 backdrop-blur-md` — produces the glassy depth.
- **Panel:** `bg-surface-raised` (solid, opaque) + `border-border-strong`
  + `shadow-2xl shadow-black/80` + a faint `ring-inset ring-white/[0.05]`
  top sheen.

**Critical — do NOT make the panel translucent.** Glass-on-blur looks
muddy: with a blurred backdrop the panel must be a clean solid surface.

This blur treatment is **reserved for the command palette** — regular
cards and dialogs stay flat (see 6.2).

## 7. RBAC personas

Three personas backed by the registry users table. UI-side they surface
as the `permissions` block on `/me`:

```ts
interface Permissions {
  canManageSources: boolean
  canRunCouncil: boolean
  canOnboard: boolean
  isOrgAdmin: boolean
  settingsReadOnly: boolean
}
```

The UI gates affordances on these flags (e.g. "New product" button on
ProductSwitcher only shows when `canOnboard`). There's no separate
settings screen — `settingsReadOnly` was for the deleted Settings
route.

## 8. Where to find things

| What | Where |
|---|---|
| Design tokens | `app/globals.css` (`@theme inline`) |
| UI primitives (Button, Card, Badge, …) | `components/ui/` |
| Shell (TopBar, SideNav, palette, ProductSwitcher) | `components/shell/` |
| Screen components (one per route) | `components/screens/` |
| Brand icons | `components/icons/BrandIcon.tsx` |
| Agent hues + labels + roster fallback | `lib/types.ts` (`COUNCIL_AGENT_HUES`, `COUNCIL_AGENT_LABELS`, `COUNCIL_ROSTER`) |
| API client (one fn per endpoint) | `lib/api/index.ts` |
| Domain types | `lib/types.ts` |
| Product context hook | `lib/product-context.tsx` (`useProduct()`) |

## 9. What to do when in doubt

1. Re-read the invariants in §3.
2. Check if the IA in §4 already has a spot for what you want.
3. Search the existing screen for the closest analogue — match its
   structure and primitives.
4. If you find yourself wanting a new top-level route, push back. The
   IA is locked.

## 10. Out of scope (do not build)

- Cross-product views or rollups.
- A separate Assistant chat surface (`/p/[product]/assistant`). Keep
  `/p/[product]/ask` as the source-grounded product Q&A workspace.
- An Org Library / Adopted Standards section.
- A cross-product composition graph on the skill detail page (`composes_with`
  is gone; `related` stays inside the product pack).
- Settings / Org Settings / Activity / Proposals power-user routes.
- Anything that bypasses the council → review → approve loop.
