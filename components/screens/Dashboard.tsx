'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, BookOpen, ArrowRight, Activity as ActivityIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H3, SectionLabel, Muted, Subtle, Small } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import { ApiError, getDashboard } from '@/lib/api'
import type { DashboardData } from '@/lib/types'
import { cn } from '@/lib/utils'

const ACCENT_TEXT: Record<string, string> = {
  master: 'text-accent',
  product_domain: 'text-warning',
  tech_stack: 'text-high',
  language: 'text-violet',
  security: 'text-danger',
  default: 'text-fg',
}

const ACCENT_DOT: Record<string, string> = {
  master: 'bg-accent',
  product_domain: 'bg-warning',
  tech_stack: 'bg-high',
  language: 'bg-violet',
  security: 'bg-danger',
  default: 'bg-fg-subtle',
}

const ACCENT_GLOW = 'rgba(124,140,255,0.12)'

export function Dashboard() {
  const { currentProductId, currentProduct } = useProduct()
  const sp = useSearchParams()
  const forceLoading = sp?.get('loading') === '1'

  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const d = await getDashboard(currentProductId)
      setData(d)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [currentProductId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (forceLoading || (!data && !error)) return <DashboardSkeleton />

  const base = `/p/${currentProductId}`
  const pending = data?.pending ?? []
  const activity = data?.recentActivity ?? []
  const pipeline = data?.pipeline ?? []
  const daemonState = data?.daemon?.state ?? 'unknown'

  return (
    <>
      <PageHeader>
        <H1>Dashboard</H1>
        <Badge variant="outline" className="font-mono">
          {currentProduct?.name ?? currentProductId}
        </Badge>
        <div className="flex-1" />
        <Button asChild variant="secondary">
          <Link href={`${base}/skills`}>
            <BookOpen className="h-4 w-4" />
            View Skills
          </Link>
        </Button>
        <Button asChild>
          <Link href={`${base}/council`}>
            <Plus className="h-4 w-4" />
            New Council session
          </Link>
        </Button>
      </PageHeader>

      <PageBody>
        {error && (
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        )}

        {/* Cadence hint — quiet, non-interactive */}
        {data?.cadence && (data.cadence.nextSyncAt || data.cadence.nextCouncilAt) && (
          <Subtle className="font-mono text-xs">
            {data.cadence.nextSyncAt && (
              <>Next sync: {data.cadence.nextSyncAt.slice(11, 16)}</>
            )}
            {data.cadence.nextSyncAt && data.cadence.nextCouncilAt && ' · '}
            {data.cadence.nextCouncilAt && (
              <>
                Next council eligible: {data.cadence.nextCouncilAt.slice(11, 16)}
              </>
            )}
          </Subtle>
        )}

        {/* Pipeline strip */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <SectionLabel>Pipeline</SectionLabel>
            <Subtle className="font-mono">live counts</Subtle>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pipeline.map(stage => (
              <Card key={stage.id} variant="stat" glowColor={ACCENT_GLOW} className="p-5 flex flex-col gap-3">
                <Muted>{stage.label}</Muted>
                <span className="text-4xl font-semibold font-mono leading-none tracking-tight text-fg">
                  {stage.count}
                </span>
              </Card>
            ))}
          </div>
        </section>

        {/* Daemon strip */}
        <Card variant="surface" className="px-6 py-4 flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <StatusDot status={daemonState === 'idle' ? 'idle' : 'running'} size={7} />
            <span className="text-base font-mono text-fg">daemon · {daemonState}</span>
            {data?.daemon?.lastEvent && (
              <Subtle className="font-mono">last event {data.daemon.lastEvent}</Subtle>
            )}
          </div>
          <Separator orientation="vertical" className="h-4" />
          <Muted className="font-mono">
            {pending.length} pending {pending.length === 1 ? 'proposal' : 'proposals'}
          </Muted>
        </Card>

        {/* Pending */}
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <SectionLabel>Awaiting human</SectionLabel>
            <Subtle className="font-mono">{pending.length} items</Subtle>
          </div>
          {pending.length === 0 ? (
            <Card variant="surface" className="px-5 py-4">
              <Muted>Nothing pending. Kick off a council to draft a new skill.</Muted>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pending.slice(0, 6).map(p => (
                <Link key={p.id} href={`${base}/review`} className="group">
                  <Card variant="stat" glowColor={ACCENT_GLOW} className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', ACCENT_DOT.default)} />
                      <Muted>pending</Muted>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={cn('text-base font-medium font-mono leading-tight truncate', ACCENT_TEXT.default)}>
                        {p.label}
                      </span>
                      <Small className="font-mono text-fg-subtle">
                        {Math.round((p.confidence ?? 0) * 100)}%
                      </Small>
                    </div>
                    <div className="flex items-center gap-1 text-fg-subtle group-hover:text-fg transition-colors">
                      <Small className="font-mono">Open</Small>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <Card variant="surface" className="overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <ActivityIcon className="h-4 w-4 text-fg-muted" />
            <H3>Recent activity</H3>
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-6">
              <Muted>No activity yet for this product.</Muted>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.slice(0, 10).map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {r.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.title}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <StatusDot
                          status={r.status === 'completed' ? 'done' : r.status === 'running' ? 'syncing' : 'error'}
                          size={5}
                        />
                        <Small className="font-mono">{r.status}</Small>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-fg-subtle">
                      {r.startedAt?.slice(0, 19) ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </PageBody>
    </>
  )
}
