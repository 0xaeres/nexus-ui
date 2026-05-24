'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Code, Subtle } from '@/components/ui/typography'
import { ApiError, getSource, syncSource, sourceLogUrl } from '@/lib/api'
import { useProduct } from '@/lib/product-context'
import { useEventStream } from '@/lib/hooks/useEventStream'
import type { Source, SyncDelta } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATE_VARIANT: Record<string, 'success' | 'accent' | 'warning' | 'danger'> = {
  connected: 'success',
  watching: 'accent',
  syncing: 'warning',
  error: 'danger',
}

export function ConnectorDetail({ name }: { name: string }) {
  const { currentProductId } = useProduct()
  const base = `/p/${currentProductId}`
  const [source, setSource] = useState<Source | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [logUrl, setLogUrl] = useState<string | null>(null)

  const { events: logEvents, status: logStatus } = useEventStream(logUrl, { enabled: !!logUrl })

  const streamDelta = logEvents
    .filter(e => e.event === 'delta' && typeof e.data === 'object' && e.data)
    .map(e => e.data as SyncDelta)
    .pop()
  const delta: SyncDelta | null = streamDelta ?? source?.lastDelta ?? null

  const refresh = useCallback(async () => {
    try {
      const s = await getSource(currentProductId, name)
      setSource(s)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [currentProductId, name])

  useEffect(() => { void refresh() }, [refresh])

  const handleSync = useCallback(async () => {
    if (!source) return
    setSyncing(true)
    setLogUrl(null)
    try {
      await syncSource(currentProductId, source.name)
      setLogUrl(sourceLogUrl(currentProductId, source.name))
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setSyncing(false)
    }
  }, [currentProductId, source])

  useEffect(() => {
    if (logStatus === 'closed') void refresh()
  }, [logStatus, refresh])

  if (error) {
    return (
      <>
        <PageHeader>
          <Button asChild variant="ghost" size="sm">
            <Link href={`${base}/sources`}>
              <ChevronLeft className="h-4 w-4" />
              Sources
            </Link>
          </Button>
          <H1>{name}</H1>
        </PageHeader>
        <PageBody>
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Not found</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        </PageBody>
      </>
    )
  }

  if (!source) {
    return (
      <>
        <PageHeader>
          <Button asChild variant="ghost" size="sm">
            <Link href={`${base}/sources`}>
              <ChevronLeft className="h-4 w-4" />
              Sources
            </Link>
          </Button>
          <H1>{name}</H1>
        </PageHeader>
        <PageBody>
          <Card variant="surface" className="px-5 py-6"><Muted>Loading…</Muted></Card>
        </PageBody>
      </>
    )
  }

  const badge = STATE_VARIANT[source.status] ?? 'accent'

  return (
    <>
      <PageHeader>
        <Button asChild variant="ghost" size="sm">
          <Link href={`${base}/sources`}>
            <ChevronLeft className="h-4 w-4" />
            Sources
          </Link>
        </Button>
        <H1>{source.name}</H1>
        <Badge variant={badge}>{source.status}</Badge>
        <Badge variant="outline" className="font-mono">{source.type}</Badge>
        <div className="flex-1" />
        <Button variant="outline" size="sm" disabled={syncing} onClick={handleSync}>
          <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
          {syncing ? 'Starting…' : 'Sync now'}
        </Button>
      </PageHeader>

      <PageBody>
        <PageGrid>
          {/* Overview stats */}
          <div className="col-span-6 md:col-span-4 lg:col-span-3">
            <Stat label="Resources" value={source.resourceCount.toLocaleString()} />
          </div>
          <div className="col-span-6 md:col-span-4 lg:col-span-3">
            <Stat label="Last sync" value={source.lastSync ? source.lastSync.slice(0, 19) : '—'} mono />
          </div>
          <div className="col-span-6 md:col-span-4 lg:col-span-3">
            <Stat label="Next sync" value={source.nextSync ? source.nextSync.slice(0, 19) : '—'} mono />
          </div>
          <div className="col-span-6 md:col-span-4 lg:col-span-3">
            <Stat label="Status" value={source.status} mono>
              <StatusDot status={source.status === 'syncing' ? 'syncing' : 'done'} size={6} />
            </Stat>
          </div>
          <div className="col-span-6 md:col-span-4 lg:col-span-3">
            <Stat label="Product" value={source.product} mono />
          </div>

          {/* Connector config */}
          <div className="col-span-12 lg:col-span-6">
            <Card variant="surface">
              <CardHeader>
                <SectionLabel>Configuration</SectionLabel>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono whitespace-pre-wrap text-fg-muted bg-bg-active rounded-md p-3 overflow-x-auto">
                  {JSON.stringify(source.config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Sync log */}
          <div className="col-span-12 lg:col-span-6">
            <Card variant="surface">
              <CardHeader className="flex flex-row items-center gap-2">
                <H3>Sync log</H3>
                {logStatus === 'open' && (
                  <StatusDot status="syncing" size={6} />
                )}
                {logStatus === 'closed' && logEvents.length > 0 && (
                  <Badge variant="outline" className="font-mono text-xs">done</Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {delta && (
                  <div className="grid grid-cols-3 gap-3">
                    <DeltaTile label="added" value={delta.added} tone="success" />
                    <DeltaTile label="updated" value={delta.updated} tone="accent" />
                    <DeltaTile label="removed" value={delta.removed} tone="danger" />
                  </div>
                )}
                {logEvents.length === 0 && !logUrl && (
                  <Muted className="font-mono text-sm">
                    Click <strong>Sync now</strong> to start an ingestion run and watch live progress.
                  </Muted>
                )}
                {(logUrl || logEvents.length > 0) && (
                  <ScrollArea className="h-56 rounded-md bg-bg-active p-3">
                    <div className="flex flex-col gap-1 font-mono text-xs">
                      {logEvents.map((e, i) => {
                        const d = e.data as { level?: string; msg?: string; ts?: string } | string
                        const level = typeof d === 'object' ? (d.level ?? 'info') : 'info'
                        const msg = typeof d === 'object' ? (d.msg ?? e.raw) : e.raw
                        const color =
                          level === 'success' ? 'text-success' :
                          level === 'done' ? 'text-fg-muted' :
                          level === 'error' ? 'text-danger' : 'text-fg-muted'
                        return (
                          <div key={i} className={cn('flex gap-2', color)}>
                            <span className="text-fg-subtle shrink-0">›</span>
                            <span>{msg}</span>
                          </div>
                        )
                      })}
                      {logStatus === 'open' && (
                        <div className="flex gap-2 text-fg-subtle animate-pulse">
                          <span>›</span><span>Streaming…</span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </PageGrid>
      </PageBody>
    </>
  )
}

function DeltaTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'accent' | 'danger'
}) {
  const color =
    tone === 'success' ? 'text-success' :
    tone === 'danger' ? 'text-danger' : 'text-accent'
  return (
    <div className="rounded-md bg-bg-active px-3 py-2 flex flex-col gap-0.5">
      <Subtle className="font-mono uppercase tracking-wider text-xs">{label}</Subtle>
      <span className={cn('font-mono text-base font-medium', color)}>{value}</span>
    </div>
  )
}

function Stat({
  label,
  value,
  mono = false,
  children,
}: {
  label: string
  value: string
  mono?: boolean
  children?: React.ReactNode
}) {
  return (
    <Card variant="glass" className="p-4 flex flex-col gap-1.5">
      <Subtle className="font-mono uppercase tracking-wider text-xs">{label}</Subtle>
      <div className="flex items-center gap-1.5">
        {children}
        <span className={cn('text-base font-medium text-fg', mono && 'font-mono')}>
          {value}
        </span>
      </div>
    </Card>
  )
}
