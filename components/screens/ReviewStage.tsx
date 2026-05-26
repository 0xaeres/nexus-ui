'use client'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, FileText, Loader2, RotateCcw, X } from 'lucide-react'
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

          <Card variant="surface" className="col-span-12 overflow-hidden">
            <CardHeader className="border-b border-border">
              <SectionLabel>Diff review</SectionLabel>
              <Muted>
                {previousBody ? 'Against approved skill body.' : 'New proposal body.'}
              </Muted>
            </CardHeader>
            <CardContent className="p-0">
              <DiffViewer
                oldBody={previousBody}
                newBody={proposal.body}
                comments={reviewComments}
                onComment={(comment) => setReviewComments((items) => items.concat(comment))}
              />
            </CardContent>
          </Card>

          <Card variant="surface" className="col-span-12 lg:col-span-8">
            <CitationsPanel citations={proposal.citations} />
          </Card>

          <Card variant="surface" className="col-span-12 lg:col-span-4">
            <CardHeader>
              <SectionLabel>SME decision</SectionLabel>
              <Muted>Approve, reject, or ask the Council for a revised proposal.</Muted>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
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
    <>
      <CardHeader>
        <SectionLabel>Citations</SectionLabel>
        <Muted>{citations.length} evidence anchors</Muted>
      </CardHeader>
      <CardContent className="grid max-h-[260px] gap-2 overflow-auto md:grid-cols-2">
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
    </>
  )
}

type DiffRow = {
  key: string
  kind: 'add' | 'del' | 'ctx'
  oldLine: number | null
  newLine: number | null
  text: string
}

type DiffPaneRow =
  | { type: 'row'; key: string; kind: 'add' | 'del' | 'ctx' | 'change'; oldLine: number | null; newLine: number | null; oldText: string; newText: string }
  | { type: 'collapse'; key: string; count: number }

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
  const [scrollLeft, setScrollLeft] = useState(0)
  const [diffWidth, setDiffWidth] = useState(0)
  const [measuredTextWidth, setMeasuredTextWidth] = useState(640)
  const diffRef = useRef<HTMLDivElement>(null)
  const rows = buildSplitDiff(oldBody, newBody)
  const added = rows.filter((row) => row.type === 'row' && (row.kind === 'add' || row.kind === 'change')).length
  const removed = rows.filter((row) => row.type === 'row' && (row.kind === 'del' || row.kind === 'change')).length
  const longestLine = rows.reduce((longest, row) => {
    if (row.type === 'collapse') return longest
    return Math.max(longest, row.oldText.length, row.newText.length)
  }, 0)
  const paneTextWidth = Math.max(640, measuredTextWidth, Math.ceil(longestLine * 12) + 48)
  const paneViewportWidth = Math.max(0, diffWidth / 2 - 96)
  const scrollRange = Math.max(0, paneTextWidth - paneViewportWidth)
  const clampedScrollLeft = Math.min(scrollLeft, scrollRange)

  useEffect(() => {
    const node = diffRef.current
    if (!node) return
    const updateWidth = () => setDiffWidth(node.clientWidth)
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setScrollLeft((current) => Math.min(current, scrollRange))
  }, [scrollRange])

  useEffect(() => {
    const node = diffRef.current
    if (!node) return
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return
    context.font = window.getComputedStyle(node).font
    const widest = rows.reduce((width, row) => {
      if (row.type === 'collapse') return width
      return Math.max(width, context.measureText(row.oldText).width, context.measureText(row.newText).width)
    }, 0)
    setMeasuredTextWidth(Math.ceil(widest) + 56)
  }, [oldBody, newBody])

  const panDiff = (next: number) => {
    setScrollLeft(Math.max(0, Math.min(scrollRange, next)))
  }

  const saveComment = () => {
    const body = draft.trim()
    if (activeLine === null || !body) return
    onComment({ line: activeLine, body })
    setActiveLine(null)
    setDraft('')
  }

  return (
    <div ref={diffRef} className="overflow-hidden bg-surface-sunk font-mono text-sm">
      <div>
        <div className="flex items-center gap-3 border-b border-border bg-bg px-4 py-3">
          <SectionLabel className="text-fg">skill proposal</SectionLabel>
          <div className="flex-1" />
          <Small className="font-mono text-success">+{added}</Small>
          <Small className="font-mono text-danger">-{removed}</Small>
        </div>
        <div
          className="nexus-scrollbar-visible max-h-[70vh] min-h-[420px] overflow-y-auto"
          onWheel={(event) => {
            if (scrollRange === 0 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
            event.preventDefault()
            panDiff(scrollLeft + event.deltaX)
          }}
        >
          {rows.map((row) => {
            if (row.type === 'collapse') {
              return (
                <div key={row.key} className="grid grid-cols-2 border-b border-border">
                  <CollapseBand count={row.count} />
                  <CollapseBand count={row.count} />
                </div>
              )
            }
            const line = row.newLine ?? row.oldLine ?? 0
            const rowComments = comments.filter((comment) => comment.line === line)
            const changed = row.kind === 'add' || row.kind === 'del' || row.kind === 'change'
            return (
              <div key={row.key}>
                <div className="group relative grid grid-cols-2 border-b border-border/60">
                  <DiffCell
                    side="old"
                    line={row.oldLine}
                    text={row.oldText}
                    kind={row.kind}
                    blank={row.kind === 'add'}
                    scrollLeft={clampedScrollLeft}
                    paneTextWidth={paneTextWidth}
                  />
                  <DiffCell
                    side="new"
                    line={row.newLine}
                    text={row.newText}
                    kind={row.kind}
                    blank={row.kind === 'del'}
                    scrollLeft={clampedScrollLeft}
                    paneTextWidth={paneTextWidth}
                  />
                  {changed && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLine(line)
                        setDraft('')
                      }}
                      className="absolute left-1/2 top-1 -translate-x-1/2 rounded-md border border-border-strong bg-fg px-2 py-0.5 text-base leading-none text-bg opacity-0 shadow-card transition-opacity group-hover:opacity-100"
                      aria-label={`Comment on line ${line}`}
                    >
                      +
                    </button>
                  )}
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
        <div className="border-t border-border bg-bg px-4 py-2">
          <input
            type="range"
            min={0}
            max={scrollRange}
            value={clampedScrollLeft}
            onChange={(event) => panDiff(Number(event.currentTarget.value))}
            disabled={scrollRange === 0}
            className="diff-scroll-range w-full"
            aria-label="Scroll diff horizontally"
          />
        </div>
      </div>
    </div>
  )
}

function CollapseBand({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3 border-r border-border bg-bg-active px-3 py-2 text-fg-subtle">
      <ChevronDown className="h-4 w-4" />
      <Small className="font-mono">{count} unmodified lines</Small>
    </div>
  )
}

function DiffCell({
  side,
  line,
  text,
  kind,
  blank,
  scrollLeft,
  paneTextWidth,
}: {
  side: 'old' | 'new'
  line: number | null
  text: string
  kind: 'add' | 'del' | 'ctx' | 'change'
  blank: boolean
  scrollLeft: number
  paneTextWidth: number
}) {
  const deleted = side === 'old' && (kind === 'del' || kind === 'change')
  const added = side === 'new' && (kind === 'add' || kind === 'change')
  return (
    <div
      className={[
        'grid min-h-8 grid-cols-[4rem_minmax(0,1fr)] overflow-hidden border-r border-border',
        deleted ? 'bg-danger/20 text-danger' : '',
        added ? 'bg-success/15 text-success' : '',
        !deleted && !added && !blank ? 'bg-surface-sunk text-fg-muted' : '',
        blank ? 'bg-[repeating-linear-gradient(135deg,var(--color-bg)_0,var(--color-bg)_8px,var(--color-surface)_8px,var(--color-surface)_10px)] text-fg-subtle' : '',
      ].filter(Boolean).join(' ')}
    >
      <span
        className={[
          'select-none border-r border-border px-3 py-1 text-right',
          deleted ? 'text-danger' : '',
          added ? 'text-success' : '',
          !deleted && !added ? 'text-fg-subtle' : '',
        ].filter(Boolean).join(' ')}
      >
        {line ?? ''}
      </span>
      <span className="overflow-hidden px-4 py-1">
        <span
          className="block whitespace-pre will-change-transform"
          style={{ width: paneTextWidth, transform: `translateX(-${scrollLeft}px)` }}
        >
          {blank ? '' : text || ' '}
        </span>
      </span>
    </div>
  )
}

function buildSplitDiff(oldBody: string, newBody: string): DiffPaneRow[] {
  return collapseContext(pairRows(buildLineDiff(oldBody, newBody)))
}

function pairRows(rows: DiffRow[]): DiffPaneRow[] {
  const paired: DiffPaneRow[] = []
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const next = rows[i + 1]
    if (row.kind === 'del' && next?.kind === 'add') {
      paired.push({
        type: 'row',
        key: `change-${row.key}-${next.key}`,
        kind: 'change',
        oldLine: row.oldLine,
        newLine: next.newLine,
        oldText: row.text,
        newText: next.text,
      })
      i += 1
      continue
    }
    paired.push({
      type: 'row',
      key: row.key,
      kind: row.kind,
      oldLine: row.oldLine,
      newLine: row.newLine,
      oldText: row.kind === 'add' ? '' : row.text,
      newText: row.kind === 'del' ? '' : row.text,
    })
  }
  return paired
}

function collapseContext(rows: DiffPaneRow[]): DiffPaneRow[] {
  const out: DiffPaneRow[] = []
  let index = 0
  while (index < rows.length) {
    const row = rows[index]
    if (row.type !== 'row' || row.kind !== 'ctx') {
      out.push(row)
      index += 1
      continue
    }

    const start = index
    while (index < rows.length) {
      const current = rows[index]
      if (current.type !== 'row' || current.kind !== 'ctx') break
      index += 1
    }
    const chunk = rows.slice(start, index)
    if (chunk.length <= 10) {
      out.push(...chunk)
      continue
    }
    out.push(...chunk.slice(0, 3))
    out.push({ type: 'collapse', key: `collapse-${start}-${index}`, count: chunk.length - 6 })
    out.push(...chunk.slice(-3))
  }
  return out
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
