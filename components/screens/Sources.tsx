'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, RefreshCw, ChevronRight, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { SourcesSkeleton } from '@/components/skeletons/SourcesSkeleton'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H3, SectionLabel, Muted, Subtle, Code } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import { ApiError, listSources, syncSource } from '@/lib/api'
import type { Source } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATE_BADGE: Record<string, 'success' | 'accent' | 'warning' | 'danger'> = {
  connected: 'success',
  watching: 'accent',
  syncing: 'warning',
  error: 'danger',
}

export function Sources() {
  const { currentProductId, perms } = useProduct()
  const base = `/p/${currentProductId}`
  const [sources, setSources] = useState<Source[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ingesting, setIngesting] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const list = await listSources(currentProductId)
      setSources(list)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
      setSources([])
    }
  }, [currentProductId])

  useEffect(() => { void refresh() }, [refresh])

  const handleIngestAll = async () => {
    if (!sources || sources.length === 0) return
    setIngesting(true)
    try {
      await Promise.allSettled(
        sources.map(s => syncSource(currentProductId, s.id)),
      )
      await refresh()
    } finally {
      setIngesting(false)
    }
  }

  if (sources === null && !error) return <SourcesSkeleton />

  return (
    <>
      <PageHeader>
        <H1>Sources</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
        <div className="flex-1" />
        {perms.canManageSources && (
          <>
            <Button variant="outline" size="md" onClick={handleIngestAll} disabled={ingesting}>
              <RefreshCw className={cn('h-4 w-4', ingesting && 'animate-spin')} />
              {ingesting ? 'Ingesting…' : 'Ingest all'}
            </Button>
            <Button asChild size="md">
              <Link href={`${base}/sources/new`}>
                <Plus className="h-4 w-4" />
                Add source
              </Link>
            </Button>
          </>
        )}
      </PageHeader>

      <PageBody>
        {error && (
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        )}

        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <SectionLabel>Active sources</SectionLabel>
            <Subtle className="font-mono">
              {sources?.length ?? 0} configured
            </Subtle>
          </div>

          {(!sources || sources.length === 0) ? (
            <Card variant="surface" className="p-8 flex flex-col items-center gap-3 text-center">
              <Inbox className="h-8 w-8 text-fg-subtle" />
              <H3>No sources yet</H3>
              <Muted>
                Add a GitHub repo, Confluence space, or any MCP connector to start ingesting.
              </Muted>
              {perms.canManageSources && (
                <Button asChild size="sm">
                  <Link href={`${base}/sources/new`}>
                    <Plus className="h-4 w-4" />
                    Add your first source
                  </Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map(src => (
                <SourceCard key={src.id} src={src} base={base} />
              ))}
            </div>
          )}
        </section>
      </PageBody>
    </>
  )
}

function SourceCard({ src, base }: { src: Source; base: string }) {
  const badge = STATE_BADGE[src.status] ?? 'accent'
  return (
    <Link
      href={`${base}/sources/${encodeURIComponent(src.name)}`}
      className="group"
    >
      <Card
        variant="surface"
        className="p-4 flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <Code className="flex-1 truncate">{src.name}</Code>
          <Badge variant={badge}>{src.status}</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-baseline">
            <Subtle className="font-mono uppercase tracking-wider text-xs">type</Subtle>
            <Code className="text-xs">{src.type}</Code>
          </div>
          <div className="flex justify-between items-baseline">
            <Subtle className="font-mono uppercase tracking-wider text-xs">resources</Subtle>
            <Code className="text-xs">{src.resourceCount.toLocaleString()}</Code>
          </div>
          {src.lastSync && (
            <div className="flex justify-between items-baseline">
              <Subtle className="font-mono uppercase tracking-wider text-xs">last sync</Subtle>
              <Code className="text-xs">{src.lastSync.slice(0, 19)}</Code>
            </div>
          )}
          {src.nextSync && (
            <div className="flex justify-between items-baseline">
              <Subtle className="font-mono uppercase tracking-wider text-xs">next sync</Subtle>
              <Code className="text-xs">{src.nextSync.slice(11, 16)}</Code>
            </div>
          )}
          {src.lastDelta && (
            <div className="flex justify-between items-baseline">
              <Subtle className="font-mono uppercase tracking-wider text-xs">last delta</Subtle>
              <Code className="text-xs">
                +{src.lastDelta.added} ~{src.lastDelta.updated} -{src.lastDelta.removed}
              </Code>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-fg-subtle group-hover:text-fg transition-colors">
          <StatusDot status={src.status === 'syncing' ? 'syncing' : 'done'} size={5} />
          <span className="text-xs font-mono">view detail</span>
          <ChevronRight className="h-3 w-3 ml-auto" />
        </div>
      </Card>
    </Link>
  )
}
