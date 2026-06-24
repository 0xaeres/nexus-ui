import type { DocHeading } from './types'

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function extractHeadings(markdown: string): DocHeading[] {
  const seen = new Map<string, number>()
  const headings: DocHeading[] = []

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (!match) continue
    const text = match[2].replace(/\s+#*$/, '').trim()
    const base = slugifyHeading(text)
    if (!base) continue
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    headings.push({
      id: count ? `${base}-${count + 1}` : base,
      depth: match[1].length,
      text,
    })
  }

  return headings
}
