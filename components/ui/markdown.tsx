import type { ReactNode } from 'react'
import Link from 'next/link'
import { MermaidDiagram } from '@/components/docs/MermaidDiagram'
import { Body, Code, H2, H3 } from '@/components/ui/typography'
import { slugifyHeading } from '@/lib/docs/markdown'
import { cn } from '@/lib/utils'

type Block =
  | { type: 'code'; content: string; lang: string }
  | { type: 'heading'; depth: number; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'rule' }
  | { type: 'paragraph'; content: string }

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'rule' })
      i += 1
      continue
    }

    const fence = line.match(/^```(\S*)\s*$/)
    if (fence) {
      const lang = fence[1] ?? ''
      const code: string[] = []
      i += 1
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i])
        i += 1
      }
      if (i < lines.length) i += 1
      blocks.push({ type: 'code', lang, content: code.join('\n') })
      continue
    }

    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(lines[i + 1])
    ) {
      const headers = splitTableRow(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]))
        i += 1
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      blocks.push({
        type: 'heading',
        depth: heading[1].length,
        content: heading[2].trim(),
      })
      i += 1
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i += 1
      }
      blocks.push({ type: 'quote', content: quote.join(' ') })
      continue
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/)
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/)
    if (unordered || ordered) {
      const items: string[] = []
      const isOrdered = Boolean(ordered)
      const matcher = isOrdered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*]\s+(.+)$/
      while (i < lines.length) {
        const item = lines[i].match(matcher)
        if (!item) break
        items.push(item[1].trim())
        i += 1
      }
      blocks.push({ type: 'list', ordered: isOrdered, items })
      continue
    }

    const paragraph: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i].trim())
      i += 1
    }
    blocks.push({ type: 'paragraph', content: paragraph.join(' ') })
  }

  return blocks
}

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = text
  let key = 0

  const pushText = (value: string) => {
    if (value) nodes.push(value)
  }

  while (rest.length > 0) {
    const candidates = [
      { type: 'code', index: rest.indexOf('`') },
      { type: 'bold', index: rest.indexOf('**') },
      { type: 'link', index: rest.indexOf('[') },
      { type: 'italic', index: rest.indexOf('*') },
    ].filter((candidate) => candidate.index >= 0)
      .sort((a, b) => a.index - b.index)

    const next = candidates[0]
    if (!next) {
      pushText(rest)
      break
    }

    pushText(rest.slice(0, next.index))
    rest = rest.slice(next.index)

    if (next.type === 'code') {
      const end = rest.indexOf('`', 1)
      if (end < 0) {
        pushText(rest)
        break
      }
      nodes.push(
        <Code key={`${keyPrefix}-code-${key}`} className="rounded-sm bg-bg-active px-1 py-0.5 text-xs">
          {rest.slice(1, end)}
        </Code>,
      )
      rest = rest.slice(end + 1)
    } else if (next.type === 'bold') {
      const end = rest.indexOf('**', 2)
      if (end < 0) {
        pushText(rest)
        break
      }
      nodes.push(
        <strong key={`${keyPrefix}-strong-${key}`} className="font-semibold text-fg">
          {parseInline(rest.slice(2, end), `${keyPrefix}-strong-${key}`)}
        </strong>,
      )
      rest = rest.slice(end + 2)
    } else if (next.type === 'link') {
      const labelEnd = rest.indexOf('](')
      const hrefEnd = labelEnd >= 0 ? rest.indexOf(')', labelEnd + 2) : -1
      if (labelEnd < 0 || hrefEnd < 0) {
        pushText(rest[0])
        rest = rest.slice(1)
      } else {
        const href = rest.slice(labelEnd + 2, hrefEnd).trim()
        const label = rest.slice(1, labelEnd)
        const allowed = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/') || href.startsWith('#')
        if (allowed) {
          nodes.push(
            <Link
              key={`${keyPrefix}-link-${key}`}
              href={href}
              className="text-accent underline decoration-border-strong underline-offset-4 hover:text-accent-hover"
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {parseInline(label, `${keyPrefix}-link-${key}`)}
            </Link>,
          )
        } else {
          pushText(label)
        }
        rest = rest.slice(hrefEnd + 1)
      }
    } else {
      const end = rest.indexOf('*', 1)
      if (end < 0) {
        pushText(rest)
        break
      }
      nodes.push(
        <em key={`${keyPrefix}-em-${key}`} className="italic text-fg">
          {parseInline(rest.slice(1, end), `${keyPrefix}-em-${key}`)}
        </em>,
      )
      rest = rest.slice(end + 1)
    }
    key += 1
  }

  return nodes
}

const CODE_TOKEN_RE = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*|#.*|\b(?:async|await|class|const|def|elif|else|export|finally|for|from|function|if|import|in|interface|let|return|try|type|while)\b|\b(?:false|null|none|true|undefined)\b|\b\d+(?:\.\d+)?\b)/gi

function highlightCodeLine(line: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let index = 0
  for (const match of line.matchAll(CODE_TOKEN_RE)) {
    const token = match[0]
    const start = match.index ?? 0
    if (start > last) nodes.push(line.slice(last, start))
    const lower = token.toLowerCase()
    const className =
      token.startsWith('"') || token.startsWith("'") || token.startsWith('`')
        ? 'text-success'
        : token.startsWith('//') || token.startsWith('#')
          ? 'text-fg-subtle'
          : /^\d/.test(token)
            ? 'text-warning'
            : ['false', 'null', 'none', 'true', 'undefined'].includes(lower)
              ? 'text-violet'
              : 'text-accent'
    nodes.push(
      <span key={`${keyPrefix}-${index}`} className={className}>
        {token}
      </span>,
    )
    last = start + token.length
    index += 1
  }
  if (last < line.length) nodes.push(line.slice(last))
  return nodes.length ? nodes : [line]
}

function CodeBlock({
  content,
  lang,
  compact,
}: {
  content: string
  lang: string
  compact: boolean
}) {
  const label = lang || 'code'
  const lines = content.split('\n')
  return (
    <div className="overflow-hidden rounded-md border border-border bg-bg-active">
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-1.5">
        <span className="font-mono text-xs uppercase text-fg-subtle">{label}</span>
      </div>
      <pre
        className={cn(
          'm-0 overflow-x-auto p-3 font-mono text-sm leading-relaxed text-fg-muted',
          compact && 'max-h-48 text-xs',
        )}
      >
        <code>
          {lines.map((line, lineIndex) => (
            <span key={`line-${lineIndex}`} className="block min-h-[1.5em]">
              {highlightCodeLine(line, `line-${lineIndex}`)}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

export function MarkdownContent({
  children,
  className,
  compact = false,
}: {
  children: string
  className?: string
  compact?: boolean
}) {
  const blocks = parseBlocks(children)
  const headingCounts = new Map<string, number>()

  return (
    <div className={cn('flex flex-col gap-3 text-fg', compact && 'gap-2', className)}>
      {blocks.map((block, index) => {
        const key = `md-${index}`
        if (block.type === 'code') {
          if (block.lang.toLowerCase() === 'mermaid') {
            return <MermaidDiagram key={key} chart={block.content} />
          }
          return <CodeBlock key={key} content={block.content} lang={block.lang} compact={compact} />
        }
        if (block.type === 'heading') {
          const baseId = slugifyHeading(block.content)
          const indexesHeading = block.depth === 2 || block.depth === 3
          const count = indexesHeading ? headingCounts.get(baseId) ?? 0 : 0
          if (indexesHeading) headingCounts.set(baseId, count + 1)
          const id = count ? `${baseId}-${count + 1}` : baseId
          return block.depth <= 2 ? (
            <H2 key={key} id={id} className={cn('scroll-mt-20 border-l-2 border-accent pl-3', compact && 'text-base')}>{parseInline(block.content, key)}</H2>
          ) : (
            <H3 key={key} id={id} className="scroll-mt-20">{parseInline(block.content, key)}</H3>
          )
        }
        if (block.type === 'table') {
          return (
            <div key={key} className="overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-left text-base">
                <thead className="bg-accent-soft">
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th
                        key={`${key}-head-${headerIndex}`}
                        className="border-b border-border px-4 py-3 font-medium text-fg"
                      >
                        {parseInline(header, `${key}-head-${headerIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${key}-row-${rowIndex}`} className="border-b border-border last:border-b-0">
                      {block.headers.map((_, cellIndex) => (
                        <td key={`${key}-cell-${rowIndex}-${cellIndex}`} className="px-4 py-3 text-fg-muted">
                          {parseInline(row[cellIndex] ?? '', `${key}-cell-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === 'rule') {
          return <div key={key} className="h-px bg-border" />
        }
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List
              key={key}
              className={cn(
                'm-0 flex flex-col gap-2 pl-6 text-base leading-relaxed text-fg-muted',
                block.ordered ? 'list-decimal' : 'list-disc',
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-item-${itemIndex}`}>{parseInline(item, `${key}-item-${itemIndex}`)}</li>
              ))}
            </List>
          )
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="m-0 rounded-r-md border-l-2 border-accent bg-accent-soft px-4 py-3 text-base leading-relaxed text-fg-muted">
              {parseInline(block.content, key)}
            </blockquote>
          )
        }
        return (
          <Body key={key} className={cn('text-base leading-loose text-fg-muted', compact && 'text-sm')}>
            {parseInline(block.content, key)}
          </Body>
        )
      })}
    </div>
  )
}
