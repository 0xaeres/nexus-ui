# Nexus UI

Next.js 16 (App Router, TypeScript) web interface for [Nexus](../nexus) — the sovereign, MCP-native skill server for engineering organizations.

## Quick start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Requires the Nexus backend running at `http://localhost:8000`. See [`../nexus/README.md`](../nexus/README.md) for backend setup.

## Architecture

All screens are product-scoped under `/p/[product]/...`:

| Route | Screen |
|---|---|
| `/p/[product]/dashboard` | Pipeline overview, pending proposals, activity |
| `/p/[product]/sources` | Connector instances + ingestion runs |
| `/p/[product]/sources/new` | Add a new source (GitHub / Jira / Confluence) |
| `/p/[product]/sources/[name]` | Source detail + sync log |
| `/p/[product]/council` | Council sessions list + start new session |
| `/p/[product]/council/[sessionId]` | Live deliberation (3-pane, SSE streaming) |
| `/p/[product]/skills` | Skill hierarchy (master pinned, org standards) |
| `/p/[product]/skills/[id]` | Skill detail + composition graph |
| `/p/[product]/assistant` | Conversational + action chat panel (Jira/Confluence) |
| `/p/[product]/activity` | Product-scoped event timeline |
| `/p/[product]/settings` | Product settings (members, models, roster) |
| `/onboarding` | 3-step onboarding wizard (identity → sources → council) |
| `/settings/org` | Org-level settings |

Legacy flat routes (`/dashboard`, `/skills`, etc.) redirect to their `/p/forge/...` equivalents.

## Design system

Tailwind v4 + shadcn-style primitives + lucide-react + simple-icons. Full rules in [`DESIGN.md`](./DESIGN.md).

## Runtime mechanics (sources, council, priors)

UI is wired against the backend contracts described in [`DESIGN.md` §7.1–7.5](./DESIGN.md):

- **§7.1** — delta-only ingestion. Each resync returns `{ added, updated, removed, unchanged }`; the UI shows the three counters per source and in the sync log.
- **§7.2** — change-gated council with a weekly cap per `(product, skill)` and an admin `force: true` override. Dashboard surfaces "next sync / next council eligible".
- **§7.3** — council priors. Sessions are seeded with the current approved skill, a corrections corpus, and a rejection log. The session header shows `Priors loaded · rev N · M corr · K rej`. Two separate revision counters — see §7.3.
- **§7.4** — corrections compaction. Older corrections are folded into a distilled summary; the UI shows both the distilled rules and the recent raw list on skill detail.
- **§7.5** — `EVIDENCE_CHUNKS_PER_SESSION_CAP = 20`, surfaced on the skill provenance row.

## Key files

| What | Where |
|---|---|
| Design rules + mental model | `DESIGN.md` |
| Agent / coding context | `AGENTS.md` |
| Design tokens | `app/globals.css` (`@theme inline` block) |
| UI primitives (Button, Card, Badge, …) | `components/ui/` |
| Shell (TopBar, SideNav, command palette) | `components/shell/` |
| Screen components | `components/screens/` |
| API client hooks | `lib/api/`, `lib/hooks/` |
| Shared types | `lib/types.ts` |

## Type-check

```bash
npx tsc --noEmit
```
