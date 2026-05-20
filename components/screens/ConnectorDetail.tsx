'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Code, Subtle } from '@/components/ui/typography'
import { ApiError, getSource } from '@/lib/api'
import { useProduct } from '@/lib/product-context'
import type { Source } from '@/lib/types'

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
        <Button variant="outline" size="sm" disabled>
          <RefreshCw className="h-4 w-4" />
          Sync now
        </Button>
      </PageHeader>

      <PageBody>
        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Resources" value={source.resourceCount.toLocaleString()} />
          <Stat
            label="Last sync"
            value={source.lastSync ? source.lastSync.slice(0, 19) : '—'}
            mono
          />
          <Stat label="Status" value={source.status} mono>
            <StatusDot status={source.status === 'syncing' ? 'syncing' : 'done'} size={6} />
          </Stat>
          <Stat label="Product" value={source.product} mono />
        </div>

        {/* Connector config */}
        <Card variant="surface" className="p-5">
          <SectionLabel className="mb-3">Configuration</SectionLabel>
          <pre className="text-xs font-mono whitespace-pre-wrap text-fg-muted bg-bg-active rounded-md p-3 overflow-x-auto">
            {JSON.stringify(source.config, null, 2)}
          </pre>
        </Card>

        {/* Sync log - placeholder until backend SSE endpoint lands */}
        <Card variant="surface" className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <H3>Sync log</H3>
            <Subtle className="font-mono">live</Subtle>
            <div className="flex-1" />
          </div>
          <Muted className="font-mono text-sm">
            Live sync events will appear here once the daemon publishes to
            <Code className="ml-1">/products/{currentProductId}/sources/{source.name}/log</Code>.
          </Muted>
        </Card>
      </PageBody>
    </>
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
    <Card variant="stat" className="p-4 flex flex-col gap-1.5">
      <Subtle className="font-mono uppercase tracking-wider text-xs">{label}</Subtle>
      <div className="flex items-center gap-1.5">
        {children}
        <span className={mono ? 'font-mono text-base text-fg' : 'text-base font-medium text-fg'}>
          {value}
        </span>
      </div>
    </Card>
  )
}
