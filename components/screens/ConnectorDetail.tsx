'use client'
import { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, RefreshCw, Pencil, MoreHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { BrandIcon } from '@/components/icons/BrandIcon'
import { IngestionProgress } from '@/components/sources/IngestionProgress'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H3, SectionLabel, Body, Muted, Subtle, Code } from '@/components/ui/typography'
import { NEXUS_CONNECTIONS, NEXUS_CONNECTOR_RESOURCES, NEXUS_SYNC_LOG } from '@/lib/data'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

const STATE_VARIANT: Record<string, 'success' | 'accent' | 'warning' | 'danger'> = {
  connected: 'success',
  watching:  'accent',
  syncing:   'warning',
  error:     'danger',
}

const LOG_COLOR: Record<string, string> = {
  ok:   'text-fg-muted',
  warn: 'text-warning',
  err:  'text-danger',
}

const LOG_GLYPH: Record<string, string> = {
  ok:   '·',
  warn: '!',
  err:  '×',
}

export function ConnectorDetail({ name }: { name: string }) {
  const { currentProductId, perms } = useProduct()
  const conn = NEXUS_CONNECTIONS.find(c => c.type === name && c.productId === currentProductId)
  const [syncing, setSyncing] = useState(false)

  if (!conn) return notFound()

  const stateVariant = STATE_VARIANT[conn.state] ?? 'secondary'
  const isSyncing = conn.state === 'syncing' || syncing
  const base = `/p/${currentProductId}`

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 3000)
  }

  return (
    <>
      <PageHeader>
        <Button asChild variant="ghost" size="icon" className="h-9 w-9" aria-label="Back to sources">
          <Link href={`${base}/sources`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <BrandIcon id={conn.type} size={26} />
        <H1>{conn.name}</H1>
        <Badge variant={stateVariant}>
          <StatusDot status={conn.state} size={5} className="mr-1" />
          {conn.state}
        </Badge>
        <div className="flex-1" />
        {perms.canManageSources && (
          <>
            <Button variant="outline" size="md" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Syncing…' : 'Sync now'}
            </Button>
            <Button variant="ghost" size="md">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="More actions">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Re-authorize</DropdownMenuItem>
                <DropdownMenuItem>Reindex from scratch</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-danger focus:text-danger">
                  <Trash2 className="h-4 w-4" />
                  Remove source
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </PageHeader>

      <PageBody>
        {isSyncing && (
          <Card variant="surface" className="p-5">
            <IngestionProgress progress={conn.progress} streaming />
          </Card>
        )}

        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Resources indexed" value={conn.resources.toLocaleString()} />
          <Stat label="Chunks" value={String(NEXUS_CONNECTOR_RESOURCES.reduce((a, r) => a + r.chunks, 0))} />
          <Stat label="Last sync" value={conn.lastSync} />
          <Stat label="Status" value={conn.state} valueClassName={cn(
            (conn.state as string) === 'error' ? 'text-danger' :
            conn.state === 'syncing' ? 'text-warning' :
            conn.state === 'watching' ? 'text-accent' :
            'text-success',
          )} />
        </div>

        <Tabs defaultValue="resources">
          <TabsList>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="log">Sync log</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="mt-4">
            <Card variant="surface" className="overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Source</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead className="w-[120px]">Indexed at</TableHead>
                    <TableHead className="w-[80px] text-right">Chunks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {NEXUS_CONNECTOR_RESOURCES.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm text-fg truncate max-w-[460px]">{r.src}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">{r.mime}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-fg-subtle">{r.indexed}</TableCell>
                      <TableCell className="font-mono text-sm text-fg text-right">{r.chunks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <Card variant="surface" className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-fg-muted">Sync log</span>
                <span className="text-xs font-mono text-fg-subtle">{NEXUS_SYNC_LOG.length} entries</span>
              </div>
              <Separator className="mb-3" />
              <div className="flex flex-col gap-1 font-mono text-xs">
                {NEXUS_SYNC_LOG.map((e, i) => (
                  <div key={i} className="flex items-start gap-2.5 leading-snug">
                    <span className="text-fg-subtle shrink-0">{e.t}</span>
                    <span className={cn('shrink-0 w-3 text-center', LOG_COLOR[e.kind])}>{LOG_GLYPH[e.kind]}</span>
                    <span className={LOG_COLOR[e.kind]}>{e.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {(conn.state as string) === 'error' && (
          <Card variant="surface" className="p-6 border-danger/30">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-danger/15 border border-danger/30 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-danger" />
              </div>
              <div className="flex-1">
                <div className="text-base font-medium text-danger">Connection error</div>
                <div className="text-sm text-fg-muted mt-1">
                  Authentication expired. Re-authorize to resume sync.
                </div>
                <div className="mt-3">
                  <Button variant="default" size="md">Re-authorize</Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </PageBody>
    </>
  )
}

function Stat({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <Card variant="stat" glowColor="rgba(124,140,255,0.08)" className="p-5 flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider font-medium text-fg-muted">{label}</span>
      <span className={cn('text-xl font-mono text-fg truncate', valueClassName)}>{value}</span>
    </Card>
  )
}
