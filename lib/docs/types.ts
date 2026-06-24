export interface DocPage {
  slug: string
  title: string
  description: string
  group: string
  order: number
  body: string
  sourceLabel: string
  editUrl: string
}

export interface DocNavItem {
  slug: string
  title: string
  description: string
  group: string
  order: number
  body: string
}

export interface DocNavGroup {
  label: string
  items: DocNavItem[]
}

export interface DocHeading {
  id: string
  depth: number
  text: string
}

export type DocsResult =
  | { ok: true; pages: DocPage[]; groups: DocNavGroup[] }
  | { ok: false; message: string }
