<p align="center">
  <img src="./public/anvay-logo-v2-light.svg" alt="Anvay" width="280">
</p>

# Anvay UI

Next.js 16 (App Router, TypeScript) web interface for
[Anvay](../anvay) — the MCP-native context engine.

## Quick start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Authenticated console routes require the Anvay backend running at
`http://localhost:8000`. Public routes (`/landing`, `/docs`, `/login`, and
`/request-access`) render without backend auth bootstrap; login and access
request forms contact the backend only on submit. See
[`../anvay/README.md`](../anvay/README.md) for backend setup.

Public docs are fetched from Tina Cloud at request time. Set:

```bash
NEXT_PUBLIC_TINA_CLIENT_ID=...
TINA_TOKEN=...
TINA_BRANCH=main
NEXT_PUBLIC_TINA_ADMIN_URL=https://app.tina.io/...
```

## Public docs content flow

`anvay-ui` renders docs, but it does not own docs content. Public docs content
lives in the separate `0xaeres/anvay-docs` repository and is fetched from Tina
Cloud server-side by `/docs` and `/docs/[...slug]`.

This split keeps public/docs routes backend-independent: if `ANVAY_API_URL` is
down, `/landing`, `/docs`, `/login`, and `/request-access` still render. Only
login and request-access form submits contact the backend.

The docs publishing flow is:

1. Treat `../anvay` as the implementation truth.
2. For bulk refreshes, run `npm run docs:seed-tina`; this writes Tina-ready MDX
   to ignored `.tina-seed/docs/`.
3. Review and copy the curated MDX into `../anvay-docs/content/docs/`.
4. Commit and push `../anvay-docs`.
5. Tina Cloud indexes `main`.
6. `anvay-ui` fetches the indexed content at runtime with `TINA_TOKEN`.

Use the Tina **Content (Readonly)** token for `TINA_TOKEN`; do not use the
Search token. Do not commit `.env`, `public/admin/`, or generated Tina clients
that embed tokens.

## Routes

All product-scoped routes live under `/p/[product]/...`.

| Route | Screen |
|---|---|
| `/` | `ProjectsDashboard` — org-wide product list |
| `/landing` | Public product overview |
| `/docs` | Public Tina Cloud-backed docs |
| `/setup` | First-run skills-repo bootstrap |
| `/new` | Create a product |
| `/p/[product]/dashboard` | Pipeline cards + pending proposals + recent activity |
| `/p/[product]/sources` | Source list |
| `/p/[product]/sources/new` | Add a source (GitHub, filesystem, Jira, or Confluence) |
| `/p/[product]/sources/[name]` | Source detail + live SSE sync log |
| `/p/[product]/ingest` | Stage gate at the ingest phase |
| `/p/[product]/council` | Session list + start dialog |
| `/p/[product]/council/[id]` | Live deliberation and draft pack preview |
| `/p/[product]/review` | Proposal approve / reject / edit |
| `/p/[product]/skill` | Stage gate at the terminal-skill phase |
| `/p/[product]/skills` | Skill list + detail pane |
| `/p/[product]/skills/[id]` | Full skill detail (provenance, corrections, rejections, history) |

## Design system

Product onboarding creates a product-scoped GitHub source with a product
service-account PAT and one or more repo URLs. Business unit is optional display
metadata (`owner.team`) only. GitHub onboarding stays narrow; filesystem,
Jira, and Confluence are configured later from Sources.

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
npm run cms:build       # generate Tina admin/client artifacts
npm run docs:seed-tina  # write ignored Tina-ready imports from ../anvay docs
```

## Performance checks

```bash
npm run build
npm run perf:budget
npm run perf:lhci
```

See [`PERFORMANCE.md`](./PERFORMANCE.md) for Lighthouse CI, bundle analysis,
and clean Chrome trace capture notes.
