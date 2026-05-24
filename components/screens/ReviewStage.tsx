'use client'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FileText, Loader2, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Body, Code, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { StageError, StageShell } from '@/components/stages/StageShell'
import {
  ApiError,
  approveProposal,
  getProduct,
  getProductStatus,
  listProductSkills,
  listProposals,
  rejectProposal,
  reviseProposal,
} from '@/lib/api'
import { useProduct } from '@/lib/product-context'
import type { Citation, Product, ProductStatus, SkillProposal } from '@/lib/types'

type ActionBusy = 'approve' | 'reject' | 'revise' | null
type ReviewComment = { line: number; body: string }

export function ReviewStage({ productId }: { productId: string }) {
  const router = useRouter()
  const { currentUser } = useProduct()
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<ProductStatus | null>(null)
  const [proposal, setProposal] = useState<SkillProposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<ActionBusy>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reviseOpen, setReviseOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [revisionAsk, setRevisionAsk] = useState('')
  const [previousBody, setPreviousBody] = useState('')
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getProduct(productId),
      getProductStatus(productId),
      listProposals({ productId, status: 'pending' }),
      listProductSkills(productId).catch(() => ({ skills: [] })),
    ])
      .then(([p, s, pending, skills]) => {
        if (cancelled) return
        setProduct(p)
        setStatus(s)
        if (s.currentStage === 'skill') {
          router.replace(`/p/${productId}/skill`)
          return
        }
        if (pending.length === 0) {
          if (s.hasEmbeddings) router.replace(`/p/${productId}/council`)
          else router.replace(`/p/${productId}/ingest`)
          return
        }
        setProposal(pending[0])
        setPreviousBody(skills.skills.find((skill) => skill.name === pending[0].name)?.body ?? '')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [productId, router])

  const actor = currentUser?.name ?? 'unknown'

  const approve = async () => {
    if (!proposal || busy) return
    setBusy('approve')
    setError(null)
    try {
      await approveProposal(proposal.id, actor)
      router.push(`/p/${productId}/skill`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
      setBusy(null)
    }
  }

  const submitReject = async () => {
    if (!proposal || busy) return
    const reason = rejectReason.trim()
    if (!reason) {
      setError('Rejection reason is required.')
      return
    }
    setBusy('reject')
    setError(null)
    try {
      await rejectProposal(proposal.id, { reason, actor })
      router.replace(`/p/${productId}/council`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
      setBusy(null)
    }
  }

  const submitRevision = async () => {
    if (!proposal || busy) return
    const summary = revisionAsk.trim()
    if (!summary && reviewComments.length === 0) {
      setError('Revision request is required.')
      return
    }
    setBusy('revise')
    setError(null)
    try {
      const { session_id } = await reviseProposal(proposal.id, {
        summary: summary || 'Apply submitted line comments.',
        actor,
        comments: reviewComments,
      })
      router.push(`/p/${productId}/council/${session_id}`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
      setBusy(null)
    }
  }

  return (
    <StageShell
      productId={productId}
      productName={product?.name}
      stage="review"
      reached={status?.currentStage ?? 'none'}
    >
      {error && <StageError message={error} />}

      {proposal && (
        <div className="grid w-full grid-cols-12 gap-4">
          <Card variant="glass" className="col-span-12">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="h-4 w-4 text-accent" />
                <H3>{proposal.name}</H3>
                <div className="flex-1" />
                <Badge variant="outline" className="font-mono">
                  {Math.round(proposal.confidence * 100)}% confidence
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {proposal.citations.length} citations
                </Badge>
              </div>
              {proposal.adversary_critique && proposal.adversary_critique.severity !== 'minor' && (
                <div className="px-3 py-2 rounded-md border border-warning/30 bg-warning/5">
                  <Small className="font-medium text-warning">
                    Critic: {proposal.adversary_critique.severity} ·{' '}
                    {proposal.adversary_critique.recommendation || 'see issues'}
                  </Small>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="surface" className="col-span-12 lg:col-span-8 overflow-hidden">
            <CardHeader className="border-b border-border">
              <SectionLabel>Proposal markdown</SectionLabel>
              <Muted>Read-only draft generated by the LLM Council.</Muted>
            </CardHeader>
            <CardContent>
              <ProposalMarkdown body={proposal.body} />
            </CardContent>
          </Card>

          <Card variant="surface" className="col-span-12 lg:col-span-8 overflow-hidden">
            <CardHeader className="border-b border-border">
              <SectionLabel>Diff review</SectionLabel>
              <Muted>
                {previousBody ? 'Against approved skill body.' : 'New proposal body.'}
              </Muted>
            </CardHeader>
            <CardContent>
              <DiffViewer
                oldBody={previousBody}
                newBody={proposal.body}
                comments={reviewComments}
                onComment={(comment) => setReviewComments((items) => items.concat(comment))}
              />
            </CardContent>
          </Card>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <CitationsPanel citations={proposal.citations} />
            <Card variant="surface">
              <CardHeader>
                <SectionLabel>SME decision</SectionLabel>
                <Muted>Approve, reject, or ask the Council for a revised proposal.</Muted>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button onClick={approve} disabled={Boolean(busy)}>
                  {busy === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve
                </Button>
                <Button variant="secondary" onClick={() => setReviseOpen(true)} disabled={Boolean(busy)}>
                  <RotateCcw className="h-4 w-4" />
                  Revise
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setRejectOpen(true)}
                  disabled={Boolean(busy)}
                  className="text-danger"
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!proposal && !error && (
        <Small className="font-mono text-fg-subtle text-center block">Loading proposal…</Small>
      )}

      <Dialog open={rejectOpen} onOpenChange={(open) => { if (!busy) setRejectOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject proposal</DialogTitle>
            <DialogDescription>
              This closes the draft without creating a skill.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection"
            className="min-h-28"
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setRejectOpen(false)} disabled={Boolean(busy)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitReject} disabled={Boolean(busy)} className="text-danger">
              {busy === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviseOpen} onOpenChange={(open) => { if (!busy) setReviseOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>
              The Council will use this ask to produce an updated proposal.
            </DialogDescription>
          </DialogHeader>
          {reviewComments.length > 0 && (
            <div className="rounded-md border border-border bg-bg/40 px-3 py-2">
              <SectionLabel>{reviewComments.length} line comments attached</SectionLabel>
              <div className="mt-2 flex flex-col gap-1">
                {reviewComments.map((comment, index) => (
                  <Small key={`${comment.line}:${index}`} className="font-mono text-fg-subtle">
                    line {comment.line}: {comment.body}
                  </Small>
                ))}
              </div>
            </div>
          )}
          <Textarea
            value={revisionAsk}
            onChange={(e) => setRevisionAsk(e.target.value)}
            placeholder="Tell the Council what is wrong or missing"
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setReviseOpen(false)} disabled={Boolean(busy)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitRevision} disabled={Boolean(busy)}>
              {busy === 'revise' && <Loader2 className="h-4 w-4 animate-spin" />}
              Start revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StageShell>
  )
}

function ProposalMarkdown({ body }: { body: string }) {
  const lines = body.split('\n')
  let inCode = false
  const code: string[] = []
  const nodes: ReactNode[] = []

  const flushCode = (key: string) => {
    if (code.length === 0) return
    nodes.push(
      <pre key={key} className="overflow-x-auto rounded-md border border-border bg-surface-sunk p-3 text-sm leading-relaxed text-fg-muted font-mono">
        {code.join('\n')}
      </pre>,
    )
    code.length = 0
  }

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCode) flushCode(`code-${index}`)
      inCode = !inCode
      return
    }
    if (inCode) {
      code.push(line)
      return
    }
    if (!line.trim()) {
      nodes.push(<div key={`spacer-${index}`} className="h-2" />)
      return
    }
    if (line.startsWith('# ')) {
      nodes.push(<H3 key={index}>{line.slice(2)}</H3>)
      return
    }
    if (line.startsWith('## ')) {
      nodes.push(<SectionLabel key={index} className="pt-2 text-accent">{line.slice(3)}</SectionLabel>)
      return
    }
    if (line.startsWith('### ')) {
      nodes.push(<SectionLabel key={index} className="pt-2">{line.slice(4)}</SectionLabel>)
      return
    }
    if (/^[-*]\s+/.test(line)) {
      nodes.push(
        <Body key={index} className="pl-4">
          <span className="font-mono text-accent">- </span>
          {line.replace(/^[-*]\s+/, '')}
        </Body>,
      )
      return
    }
    nodes.push(<Body key={index}>{line}</Body>)
  })
  flushCode('code-final')

  return <div className="flex flex-col gap-2">{nodes}</div>
}

function CitationsPanel({ citations }: { citations: Citation[] }) {
  return (
    <Card variant="surface">
      <CardHeader>
        <SectionLabel>Citations</SectionLabel>
        <Muted>{citations.length} evidence anchors</Muted>
      </CardHeader>
      <CardContent className="flex max-h-[360px] flex-col gap-2 overflow-auto">
        {citations.length === 0 && (
          <Small className="font-mono text-fg-subtle">No citations attached.</Small>
        )}
        {citations.map((citation, index) => (
          <div key={`${citation.file}:${citation.line}:${index}`} className="rounded-md border border-border bg-bg/40 px-3 py-2">
            <div className="flex items-center gap-1">
              <Code className="truncate">{citation.file}</Code>
              <Subtle className="font-mono">:{citation.line}</Subtle>
            </div>
            {citation.excerpt && (
              <Small className="mt-1 block text-fg-subtle">{citation.excerpt}</Small>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

type DiffRow = {
  key: string
  kind: 'add' | 'del' | 'ctx'
  oldLine: number | null
  newLine: number | null
  text: string
}

function DiffViewer({
  oldBody,
  newBody,
  comments,
  onComment,
}: {
  oldBody: string
  newBody: string
  comments: ReviewComment[]
  onComment: (comment: ReviewComment) => void
}) {
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const rows = buildLineDiff(oldBody, newBody)

  const saveComment = () => {
    const body = draft.trim()
    if (activeLine === null || !body) return
    onComment({ line: activeLine, body })
    setActiveLine(null)
    setDraft('')
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface-sunk font-mono text-sm">
      {rows.map((row) => {
        const line = row.newLine ?? row.oldLine ?? 0
        const rowComments = comments.filter((comment) => comment.line === line)
        return (
          <div key={row.key}>
            <div
              className={[
                'grid grid-cols-[3rem_3rem_minmax(0,1fr)_6rem] items-start border-b border-border/60',
                row.kind === 'add' ? 'bg-success/10 text-success' : '',
                row.kind === 'del' ? 'bg-danger/10 text-danger' : '',
                row.kind === 'ctx' ? 'text-fg-muted' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="select-none px-2 py-1 text-right text-fg-subtle">{row.oldLine ?? ''}</span>
              <span className="select-none px-2 py-1 text-right text-fg-subtle">{row.newLine ?? ''}</span>
              <span className="whitespace-pre-wrap px-2 py-1">
                {row.kind === 'add' ? '+' : row.kind === 'del' ? '-' : ' '}
                {row.text}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveLine(line)
                  setDraft('')
                }}
                className="px-2 py-1 text-left text-xs text-fg-subtle hover:text-accent"
              >
                Comment
              </button>
            </div>
            {rowComments.map((comment, index) => (
              <div key={`${row.key}-comment-${index}`} className="border-b border-border/60 bg-bg-active px-4 py-2">
                <Small className="font-mono text-accent">line {comment.line}</Small>
                <Body className="text-sm">{comment.body}</Body>
              </div>
            ))}
            {activeLine === line && (
              <div className="border-b border-border/60 bg-bg px-4 py-3">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Comment on line ${line}`}
                  className="min-h-24"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setActiveLine(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveComment}>
                    Add comment
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function buildLineDiff(oldBody: string, newBody: string): DiffRow[] {
  const oldLines = oldBody ? oldBody.split('\n') : []
  const newLines = newBody ? newBody.split('\n') : []
  const dp = Array.from({ length: oldLines.length + 1 }, () =>
    Array<number>(newLines.length + 1).fill(0),
  )

  for (let i = oldLines.length - 1; i >= 0; i -= 1) {
    for (let j = newLines.length - 1; j >= 0; j -= 1) {
      dp[i][j] = oldLines[i] === newLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const rows: DiffRow[] = []
  let i = 0
  let j = 0
  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      rows.push({
        key: `ctx-${i}-${j}`,
        kind: 'ctx',
        oldLine: i + 1,
        newLine: j + 1,
        text: oldLines[i],
      })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({
        key: `del-${i}-${j}`,
        kind: 'del',
        oldLine: i + 1,
        newLine: null,
        text: oldLines[i],
      })
      i += 1
    } else {
      rows.push({
        key: `add-${i}-${j}`,
        kind: 'add',
        oldLine: null,
        newLine: j + 1,
        text: newLines[j],
      })
      j += 1
    }
  }
  while (i < oldLines.length) {
    rows.push({
      key: `del-${i}-end`,
      kind: 'del',
      oldLine: i + 1,
      newLine: null,
      text: oldLines[i],
    })
    i += 1
  }
  while (j < newLines.length) {
    rows.push({
      key: `add-end-${j}`,
      kind: 'add',
      oldLine: null,
      newLine: j + 1,
      text: newLines[j],
    })
    j += 1
  }
  return rows
}
