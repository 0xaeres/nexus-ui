import type { DocNavGroup, DocNavItem, DocPage, DocsResult } from './types'

const TINA_API_VERSION = 'v1'
const DEFAULT_REVALIDATE_SECONDS = 60

type TinaDocNode = {
  title?: string | null
  description?: string | null
  slug?: string | null
  group?: string | null
  order?: number | null
  body?: string | null
  sourceLabel?: string | null
  editUrl?: string | null
  _sys?: {
    filename?: string | null
    relativePath?: string | null
  } | null
}

type TinaDocsResponse = {
  data?: {
    docConnection?: {
      edges?: Array<{ node?: TinaDocNode | null } | null> | null
    } | null
  }
  errors?: Array<{ message?: string }>
}

const DOCS_QUERY = `
  query AnvayDocs {
    docConnection {
      edges {
        node {
          title
          description
          slug
          group
          order
          body
          sourceLabel
          editUrl
          _sys {
            filename
            relativePath
          }
        }
      }
    }
  }
`

function tinaConfig() {
  const clientId = process.env.TINA_CLIENT_ID || process.env.NEXT_PUBLIC_TINA_CLIENT_ID || ''
  const token = process.env.TINA_TOKEN || ''
  const branch =
    process.env.TINA_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.HEAD ||
    'main'
  return { clientId, token, branch }
}

function tinaUrl() {
  const { clientId, branch } = tinaConfig()
  if (!clientId || !branch) return ''
  return `https://content.tinajs.io/${TINA_API_VERSION}/content/${clientId}/github/${encodeURIComponent(branch)}`
}

function normalizeSlug(node: TinaDocNode) {
  const raw = node.slug || node._sys?.filename || 'index'
  return raw
    .replace(/\.mdx?$/i, '')
    .replace(/^\/+|\/+$/g, '')
}

function navGroups(pages: DocPage[]): DocNavGroup[] {
  const byGroup = new Map<string, DocNavItem[]>()
  for (const page of pages) {
    const items = byGroup.get(page.group) ?? []
    items.push({
      slug: page.slug,
      title: page.title,
      description: page.description,
      group: page.group,
      order: page.order,
      body: page.body,
    })
    byGroup.set(page.group, items)
  }

  return Array.from(byGroup.entries()).map(([label, items]) => ({
    label,
    items: items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
  }))
}

function normalizeDocs(payload: TinaDocsResponse): DocPage[] {
  return (payload.data?.docConnection?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is TinaDocNode => Boolean(node?.title))
    .map((node) => ({
      slug: normalizeSlug(node),
      title: String(node.title),
      description: node.description ?? '',
      group: node.group || 'Guides',
      order: node.order ?? 999,
      body: node.body ?? '',
      sourceLabel: node.sourceLabel || node._sys?.relativePath || '',
      editUrl: node.editUrl || '',
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

export function docsEditUrl(page?: DocPage | null) {
  if (page?.editUrl) return page.editUrl
  return process.env.NEXT_PUBLIC_TINA_ADMIN_URL || '/admin/index.html'
}

export async function getDocs(): Promise<DocsResult> {
  const { token } = tinaConfig()
  const url = tinaUrl()
  if (!url || !token) {
    return {
      ok: false,
      message:
        'Tina Cloud is not configured. Set NEXT_PUBLIC_TINA_CLIENT_ID, TINA_TOKEN, and TINA_BRANCH to load documentation.',
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': token,
      },
      body: JSON.stringify({ query: DOCS_QUERY, variables: {} }),
      next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      return { ok: false, message: `Tina Cloud returned ${response.status}. Documentation is unavailable.` }
    }

    const payload = (await response.json()) as TinaDocsResponse
    if (payload.errors?.length) {
      return { ok: false, message: payload.errors.map((error) => error.message).filter(Boolean).join(' ') }
    }

    const pages = normalizeDocs(payload)
    if (!pages.length) {
      return { ok: false, message: 'No documentation pages are published in Tina Cloud yet.' }
    }
    return { ok: true, pages, groups: navGroups(pages) }
  } catch {
    return { ok: false, message: 'Tina Cloud is unreachable. Documentation is unavailable.' }
  }
}

export function findDocPage(pages: DocPage[], slugParts?: string[]) {
  if (slugParts?.length) {
    const requestedSlug = slugParts.join('/')
    const legacyAliases: Record<string, string> = {
      agents: 'concepts',
      engineering: 'concepts',
      'product-system-intelligence': 'concepts',
    }
    const slug = legacyAliases[requestedSlug] ?? requestedSlug
    return pages.find((page) => page.slug === slug) ?? null
  }
  return pages.find((page) => page.slug === 'index') ?? pages[0] ?? null
}
