'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { ApiError, createSession, listSessions } from '@/lib/api'
import {
  COUNCIL_AGENT_HUES,
  COUNCIL_AGENT_LABELS,
  COUNCIL_ROSTERS,
  type CouncilSessionSummary,
  type SkillKind,
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

const KIND_LABELS: Record<SkillKind, string> = {
  master: 'Master',
  product_domain: 'Product domain',
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
        {error && (
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        )}

        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <SectionLabel>Recent sessions</SectionLabel>
            <Subtle className="font-mono">{sessions?.length ?? 0}</Subtle>
          </div>

          {(!sessions || sessions.length === 0) ? (
            <Card variant="surface" className="p-8 flex flex-col items-center gap-3 text-center">
              <Users className="h-8 w-8 text-fg-subtle" />
              <Muted>No council sessions yet for this product.</Muted>
              {perms.canRunCouncil && (
                <Button onClick={() => setOpen(true)} size="sm">
                  <Plus className="h-4 w-4" />
                  Start the first one
                </Button>
              )}
            </Card>
          ) : (
            <Card variant="surface" className="overflow-hidden p-0">
              <Table className="text-base">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[160px]">Started</TableHead>
                    <TableHead className="w-[140px]">Kind</TableHead>
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
                        <Badge variant="outline" className="font-mono text-xs">
                          {s.skill_kind}
                        </Badge>
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
          )}
        </section>
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
  const [kind, setKind] = useState<SkillKind>('product_domain')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    setSubmitting(true)
    setErr(null)
    try {
      const r = await createSession(productId, { topic: topic.trim(), skill_kind: kind })
      onCreated(r.session_id)
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const roster = COUNCIL_ROSTERS[kind]

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a council session</DialogTitle>
          <DialogDescription>
            Pick a skill kind and topic. The council runs in the background.
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
            <SectionLabel>Kind</SectionLabel>
            <div className="flex gap-2">
              {(Object.keys(KIND_LABELS) as SkillKind[]).map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`px-3 py-2 rounded-md border font-mono text-sm transition-colors ${
                    kind === k
                      ? 'bg-bg-active border-border-strong text-fg'
                      : 'bg-surface border-border text-fg-muted hover:bg-bg-active'
                  }`}
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Roster preview</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {roster.map(r => (
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
              {roster.length} agents · max-1 redraft cycle
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
