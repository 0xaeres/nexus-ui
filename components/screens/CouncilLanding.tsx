'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { ApiError, createSession, listSessions } from '@/lib/api'
import {
  COUNCIL_AGENT_HUES,
  COUNCIL_AGENT_LABELS,
  COUNCIL_ROSTER,
  type CouncilSessionSummary,
} from '@/lib/types'
import { useProduct } from '@/lib/product-context'

const STATUS_VARIANT: Record<string, 'accent' | 'warning' | 'success' | 'danger'> = {
  drafting: 'accent',
  running: 'accent',
  awaiting_approval: 'warning',
  completed: 'success',
  failed: 'danger',
  rejected: 'danger',
}

export function CouncilLanding() {
  const { currentProductId, perms } = useProduct()
  const base = `/p/${currentProductId}`
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState<CouncilSessionSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const list = await listSessions(currentProductId)
      setSessions(list)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
      setSessions([])
    }
  }, [currentProductId])

  useEffect(() => { void refresh() }, [refresh])

  return (
    <>
      <PageHeader>
        <H1>Council</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
        <div className="flex-1" />
        {perms.canRunCouncil && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Start council session
          </Button>
        )}
      </PageHeader>

      <PageBody>
        <PageGrid>
          {error && (
            <div className="col-span-12">
              <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
                <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
                <Muted className="font-mono">{error}</Muted>
              </Card>
            </div>
          )}

          <div className="col-span-12">
            <div className="flex items-center gap-2.5 mb-4">
              <SectionLabel>Recent sessions</SectionLabel>
              <Subtle className="font-mono">{sessions?.length ?? 0}</Subtle>
            </div>
          </div>

          {(!sessions || sessions.length === 0) ? (
            <div className="col-span-12">
              <Card variant="glass" className="p-8 flex flex-col items-center gap-3 text-center">
                <Users className="h-8 w-8 text-fg-subtle" />
                <Muted>No council sessions yet for this product.</Muted>
                {perms.canRunCouncil && (
                  <Button onClick={() => setOpen(true)} size="sm">
                    <Plus className="h-4 w-4" />
                    Start the first one
                  </Button>
                )}
              </Card>
            </div>
          ) : (
            <div className="col-span-12">
              <Card variant="surface" className="overflow-hidden p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[160px]">Started</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead>Topic</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map(s => (
                      <TableRow
                        key={s.id}
                        onClick={() => router.push(`${base}/council/${s.id}`)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-mono text-sm text-fg-subtle">
                          {s.started_at?.slice(0, 19) ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[s.status] ?? 'accent'}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-fg truncate max-w-[480px]">
                          {s.topic}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </PageGrid>
      </PageBody>

      <NewSessionDialog
        open={open}
        onClose={() => setOpen(false)}
        productId={currentProductId}
        onCreated={async sid => {
          setOpen(false)
          await refresh()
          router.push(`${base}/council/${sid}`)
        }}
      />
    </>
  )
}

function NewSessionDialog({
  open,
  onClose,
  productId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  productId: string
  onCreated: (sid: string) => void
}) {
  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    setSubmitting(true)
    setErr(null)
    try {
      const r = await createSession(productId, { topic: topic.trim() })
      onCreated(r.session_id)
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a council session</DialogTitle>
          <DialogDescription>
            Drafter → Critic → Reviser. Runs in the background; you'll be redirected
            to the live deliberation view.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Topic</SectionLabel>
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. PDA seed validation"
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Roster</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {COUNCIL_ROSTER.map(r => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface border border-border text-xs font-mono"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: COUNCIL_AGENT_HUES[r] }}
                  />
                  {COUNCIL_AGENT_LABELS[r]}
                </span>
              ))}
            </div>
            <Small className="text-fg-subtle font-mono">
              {COUNCIL_ROSTER.length} agents · max-1 revision pass
            </Small>
          </div>
          {err && (
            <Small className="text-danger font-mono">{err}</Small>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting || !topic.trim()}>
              {submitting ? 'Starting…' : 'Start session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
