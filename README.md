# Nexus UI

Next.js 16 (App Router, TypeScript) web interface for
[Nexus](../nexus) — the sovereign, MCP-native context engine.

## Quick start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Requires the Nexus backend running at `http://localhost:8000`. See
[`../nexus/README.md`](../nexus/README.md) for backend setup.

## Routes

All product-scoped routes live under `/p/[product]/...`.

| Route | Screen |
|---|---|
| `/` | `ProjectsDashboard` — org-wide product list |
| `/setup` | First-run skills-repo bootstrap |
| `/new` | Create a product |
| `/p/[product]/dashboard` | Pipeline cards + pending proposals + recent activity |
| `/p/[product]/sources` | Source list |
| `/p/[product]/sources/new` | Add a source (GitHub or local filesystem) |
| `/p/[product]/sources/[name]` | Source detail + live SSE sync log |
| `/p/[product]/ingest` | Stage gate at the ingest phase |
| `/p/[product]/council` | Session list + start dialog |
| `/p/[product]/council/[id]` | Live 3-pane deliberation (Drafter / Critic / Reviser) |
| `/p/[product]/review` | Proposal approve / reject / edit |
| `/p/[product]/skill` | Stage gate at the terminal-skill phase |
| `/p/[product]/skills` | Skill list + detail pane |
| `/p/[product]/skills/[id]` | Full skill detail (provenance, corrections, rejections, history) |

## Design system

Product onboarding creates a product-scoped GitHub source with a product
service-account PAT and one or more repo URLs. Business unit is optional display
metadata (`owner.team`) only. Confluence/Jira are configured later from Sources
once their connectors are implemented.

Tailwind v4 + shadcn-style primitives + lucide-react + simple-icons. Full
rules in [`DESIGN.md`](./DESIGN.md).

## Key files

| What | Where |
|---|---|
| Design rules + mental model | `DESIGN.md` |
| Agent / coding context | `AGENTS.md` |
| Design tokens | `app/globals.css` (`@theme inline` block) |
| UI primitives (Button, Card, Badge, …) | `components/ui/` |
| Shell (TopBar, SideNav, command palette) | `components/shell/` |
| Screen components | `components/screens/` |
| API client | `lib/api/index.ts` |
| Shared types | `lib/types.ts` |

## Build + type-check

```bash
npm run build           # production build (also type-checks)
```
