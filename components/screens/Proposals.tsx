'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, Loader2, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageBody, PageHeader } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle, Code } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import {
  ApiError,
  approveProposal,
  editProposal,
  listProposals,
  rejectProposal,
} from '@/lib/api'
import type { RejectCategory, SkillProposal } from '@/lib/types'
import { cn } from '@/lib/utils'

const REJECT_CATEGORIES: Array<{ value: RejectCategory; label: string }> = [
  { value: 'factual', label: 'Factually wrong' },
  { value: 'out-of-scope', label: 'Out of scope' },
  { value: 'duplicate', label: 'Duplicate of existing skill' },
  { value: 'other', label: 'Other' },
]

/**
 * Connected reference screen for the Slice 4 backend.
 * Lists pending proposals and routes approve/reject through the FastAPI surface.
 */
export function Proposals() {
  const { currentProductId, currentUser } = useProduct()
  const [items, setItems] = useState<SkillProposal[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<SkillProposal | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectCategory, setRejectCategory] = useState<RejectCategory>('factual')

  const refresh = useCallback(async () => {
    try {
      const list = await listProposals({
        status: 'pending',
        productId: currentProductId,
      })
      setItems(list)
      setError(null)
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e)
      setError(msg)
      setItems([])
    }
  }, [currentProductId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const onApprove = async (id: string) => {
    setPending(id)
    try {
      await approveProposal(id, currentUser?.name ?? 'unknown')
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setPending(null)
    }
  }

  const onEditAndApprove = async (id: string, body: string) => {
    setPending(id)
    try {
      await editProposal(id, body, currentUser?.name ?? 'unknown')
      await approveProposal(id, currentUser?.name ?? 'unknown')
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setPending(null)
    }
  }

  const openReject = (p: SkillProposal) => {
    setRejectTarget(p)
    setRejectReason('')
    setRejectCategory('factual')
  }

  const confirmReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    const id = rejectTarget.id
    setPending(id)
    try {
      await rejectProposal(id, {
        reason: rejectReason.trim(),
        category: rejectCategory,
        actor: currentUser?.name ?? 'unknown',
      })
      setRejectTarget(null)
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <PageHeader>
        <H1>Proposals</H1>
        <Badge variant="outline" className="font-mono">
          {currentProductId}
        </Badge>
        <div className="flex-1" />
        <Subtle className="font-mono">
          {items?.length ?? '…'} pending
        </Subtle>
      </PageHeader>

      <PageBody>
        {error && (
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        )}

        {items === null && !error ? (
          <Card variant="surface" className="px-5 py-4">
            <Muted>Loading…</Muted>
          </Card>
        ) : items && items.length === 0 ? (
          <Card variant="surface" className="px-5 py-4">
            <H3>No pending proposals</H3>
            <Small>
              Kick off a council with{' '}
              <code className="font-mono">
                nexus council draft --product {currentProductId} --topic ...
              </code>
            </Small>
          </Card>
        ) : (
          <Card variant="surface" className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead>Name</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Citations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items ?? []).map((p) => (
                  <ProposalRow
                    key={p.id}
                    proposal={p}
                    busy={pending === p.id}
                    onApprove={() => onApprove(p.id)}
                    onReject={() => openReject(p)}
                    onEditAndApprove={(body) => onEditAndApprove(p.id, body)}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <Separator />
        <Muted className="font-mono">
          Endpoint: {process.env.NEXT_PUBLIC_NEXUS_API ?? 'http://localhost:8000'}
        </Muted>
      </PageBody>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={open => { if (!open && pending !== rejectTarget?.id) setRejectTarget(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject proposal</DialogTitle>
            <DialogDescription>
              Tell the council why. This reason persists and is fed back as an anti-prior on the
              next session, so future drafts avoid the same mistake.
            </DialogDescription>
          </DialogHeader>
          {rejectTarget && (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-baseline gap-2">
                <Subtle className="font-mono uppercase tracking-wider text-xs w-20">Target</Subtle>
                <Code className="text-xs truncate">{rejectTarget.name}</Code>
              </div>
              <div className="flex flex-col gap-1.5">
                <Subtle className="font-mono uppercase tracking-wider text-xs">Category</Subtle>
                <select
                  value={rejectCategory}
                  onChange={e => setRejectCategory(e.target.value as RejectCategory)}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-fg"
                >
                  {REJECT_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Subtle className="font-mono uppercase tracking-wider text-xs">Reason</Subtle>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Why is this proposal wrong? Be specific — this becomes a permanent house rule."
                  rows={4}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-fg resize-y"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRejectTarget(null)}
              disabled={!!pending && pending === rejectTarget?.id}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmReject}
              disabled={!rejectReason.trim() || (!!pending && pending === rejectTarget?.id)}
              className="bg-danger/15 text-danger border border-danger/35 hover:bg-danger/25"
            >
              {pending === rejectTarget?.id && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProposalRow({
  proposal,
  busy,
  onApprove,
  onReject,
  onEditAndApprove,
}: {
  proposal: SkillProposal
  busy: boolean
  onApprove: () => void
  onReject: () => void
  onEditAndApprove: (body: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(proposal.body)
  const conf = Math.round((proposal.confidence ?? 0) * 100)
  const hasAdversary = !!proposal.adversary_critique

  const startEdit = () => {
    setDraft(proposal.body)
    setEditing(true)
    setExpanded(true)
  }
  const cancelEdit = () => {
    setEditing(false)
    setDraft(proposal.body)
  }
  const submitEdit = () => {
    if (draft.trim() === proposal.body.trim()) {
      onApprove()
    } else {
      onEditAndApprove(draft)
    }
    setEditing(false)
  }

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <TableCell className="w-8 text-fg-subtle">
          {expanded
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell className="font-mono text-sm">{proposal.name}</TableCell>
        <TableCell>
          <Badge variant="outline" className="font-mono">{proposal.skill_kind}</Badge>
        </TableCell>
        <TableCell className={cn('font-mono text-sm', conf >= 80 ? 'text-success' : conf >= 50 ? 'text-warning' : 'text-danger')}>
          {conf}%
        </TableCell>
        <TableCell className="font-mono text-sm">
          {proposal.citations?.length ?? 0}
        </TableCell>
        <TableCell className="font-mono text-sm text-fg-subtle">
          {proposal.created_at?.slice(0, 19) ?? ''}
        </TableCell>
        <TableCell className="text-right space-x-2" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ghost" disabled={busy} onClick={onReject}>Reject</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="sm" disabled={busy} onClick={onApprove}>
            {busy ? 'Working…' : 'Approve'}
          </Button>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="p-0">
            <div className="bg-bg-active border-t border-border px-6 py-5 flex flex-col gap-5">

              {/* Adversary critique */}
              {hasAdversary && proposal.adversary_critique && (
                <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                    <SectionLabel className="text-warning">
                      Adversary critique — severity: {proposal.adversary_critique.severity}
                    </SectionLabel>
                  </div>
                  {proposal.adversary_critique.issues.map((issue, i) => (
                    <div key={i} className="text-sm text-fg-muted">
                      <span className="font-mono text-fg-subtle mr-2">›</span>
                      {issue.description}
                      {issue.counter_example && (
                        <Code className="ml-2 text-xs">{issue.counter_example}</Code>
                      )}
                    </div>
                  ))}
                  <Small className="text-fg-muted">
                    Recommendation: {proposal.adversary_critique.recommendation}
                  </Small>
                </div>
              )}

              {/* Citations */}
              {proposal.citations && proposal.citations.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionLabel>Citations ({proposal.citations.length})</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {proposal.citations.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded border border-border bg-surface px-2 py-1">
                        <Code className="text-xs text-accent">{c.file}:{c.line}</Code>
                        {c.excerpt && (
                          <Subtle className="text-xs truncate max-w-[200px]">{c.excerpt}</Subtle>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed body — editable in edit mode */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <SectionLabel>Proposed skill body</SectionLabel>
                  {editing && (
                    <Badge variant="outline" className="font-mono text-xs">editing</Badge>
                  )}
                </div>
                {editing ? (
                  <>
                    <textarea
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      rows={16}
                      className="font-mono text-xs leading-relaxed text-fg bg-surface rounded-md p-4 border border-border overflow-x-auto resize-y"
                    />
                    <Small className="text-fg-subtle">
                      Your edit is captured as a correction and seeded into the next council run as a house rule.
                    </Small>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={busy}>
                        Cancel
                      </Button>
                      <div className="flex-1" />
                      <Button size="sm" onClick={submitEdit} disabled={busy || !draft.trim()}>
                        {busy ? 'Saving…' : 'Save edit & approve'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-fg-muted bg-surface rounded-md p-4 border border-border overflow-x-auto max-h-96">
                    {proposal.body}
                  </pre>
                )}
              </div>

            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
