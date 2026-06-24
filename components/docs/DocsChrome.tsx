import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink } from 'lucide-react'
import { AnvayLogo } from '@/components/icons/AnvayLogo'
import { DocsNav, DocsSearch } from '@/components/docs/DocsNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarkdownContent } from '@/components/ui/markdown'
import { H1, H2, Muted, SectionLabel } from '@/components/ui/typography'
import { docsEditUrl } from '@/lib/docs/tina'
import type { DocHeading, DocNavGroup, DocPage } from '@/lib/docs/types'

function adjacentPages(pages: DocPage[], active: DocPage) {
  const index = pages.findIndex((page) => page.slug === active.slug)
  return {
    previous: index > 0 ? pages[index - 1] : null,
    next: index >= 0 && index < pages.length - 1 ? pages[index + 1] : null,
  }
}

export function DocsUnavailable({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-fg">
      <DocsTopBar />
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-16">
        <div className="rounded-lg border border-border bg-surface p-6 text-center shadow-card">
          <SectionLabel>Docs unavailable</SectionLabel>
          <H2 className="mt-2">Tina Cloud content could not be loaded.</H2>
          <Muted>{message}</Muted>
        </div>
      </div>
    </main>
  )
}

function DocsTopBar({ groups }: { groups?: DocNavGroup[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 w-full max-w-[1440px] flex-wrap items-center gap-3 px-4 py-2 sm:flex-nowrap sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/landing" className="flex items-center gap-2 text-base font-semibold text-fg">
          <AnvayLogo markOnly size="sm" priority />
          <span>Anvay</span>
        </Link>
        <Badge variant="accent" className="font-mono">docs</Badge>
        {groups ? (
          <div className="order-3 mx-auto w-full sm:order-none sm:max-w-xl sm:px-6">
            <DocsSearch groups={groups} />
          </div>
        ) : <div className="flex-1" />}
        <nav className="ml-auto flex shrink-0 items-center gap-3 text-sm text-fg-muted" aria-label="Public">
          <Link href="/landing" className="hover:text-fg">Overview</Link>
          <Link href="/login" className="hover:text-fg">Sign in</Link>
        </nav>
      </div>
    </header>
  )
}

export function DocsChrome({
  page,
  pages,
  groups,
  headings,
}: {
  page: DocPage
  pages: DocPage[]
  groups: DocNavGroup[]
  headings: DocHeading[]
}) {
  const { previous, next } = adjacentPages(pages, page)
  const editUrl = docsEditUrl(page)
  return (
    <main className="min-h-screen bg-bg text-fg">
      <DocsTopBar groups={groups} />
      <div className="mx-auto grid w-full max-w-[1520px] grid-cols-1 gap-0 lg:grid-cols-[300px_minmax(0,1fr)_240px]">
        <aside className="border-b border-border bg-surface-sunk/40 px-4 py-4 lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:overflow-auto lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
          <DocsNav groups={groups} activeSlug={page.slug} />
        </aside>

        <article className="min-w-0 px-5 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 flex flex-col gap-4 border-b border-border pb-9">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent" className="font-mono">{page.group}</Badge>
                <Button asChild variant="ghost" size="sm" className="ml-auto">
                  <a href={editUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Edit
                  </a>
                </Button>
              </div>
              <H1>{page.title}</H1>
              {page.description ? <Muted className="max-w-3xl text-base leading-relaxed">{page.description}</Muted> : null}
            </div>

            <MarkdownContent className="gap-6" compact={false}>{page.body}</MarkdownContent>

            <div className="mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
              {previous ? (
                <Button asChild variant="secondary" className="justify-start">
                  <Link href={previous.slug === 'index' ? '/docs' : `/docs/${previous.slug}`}>
                    <ArrowLeft className="h-4 w-4" />
                    {previous.title}
                  </Link>
                </Button>
              ) : <div />}
              {next ? (
                <Button asChild variant="secondary" className="justify-end">
                  <Link href={next.slug === 'index' ? '/docs' : `/docs/${next.slug}`}>
                    {next.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </article>

        <aside className="hidden border-l border-border bg-surface-sunk/25 px-6 py-7 lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-56px)] lg:overflow-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-fg">
              <BookOpen className="h-4 w-4 text-accent" />
              On this page
            </div>
            <nav className="flex flex-col gap-2" aria-label="On this page">
              {headings.length ? headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={heading.depth > 2 ? 'pl-3 text-sm text-fg-subtle hover:text-accent' : 'text-sm text-fg-muted hover:text-accent'}
                >
                  {heading.text}
                </a>
              )) : (
                <Muted>No sections</Muted>
              )}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  )
}
