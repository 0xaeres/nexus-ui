'use client'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, Muted, SectionLabel, Subtle } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import { ApiError, listActivity } from '@/lib/api'
import type { Activity as ActivityItem } from '@/lib/types'
import { cn } from '@/lib/utils'

const TABS = ['all', 'ingest', 'council', 'pr-review', 'changelog', 'index'] as const
type Tab = typeof TABS[number]

const TAB_LABEL: Record<Tab, string> = {
  'all':        'All',
  'ingest':     'Ingest',
  'council':    'Council',
  'pr-review':  'PR review',
  'changelog':  'Changelog',
  'index':      'Index',
}


export function Activity() {
  const { currentProductId } = useProduct()
  const [tab, setTab] = useState<Tab>('all')
  const [items, setItems] = useState<ActivityItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const list = await listActivity(currentProductId)
      setItems(list)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
      setItems([])
    }
  }, [currentProductId])

  useEffect(() => { void refresh() }, [refresh])

  const productRows = items ?? []
  const filtered = productRows.filter(r => tab === 'all' || r.type === tab)

  return (
    <>
      <PageHeader>
        <H1>Activity</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
        <div className="flex-1" />
        <Subtle className="font-mono">
          {productRows.length} {productRows.length === 1 ? 'event' : 'events'}
        </Subtle>
      </PageHeader>

      <div className="border-b border-border bg-bg">
        <div className="mx-auto max-w-[1280px] px-8 py-3 flex items-center gap-1.5">
          {TABS.map(t => {
            const count = t === 'all' ? productRows.length : productRows.filter(r => r.type === t).length
            const active = tab === t
            return (
              <Button
                key={t}
                variant={active ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTab(t)}
                className={cn('h-8 px-3 font-mono text-sm gap-1.5', active && 'border-border-strong text-fg')}
              >
                {TAB_LABEL[t]}
                <span className={cn('text-xs tabular-nums', active ? 'text-fg-muted' : 'text-fg-subtle')}>
                  {count}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      <PageBody>
        {error && (
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        )}

        {items === null && !error ? (
          <Card variant="surface" className="px-5 py-6"><Muted>Loading…</Muted></Card>
        ) : (
          <Card variant="surface" className="overflow-hidden p-0">
            <Table className="text-base">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[160px]">Started</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Title</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-fg-subtle">
                      No events match this filter
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(r => <Row key={r.id} r={r} />)
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </PageBody>
    </>
  )
}

function Row({ r }: { r: ActivityItem }) {
  const isError = r.status === 'failed' || r.status === 'error'
  const isRunning = r.status === 'running'
  return (
    <TableRow>
      <TableCell className="font-mono text-sm text-fg-subtle">
        {r.startedAt?.slice(0, 19) ?? '—'}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono text-xs">{r.type}</Badge>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <StatusDot
            status={isError ? 'error' : isRunning ? 'syncing' : 'done'}
            size={6}
          />
          <span className={cn('font-mono text-sm', isError ? 'text-danger' : 'text-fg-muted')}>
            {r.status}
          </span>
        </span>
      </TableCell>
      <TableCell className="text-sm text-fg truncate max-w-[640px]">{r.title}</TableCell>
    </TableRow>
  )
}
