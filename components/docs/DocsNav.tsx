'use client'

import Link from 'next/link'
import Fuse from 'fuse.js'
import { FileText, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { slugifyHeading } from '@/lib/docs/markdown'
import type { DocNavGroup, DocNavItem } from '@/lib/docs/types'
import { cn } from '@/lib/utils'

type SearchEntry = DocNavItem & {
  href: string
  section: string
  sectionId: string
  text: string
}

type SearchResult = SearchEntry & {
  titleRanges: Array<[number, number]>
  sectionRanges: Array<[number, number]>
  textRanges: Array<[number, number]>
}

function searchEntries(groups: DocNavGroup[]) {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => {
      const href = item.slug === 'index' ? '/docs' : `/docs/${item.slug}`
      const entries: SearchEntry[] = [{
        ...item,
        group: group.label,
        href,
        section: item.title,
        sectionId: '',
        text: item.description,
      }]
      let section = item.title
      let sectionId = ''
      const paragraph: string[] = []
      let inFence = false

      const flush = () => {
        const text = paragraph.join(' ').replace(/\s+/g, ' ').trim()
        if (text) entries.push({ ...item, group: group.label, href, section, sectionId, text })
        paragraph.length = 0
      }

      for (const line of item.body.replace(/\r\n/g, '\n').split('\n')) {
        if (/^```/.test(line)) {
          inFence = !inFence
          flush()
          continue
        }
        if (inFence) continue
        const heading = line.match(/^#{2,3}\s+(.+)$/)
        if (heading) {
          flush()
          section = heading[1].replace(/\s+#*$/, '').trim()
          sectionId = slugifyHeading(section)
          continue
        }
        if (/^\s*\|?[-:| ]+\|?\s*$/.test(line)) continue
        if (!line.trim()) {
          flush()
          continue
        }
        paragraph.push(
          line
            .replace(/^\s*(?:[-*]|\d+\.)\s+/, '')
            .replace(/[`*_>#]/g, '')
            .trim(),
        )
      }
      flush()
      return entries
    }),
  )
}

function contextSnippet(text: string, ranges: Array<[number, number]>, maxLength = 180) {
  const first = ranges[0]?.[0] ?? 0
  const start = Math.max(0, first - Math.floor(maxLength / 3))
  const end = Math.min(text.length, start + maxLength)
  const adjustedStart = start > 0 ? Math.max(0, text.lastIndexOf(' ', start)) : 0
  const adjustedEnd = end < text.length ? text.indexOf(' ', end) : text.length
  return {
    text: `${adjustedStart > 0 ? '…' : ''}${text.slice(adjustedStart, adjustedEnd > 0 ? adjustedEnd : end).trim()}${end < text.length ? '…' : ''}`,
    sourceStart: adjustedStart,
    prefixLength: adjustedStart > 0 ? 1 : 0,
  }
}

function exactRange(value: string, needle: string): Array<[number, number]> {
  const index = value.toLowerCase().indexOf(needle.toLowerCase())
  return index >= 0 ? [[index, index + needle.length - 1]] : []
}

function HighlightedText({
  text,
  ranges,
}: {
  text: string
  ranges: Array<[number, number]>
}) {
  const readableRanges = ranges
    .slice()
    .sort((a, b) => a[0] - b[0])
    .reduce<Array<[number, number]>>((merged, range) => {
      const previous = merged.at(-1)
      if (previous && range[0] <= previous[1] + 2) {
        previous[1] = Math.max(previous[1], range[1])
      } else {
        merged.push([...range])
      }
      return merged
    }, [])
    .filter(([start, end]) => end - start >= 1)
    .slice(0, 4)

  if (!readableRanges.length) return text
  const nodes: ReactNode[] = []
  let cursor = 0
  readableRanges
    .forEach(([start, end], index) => {
      if (start > cursor) nodes.push(text.slice(cursor, start))
      nodes.push(
        <mark key={`${start}-${end}-${index}`} className="rounded-sm bg-accent-soft px-0.5 text-accent">
          {text.slice(start, end + 1)}
        </mark>,
      )
      cursor = Math.max(cursor, end + 1)
    })
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

export function DocsNav({
  groups,
  activeSlug,
}: {
  groups: DocNavGroup[]
  activeSlug: string
}) {
  const [query, setQuery] = useState('')
  const [activeResult, setActiveResult] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const commandSearch = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (commandSearch) {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        return
      }

      const target = event.target as HTMLElement | null
      const inField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target?.isContentEditable ?? false)
      if (inField) return
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const entries = useMemo(() => searchEntries(groups), [groups])
  const searchIndex = useMemo(() => {
    return new Fuse(entries, {
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeMatches: true,
      includeScore: true,
      keys: [
        { name: 'title', weight: 0.35 },
        { name: 'section', weight: 0.3 },
        { name: 'text', weight: 0.25 },
        { name: 'group', weight: 0.1 },
      ],
    })
  }, [entries])

  const results = useMemo<SearchResult[]>(() => {
    const needle = query.trim()
    if (!needle) return []
    const lower = needle.toLowerCase()
    const exact = entries
      .map((entry) => {
        const haystack = `${entry.title} ${entry.section} ${entry.text}`
        const index = haystack.toLowerCase().indexOf(lower)
        return index >= 0 ? { entry, index } : null
      })
      .filter((match): match is { entry: SearchEntry; index: number } => Boolean(match))
      .sort((a, b) => a.index - b.index)

    const fuzzy = searchIndex.search(needle)
    const combined = new Map<string, SearchResult>()

    for (const { entry } of exact) {
      combined.set(entry.slug, {
        ...entry,
        titleRanges: exactRange(entry.title, needle),
        sectionRanges: exactRange(entry.section, needle),
        textRanges: exactRange(entry.text, needle),
      })
    }

    for (const result of fuzzy) {
      if (combined.has(result.item.slug)) continue
      const matchRanges = (key: string) =>
        (result.matches?.find((match) => match.key === key)?.indices ?? []) as Array<[number, number]>
      combined.set(result.item.slug, {
        ...result.item,
        titleRanges: matchRanges('title'),
        sectionRanges: matchRanges('section'),
        textRanges: matchRanges('text'),
      })
    }

    return Array.from(combined.values()).slice(0, 8)
  }, [entries, query, searchIndex])

  useEffect(() => setActiveResult(0), [query])

  const openResult = (result: SearchResult | undefined) => {
    if (!result) return
    setQuery('')
    router.push(`${result.href}${result.sectionId ? `#${result.sectionId}` : ''}`)
  }

  return (
    <nav className="flex flex-col gap-5" aria-label="Documentation">
      <div className="relative">
        <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && results.length) {
              event.preventDefault()
              setActiveResult((index) => (index + 1) % results.length)
            } else if (event.key === 'ArrowUp' && results.length) {
              event.preventDefault()
              setActiveResult((index) => (index - 1 + results.length) % results.length)
            } else if (event.key === 'Enter') {
              event.preventDefault()
              openResult(results[activeResult])
            } else if (event.key === 'Escape') {
              event.preventDefault()
              setQuery('')
              searchRef.current?.blur()
            }
          }}
          placeholder="Search docs"
          className="h-10 w-full rounded-md border border-border-strong bg-surface pl-9 pr-20 text-base text-fg shadow-card outline-none placeholder:text-fg-subtle focus-visible:border-accent"
          type="search"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 font-mono text-xs text-fg-subtle">
          <span className="rounded border border-border px-1.5 py-0.5">⌘K</span>
          <span className="rounded border border-border px-1.5 py-0.5">/</span>
        </span>
        </label>

        {query ? (
          <div
            className="absolute left-0 right-0 top-12 z-40 max-h-[min(32rem,70vh)] overflow-auto rounded-md border border-border-strong bg-surface-raised p-1 shadow-2xl lg:right-auto lg:w-[36rem]"
            role="listbox"
            aria-label="Documentation search results"
          >
            {results.length ? results.map((result, index) => {
              const snippet = contextSnippet(result.text, result.textRanges)
              const snippetRanges = result.textRanges
                .map(([start, end]) => [
                  Math.max(0, start - snippet.sourceStart + snippet.prefixLength),
                  Math.max(0, end - snippet.sourceStart + snippet.prefixLength),
                ] as [number, number])
                .filter(([start]) => start < snippet.text.length)
              return (
                <button
                  key={`${result.slug}-${result.sectionId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeResult}
                  onMouseEnter={() => setActiveResult(index)}
                  onClick={() => openResult(result)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-sm px-3 py-3 text-left',
                    index === activeResult ? 'bg-bg-selected' : 'hover:bg-bg-hover',
                  )}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-medium text-fg">
                        <HighlightedText text={result.title} ranges={result.titleRanges} />
                      </span>
                      {result.section !== result.title ? (
                        <span className="text-xs text-accent">
                          <HighlightedText text={result.section} ranges={result.sectionRanges} />
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 line-clamp-3 block text-xs leading-relaxed text-fg-muted">
                      <HighlightedText text={snippet.text} ranges={snippetRanges} />
                    </span>
                  </span>
                </button>
              )
            }) : (
              <div className="px-3 py-5 text-center text-sm text-fg-muted">
                No docs match “{query}”.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:flex lg:flex-col">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <div className="px-2 font-mono text-xs font-medium uppercase text-accent">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.slug === activeSlug
                return (
                  <Link
                    key={item.slug}
                    href={item.slug === 'index' ? '/docs' : `/docs/${item.slug}`}
                    className={cn(
                      'border-l-2 px-3 py-2 text-sm transition-colors',
                      active
                        ? 'border-accent bg-bg-selected text-fg'
                        : 'border-transparent text-fg-muted hover:border-border-strong hover:bg-bg-hover hover:text-fg',
                    )}
                  >
                    <span className="block font-medium">{item.title}</span>
                    {query ? (
                      <span className="mt-0.5 block text-xs leading-relaxed text-fg-subtle">
                        {item.description}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}
