import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AnvayLogo } from '@/components/icons/AnvayLogo'
import { DocsNav, DocsSearch } from '@/components/docs/DocsNav'
import { MarkdownContent } from '@/components/ui/markdown'
import { H1, H2, Muted, SectionLabel } from '@/components/ui/typography'
import { REPOS } from '@/lib/links'
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
        <Link href="/landing" className="flex items-baseline gap-2 text-base font-semibold text-fg">
          <span className="flex items-center gap-2">
            <AnvayLogo markOnly size="sm" priority />
            <span>Anvay</span>
          </span>
          <span className="text-sm font-normal text-fg-subtle" aria-hidden="true">/</span>
          <span className="text-sm font-normal text-fg-muted">Docs</span>
        </Link>
        {groups ? (
          <div className="order-3 mx-auto w-full sm:order-none sm:max-w-sm sm:px-2">
            <DocsSearch groups={groups} />
          </div>
        ) : <div className="flex-1" />}
        <nav className="ml-auto flex shrink-0 items-center gap-4 text-sm text-fg-muted" aria-label="Public">
          <Link href="/landing" className="hover:text-fg">Overview</Link>
          <a href={REPOS.backend} target="_blank" rel="noreferrer" className="hover:text-fg">GitHub</a>
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
  return (
    <main className="min-h-screen bg-bg text-fg">
      <DocsTopBar groups={groups} />
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)_220px]">
        <aside className="border-b border-border px-4 py-4 lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:overflow-auto lg:border-b-0 lg:border-r lg:px-4 lg:py-8">
          <DocsNav groups={groups} activeSlug={page.slug} />
        </aside>

        <article className="min-w-0 px-5 py-10 sm:px-10 lg:px-16 lg:py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-9 flex flex-col gap-3 border-b border-border pb-8">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">{page.group}</div>
              <H1 className="text-3xl">{page.title}</H1>
              {page.description ? <Muted className="text-base leading-relaxed">{page.description}</Muted> : null}
            </div>

            <MarkdownContent prose>{page.body}</MarkdownContent>

            <nav className="mt-12 grid gap-3 border-t border-border pt-8 sm:grid-cols-2" aria-label="Pagination">
              {previous ? (
                <Link
                  href={previous.slug === 'index' ? '/docs' : `/docs/${previous.slug}`}
                  className="group flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
                >
                  <span className="flex items-center gap-1 text-xs text-fg-subtle">
                    <ArrowLeft className="h-3 w-3" />
                    Previous
                  </span>
                  <span className="text-sm font-medium text-fg group-hover:text-accent">{previous.title}</span>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  href={next.slug === 'index' ? '/docs' : `/docs/${next.slug}`}
                  className="group flex flex-col items-end gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-right transition-colors hover:border-border-strong"
                >
                  <span className="flex items-center gap-1 text-xs text-fg-subtle">
                    Next
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-medium text-fg group-hover:text-accent">{next.title}</span>
                </Link>
              ) : null}
            </nav>
          </div>
        </article>

        <aside className="hidden px-4 py-8 lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-56px)] lg:overflow-auto">
          <div className="flex flex-col gap-3 border-l border-border pl-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              On this page
            </div>
            <nav className="flex flex-col gap-1.5" aria-label="On this page">
              {headings.length ? headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={
                    heading.depth > 2
                      ? 'pl-3 text-[13px] leading-snug text-fg-subtle transition-colors hover:text-fg'
                      : 'text-[13px] leading-snug text-fg-muted transition-colors hover:text-fg'
                  }
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
