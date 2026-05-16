'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, RefreshCw, ChevronRight, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusDot } from '@/components/ui/status-dot'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { BrandIcon } from '@/components/icons/BrandIcon'
import { IngestionProgress } from '@/components/sources/IngestionProgress'
import { SourcesSkeleton } from '@/components/skeletons/SourcesSkeleton'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import { H1, H3, SectionLabel, Muted, Subtle, Code, Body } from '@/components/ui/typography'
import { NEXUS_CONNECTIONS, NEXUS_CONNECTORS } from '@/lib/data'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

type Connection = typeof NEXUS_CONNECTIONS[number]

const STATE_BADGE: Record<string, 'success' | 'accent' | 'warning' | 'danger'> = {
  connected: 'success',
  watching: 'accent',
  syncing: 'warning',
  error: 'danger',
}

const INGESTION_RUNS = [
  { id: 'ir1', source: 'github',     trigger: 'webhook', status: 'done' as const,  dur: '7.1s',  ts: '14:32:08', summary: '61 chunks · main@a8f1c2e' },
  { id: 'ir2', source: 'confluence', trigger: 'cron',    status: 'done' as const,  dur: '12.4s', ts: '13:00:01', summary: 'space:ENG · 218 pages indexed' },
  { id: 'ir3', source: 'jira',       trigger: 'manual',  status: 'done' as const,  dur: '6.1s',  ts: '11:15:44', summary: 'NEX-* · 18 tickets ingested' },
  { id: 'ir4', source: 'github',     trigger: 'webhook', status: 'error' as const, dur: '—',     ts: '10:00:02', summary: 'auth expired — re-authorize' },
]

export function Sources() {
  const { currentProductId, perms } = useProduct()
  const sp = useSearchParams()
  const loading = sp?.get('loading') === '1'
  const base = `/p/${currentProductId}`
  const [ingesting, setIngesting] = useState(false)

  if (loading) return <SourcesSkeleton />

  const connections = NEXUS_CONNECTIONS.filter(c => c.productId === currentProductId)
  const remainingConnectors = NEXUS_CONNECTORS.filter(c => !connections.some(x => x.type === c.id))

  const handleIngestAll = () => {
    setIngesting(true)
    setTimeout(() => setIngesting(false), 2400)
  }

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
        {/* Active sources */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <SectionLabel>Active</SectionLabel>
            <Subtle className="font-mono">{connections.length} {connections.length === 1 ? 'connection' : 'connections'}</Subtle>
          </div>

          {connections.length === 0 ? (
            <EmptyState
              icon={<Plus className="h-6 w-6" />}
              title="No sources connected"
              description="Connect a code, ticket, or docs source to start ingesting knowledge for this product."
              cta={perms.canManageSources ? { label: 'Add your first source', href: `${base}/sources/new` } : undefined}
            />
          ) : (
            <PageGrid>
              {connections.map(conn => (
                <div key={conn.id} className="col-span-12 md:col-span-6 xl:col-span-4">
                  <ConnectionCard conn={conn} base={base} />
                </div>
              ))}
            </PageGrid>
          )}
        </section>

        {/* Add source catalog */}
        {perms.canManageSources && remainingConnectors.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <SectionLabel>Add source</SectionLabel>
              <Subtle className="font-mono">{remainingConnectors.length} available</Subtle>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {remainingConnectors.map(c => (
                <Link key={c.id} href={`${base}/sources/new?type=${c.id}`} className="group">
                  <Card variant="surface" className="p-5 flex flex-col gap-2 cursor-pointer hover:border-border-strong hover:bg-bg-hover transition-colors">
                    <div className="flex items-center gap-2.5">
                      <BrandIcon id={c.id} size={22} />
                      <span className="text-base font-medium text-fg">{c.name}</span>
                      <div className="flex-1" />
                      <Badge variant="outline">{c.auth}</Badge>
                    </div>
                    <Muted>{c.desc}</Muted>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ingestion runs */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <SectionLabel>Ingestion runs</SectionLabel>
            <Subtle className="font-mono">last 4 runs</Subtle>
          </div>
          <Card variant="surface" className="overflow-hidden p-0">
            <Table className="text-base">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INGESTION_RUNS.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm text-fg-subtle">{r.ts}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <BrandIcon id={r.source} size={16} />
                        <Code>{r.source}</Code>
                      </span>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{r.trigger}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{r.dur}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <StatusDot status={r.status} size={6} />
                        <span className={cn('font-mono text-sm', r.status === 'error' ? 'text-danger' : 'text-fg')}>{r.status}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-fg-muted truncate max-w-[320px]">{r.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </PageBody>
    </>
  )
}

function ConnectionCard({ conn, base }: { conn: Connection; base: string }) {
  const badgeVariant = STATE_BADGE[conn.state] ?? 'secondary'
  const isSyncing = conn.state === 'syncing'

  return (
    <Card variant="action" className="overflow-hidden">
      <Link href={`${base}/sources/${conn.type}`} className="block p-5">
        <div className="flex items-center gap-3">
          <BrandIcon id={conn.type} size={28} />
          <div className="flex-1 min-w-0">
            <div className="text-base font-medium text-fg truncate">{conn.name}</div>
            <div className="text-xs font-mono text-fg-subtle truncate mt-0.5">{conn.scope}</div>
          </div>
          <Badge variant={badgeVariant} className="shrink-0">
            <StatusDot status={conn.state} size={5} className="mr-1" />
            {conn.state}
          </Badge>
          <ChevronRight className="h-4 w-4 text-fg-subtle shrink-0" />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-mono text-fg">{conn.resources.toLocaleString()} <span className="text-fg-subtle">resources</span></span>
          <span className="font-mono text-fg-subtle">{conn.lastSync}</span>
        </div>
      </Link>

      {isSyncing && (
        <div className="px-5 pb-5 -mt-1">
          <div className="flex items-center gap-3">
            <Progress value={conn.progress} className="flex-1" indicatorClassName="bg-warning" />
            <span className="font-mono text-xs text-warning w-10 text-right">{conn.progress}%</span>
          </div>
          <SyncLogDialog connType={conn.type} progress={conn.progress} />
        </div>
      )}
    </Card>
  )
}

function SyncLogDialog({ connType, progress }: { connType: string; progress: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          onClick={e => e.stopPropagation()}
          className="mt-2 text-xs font-mono text-accent hover:text-accent-hover underline-offset-2 hover:underline"
        >
          View live sync log →
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrandIcon id={connType} size={18} />
            <span>Live sync · {connType}</span>
          </DialogTitle>
          <DialogDescription>Streaming index events from the ingestion runner.</DialogDescription>
        </DialogHeader>
        <IngestionProgress progress={progress} streaming />
      </DialogContent>
    </Dialog>
  )
}

function EmptyState({ icon, title, description, cta }: {
  icon: React.ReactNode
  title: string
  description: string
  cta?: { label: string; href: string }
}) {
  return (
    <Card variant="surface" className="py-16 px-8 flex flex-col items-center text-center gap-3">
      <div className="h-14 w-14 rounded-full bg-bg-active text-fg-muted flex items-center justify-center">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <div className="flex flex-col gap-1.5 max-w-md">
        <H3>{title}</H3>
        <Body className="text-sm text-fg-muted">{description}</Body>
      </div>
      {cta && (
        <Button asChild size="md" className="mt-2">
          <Link href={cta.href}>
            <Plus className="h-4 w-4" />
            {cta.label}
          </Link>
        </Button>
      )}
    </Card>
  )
}
