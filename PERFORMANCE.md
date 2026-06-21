# Nexus UI Performance

Performance checks run against production builds only. Dev-mode traces include
Next devtools, HMR, unminified chunks, and local browser extensions, so they are
useful for clues but not for release gates.

## Commands

```bash
npm run build
npm run perf:budget
npm run perf:bundle
npm run perf:lhci
```

- `perf:budget` reads `.next/diagnostics/route-bundle-stats.json` and fails
  hard caps.
- `perf:bundle` writes the Turbopack analyzer to `.next/diagnostics/analyze`.
- `perf:lhci` starts `next start` on port `3005` and audits the configured
  Lighthouse CI routes.

Local Lighthouse runs require Chrome or Chromium installed. GitHub-hosted
Ubuntu runners provide Chrome for the CI gate.

## Chrome Trace Capture

1. Run `npm run build && npm run start -- --port 3005`.
2. Open Chrome with a fresh profile or incognito window.
3. Disable extensions.
4. Record against `http://localhost:3005`, not `next dev`.
5. Capture both initial load and the interaction path being investigated.

## Budgets

Hard caps keep today from regressing:

- `/`: `<= 1900 KB` first-load JS.
- Product routes: `<= 760 KB` first-load JS.
- Public/auth routes: `<= 725 KB` first-load JS.

Target caps guide follow-up optimization:

- `/`: `<= 900 KB`.
- Product/public routes: `<= 600 KB`.
