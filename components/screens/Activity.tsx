'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, Subtle, Code } from '@/components/ui/typography'
import { NEXUS_ACTIVITY } from '@/lib/data'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

type ActivityRow = typeof NEXUS_ACTIVITY[number]

const TABS = ['all', 'index', 'pr-review', 'changelog', 'ingest', 'council'] as const
type Tab = typeof TABS[number]

const TAB_LABEL: Record<Tab, string> = {
  'all':        'All',
  'index':      'Index',
  'pr-review':  'PR review',
  'changelog':  'Changelog',
  'ingest':     'Ingest',
  'council':    'Council',
}

const TRIGGER_VARIANT: Record<string, 'secondary' | 'outline' | 'accent'> = {
  webhook: 'accent',
  cron:    'secondary',
  manual:  'outline',
}

export function Activity() {
  const { currentProductId } = useProduct()
  const [tab, setTab] = useState<Tab>('all')

  const productRows = NEXUS_ACTIVITY.filter(r => r.productId === currentProductId)
  const filtered = productRows.filter(r => tab === 'all' || r.runner === tab)

  return (
    <>
      <PageHeader>
        <H1>Activity</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
        <div className="flex-1" />
        <Subtle className="font-mono">
          {productRows.length} {productRows.length === 1 ? 'run' : 'runs'} today
        </Subtle>
      </PageHeader>

      {/* Filter row */}
      <div className="border-b border-border bg-bg">
        <div className="mx-auto max-w-[1280px] px-8 py-3 flex items-center gap-1.5">
          {TABS.map(t => {
            const count = t === 'all' ? productRows.length : productRows.filter(r => r.runner === t).length
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
                <span className={cn(
                  'text-xs tabular-nums',
                  active ? 'text-fg-muted' : 'text-fg-subtle',
                )}>{count}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <PageBody>
        <Card variant="surface" className="overflow-hidden p-0">
          <Table className="text-base">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[88px]">Time</TableHead>
                <TableHead className="w-[140px]">Runner</TableHead>
                <TableHead className="w-[100px]">Trigger</TableHead>
                <TableHead className="w-[80px]">Duration</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-fg-subtle">
                    No events match this filter
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(r => <Row key={r.id} r={r} />)
              )}
            </TableBody>
          </Table>
        </Card>
      </PageBody>
    </>
  )
}

function Row({ r }: { r: ActivityRow }) {
  const triggerVariant = TRIGGER_VARIANT[r.trigger] ?? 'secondary'
  const isError = r.status === 'error'
  return (
    <TableRow>
      <TableCell className="font-mono text-sm text-fg-subtle">{r.time}</TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <StatusDot status={isError ? 'error' : 'done'} size={6} />
          <Code>{r.runner}</Code>
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={triggerVariant}>{r.trigger}</Badge>
      </TableCell>
      <TableCell className="font-mono text-sm text-fg">{r.dur}</TableCell>
      <TableCell>
        <span className={cn('font-mono text-sm', isError ? 'text-danger' : 'text-fg-muted')}>
          {r.status}
        </span>
      </TableCell>
      <TableCell className={cn('text-sm truncate max-w-[520px]', isError ? 'text-danger' : 'text-fg-muted')}>
        {r.summary}
      </TableCell>
    </TableRow>
  )
}
