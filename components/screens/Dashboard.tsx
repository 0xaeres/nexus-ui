'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, BookOpen, ArrowRight, Activity as ActivityIcon, Users } from 'lucide-react'
import { Pipeline } from '@/components/pipeline/Pipeline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusDot } from '@/components/ui/status-dot'
import { Separator } from '@/components/ui/separator'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import { H1, H3, SectionLabel, Muted, Subtle, Code, Small } from '@/components/ui/typography'
import { NEXUS_DAEMON_STATUS, NEXUS_PENDING, NEXUS_ACTIVITY, NEXUS_AGENTS_LIVE, NEXUS_CONNECTIONS } from '@/lib/data'
import { AGENT_HUE, AGENT_LABEL } from '@/lib/agent-colors'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

const ACCENT_TEXT: Record<string, string> = {
  accent: 'text-accent',
  warning: 'text-warning',
  high: 'text-high',
  danger: 'text-danger',
  success: 'text-success',
}

const ACCENT_DOT: Record<string, string> = {
  accent: 'bg-accent',
  warning: 'bg-warning',
  high: 'bg-high',
  danger: 'bg-danger',
  success: 'bg-success',
}

const ACCENT_GLOW: Record<string, string> = {
  accent: 'rgba(124,140,255,0.12)',
  warning: 'rgba(232,184,107,0.12)',
  high: 'rgba(255,145,89,0.12)',
  danger: 'rgba(242,109,109,0.12)',
  success: 'rgba(77,212,172,0.12)',
}

export function Dashboard() {
  const { currentProductId, currentProduct } = useProduct()
  const sp = useSearchParams()
  const loading = sp?.get('loading') === '1'
  if (loading) return <DashboardSkeleton />

  const base = `/p/${currentProductId}`
  const syncingCount = NEXUS_CONNECTIONS.filter(c => c.productId === currentProductId && c.state === 'syncing').length

  return (
    <>
      <PageHeader>
        <H1>Dashboard</H1>
        <Badge variant="outline" className="font-mono">{currentProduct?.name ?? currentProductId}</Badge>
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
        {/* Optional inline ingestion notice */}
        {syncingCount > 0 && (
          <Link
            href={`${base}/sources`}
            className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-warning/10 border border-warning/30 hover:bg-warning/15 transition-colors"
          >
            <StatusDot status="syncing" size={7} />
            <span className="text-base text-fg">
              {syncingCount} {syncingCount === 1 ? 'source is' : 'sources are'} ingesting
            </span>
            <Muted className="font-mono">live progress on Sources</Muted>
            <div className="flex-1" />
            <ArrowRight className="h-4 w-4 text-warning" />
          </Link>
        )}

        <Pipeline base={base} />

        {/* Daemon strip */}
        <Card variant="surface" className="px-6 py-4 flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <StatusDot status="running" size={7} />
            <span className="text-base font-mono text-fg">daemon · running</span>
            <Subtle className="font-mono">up {NEXUS_DAEMON_STATUS.uptime}</Subtle>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <InlineStat label="cpu" value={NEXUS_DAEMON_STATUS.cpu} />
          <Separator orientation="vertical" className="h-4" />
          <InlineStat label="mem" value={NEXUS_DAEMON_STATUS.mem} />
          <Separator orientation="vertical" className="h-4" />
          <InlineStat label="last event" value={NEXUS_DAEMON_STATUS.lastEvent} />
        </Card>

        {/* Pending */}
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <SectionLabel>Awaiting human</SectionLabel>
            <Subtle className="font-mono">{NEXUS_PENDING.reduce((s, p) => s + p.count, 0)} items</Subtle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {NEXUS_PENDING.map(p => {
              const href = p.screen === 'council' ? `${base}/council`
                : p.screen === 'activity' ? `${base}/activity`
                : `${base}/sources`
              return (
                <Link key={p.id} href={href} className="group">
                  <Card variant="stat" glowColor={ACCENT_GLOW[p.accent]} className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', ACCENT_DOT[p.accent])} />
                      <Muted>{p.label}</Muted>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={cn('text-4xl font-semibold font-mono leading-none tracking-tight', ACCENT_TEXT[p.accent])}>{p.count}</span>
                      <Small className="font-mono group-hover:text-fg transition-colors">open →</Small>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Activity + Council mini */}
        <PageGrid>
          <Card variant="surface" className="col-span-12 lg:col-span-8 overflow-hidden p-0">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
              <ActivityIcon className="h-4 w-4 text-fg-muted" />
              <H3>Recent activity</H3>
              <div className="flex-1" />
              <Button asChild variant="ghost" size="sm">
                <Link href={`${base}/activity`}>View all →</Link>
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Time</TableHead>
                  <TableHead>Runner</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Dur</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {NEXUS_ACTIVITY.slice(0, 8).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm text-fg-subtle w-16">{r.time}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <StatusDot status={r.status} size={5} />
                        <Code>{r.runner}</Code>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-fg-subtle">{r.trigger}</TableCell>
                    <TableCell className="font-mono text-sm">{r.dur}</TableCell>
                    <TableCell className="text-sm text-fg-muted truncate max-w-[320px]">{r.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card variant="stat" glowColor="rgba(197,139,255,0.12)" className="col-span-12 lg:col-span-4 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-violet" />
              <H3>Active council</H3>
              <div className="flex-1" />
              <Badge variant="violet">live</Badge>
            </div>
            <Code className="truncate">forge/tech_stack/rust/tokio-spawn-patterns</Code>
            <div className="flex flex-col gap-2">
              {NEXUS_AGENTS_LIVE.map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: AGENT_HUE[a.id] }} />
                  <Small className="text-fg">{AGENT_LABEL[a.id]}</Small>
                  <div className="flex-1" />
                  <StatusDot status={a.status} size={5} />
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex items-center gap-2.5">
              <Small>confidence</Small>
              <Progress value={91} className="flex-1" indicatorClassName="bg-success" />
              <Small className="font-mono text-fg">91%</Small>
            </div>
            <Button asChild size="sm" className="self-end">
              <Link href={`${base}/council`}>Validate →</Link>
            </Button>
          </Card>
        </PageGrid>
      </PageBody>
    </>
  )
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-wider font-mono text-fg-subtle">{label}</span>
      <Code>{value}</Code>
    </div>
  )
}
