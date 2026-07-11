/**
 * Canonical external links for the public marketing + docs surface.
 *
 * Anvay is self-hosted and open source (Apache-2.0). The hosted landing/docs
 * site is marketing only — it is not a signup funnel. Visitors deploy their own
 * instance; the auth pages exist for operators who already run one. Keep every
 * "clone / deploy / GitHub" reference pointed here so the public naming can
 * change in one place.
 */
export const GITHUB_ORG = 'https://github.com/0xaeres'

export const REPOS = {
  backend: `${GITHUB_ORG}/anvay-core`,
  ui: `${GITHUB_ORG}/anvay-ui`,
  docs: `${GITHUB_ORG}/anvay-docs`,
} as const

/** Primary "get started" destination for self-hosters. */
export const QUICKSTART_URL = '/docs/quickstart'
