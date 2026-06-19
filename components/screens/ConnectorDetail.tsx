'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Code, Subtle } from '@/components/ui/typography'
import { useToast } from '@/components/ui/toast'
import { IngestionProgress, type IngestStatus } from '@/components/sources/IngestionProgress'
import { ApiError, getProductStatus, getSource, syncSource } from '@/lib/api'
import { useProduct } from '@/lib/product-context'
import type { Source } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATE_VARIANT: Record<string, 'success' | 'accent' | 'warning' | 'danger'> = {
  connected: 'success',
  watching: 'accent',
  syncing: 'warning',
  error: 'danger',
}

export function ConnectorDetail({ productId, name }: { productId?: string; name: string }) {
  const { currentProductId } = useProduct()
  const toast = useToast()
  const activeProductId = productId || currentProductId
  const base = `/p/${activeProductId}`
  const [source, setSource] = useState<Source | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [watchingSync, setWatchingSync] = useState(false)
  const [syncRun, setSyncRun] = useState(0)
  const [readyForCouncil, setReadyForCouncil] = useState(false)

  const refresh = useCallback(async () => {
    try {
      if (!activeProductId) return
      const s = await getSource(activeProductId, name)
      const productStatus = await getProductStatus(activeProductId)
      setSource(s)
      setReadyForCouncil(productStatus.hasEmbeddings && !productStatus.hasSkill)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [activeProductId, name])

  useEffect(() => { void refresh() }, [refresh])

  const handleSync = useCallback(async () => {
    if (!source) return
    setSyncing(true)
    try {
      await syncSource(activeProductId, source.id)
      setWatchingSync(true)
      setSyncRun((run) => run + 1)
      toast({ title: 'Sync started', description: `${source.name} is ingesting.`, variant: 'success' })
    } catch (e: unknown) {
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e)
      setError(message)
      toast({ title: 'Sync failed to start', description: message, variant: 'danger', duration: 7000 })
    } finally {
      setSyncing(false)
    }
  }, [activeProductId, source, toast])

  const handleProgressStatus = useCallback((status: IngestStatus) => {
    if (status === 'done' || status === 'error') {
      setWatchingSync(false)
      void refresh()
    }
  }, [refresh])

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
  const sourceRunning = watchingSync || source.status === 'syncing'

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
        <Button variant="outline" size="sm" disabled={syncing || sourceRunning} onClick={handleSync}>
          <RefreshCw className={cn('h-4 w-4', (syncing || sourceRunning) && 'animate-spin')} />
          {syncing ? 'Starting…' : sourceRunning ? 'Syncing…' : 'Sync now'}
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
                {watchingSync && (
                  <StatusDot status="syncing" size={6} />
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {source.lastDelta && (
                  <div className="grid grid-cols-3 gap-3">
                    <DeltaTile label="added" value={source.lastDelta.added} tone="success" />
                    <DeltaTile label="updated" value={source.lastDelta.updated} tone="accent" />
                    <DeltaTile label="removed" value={source.lastDelta.removed} tone="danger" />
                  </div>
                )}
                {readyForCouncil && (
                  <div className="flex flex-col gap-3 rounded-md border border-accent/30 bg-accent/10 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <H3>Ready for Council</H3>
                      <Muted>Ingestion has produced embeddings. Continue the product flow from Council.</Muted>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`${base}/council`}>
                        Run Council
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
                <IngestionProgress
                  key={`${source.id}:${syncRun}`}
                  productId={activeProductId}
                  source={source}
                  forceRunning={sourceRunning}
                  idleUntilStarted
                  onStatusChange={handleProgressStatus}
                />
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
