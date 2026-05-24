'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Edit3, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { H3, Muted, Small, Subtle } from '@/components/ui/typography'
import { StageError, StageShell } from '@/components/stages/StageShell'
import {
  ApiError,
  approveProposal,
  editProposal,
  getProduct,
  getProductStatus,
  listProposals,
  rejectProposal,
} from '@/lib/api'
import { useProduct } from '@/lib/product-context'
import type { Product, ProductStatus, SkillProposal } from '@/lib/types'

export function ReviewStage({ productId }: { productId: string }) {
  const router = useRouter()
  const { currentUser } = useProduct()
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<ProductStatus | null>(null)
  const [proposal, setProposal] = useState<SkillProposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getProduct(productId),
      getProductStatus(productId),
      listProposals({ productId, status: 'pending' }),
    ])
      .then(([p, s, pending]) => {
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
        setDraft(pending[0].body)
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
    if (!proposal) return
    setBusy(true)
    setError(null)
    try {
      if (editing && draft !== proposal.body) {
        await editProposal(proposal.id, draft, actor)
      }
      await approveProposal(proposal.id, actor)
      router.push(`/p/${productId}/skill`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
      setBusy(false)
    }
  }

  const reject = async () => {
    if (!proposal) return
    const reason = window.prompt('Reason for rejection?') || ''
    if (!reason) return
    setBusy(true)
    setError(null)
    try {
      await rejectProposal(proposal.id, { reason, actor })
      router.replace(`/p/${productId}/council`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
      setBusy(false)
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
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <Card variant="surface" className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
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
                  Adversary critique: {proposal.adversary_critique.severity} —{' '}
                  {proposal.adversary_critique.recommendation || 'see issues'}
                </Small>
              </div>
            )}
          </Card>

          <Card variant="surface" className="p-0 overflow-hidden">
            <div className="flex items-center px-4 py-2 border-b border-border">
              <Subtle className="font-mono text-xs uppercase tracking-wider">
                {editing ? 'Editing draft' : 'Draft body'}
              </Subtle>
              <div className="flex-1" />
              {!editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
              {editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false)
                    setDraft(proposal.body)
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
            {editing ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="block w-full min-h-[420px] bg-bg text-fg font-mono text-sm p-4 outline-none resize-vertical"
                spellCheck={false}
              />
            ) : (
              <pre className="text-sm font-mono whitespace-pre-wrap text-fg-muted leading-relaxed p-4 m-0">
                {proposal.body}
              </pre>
            )}
          </Card>

          <div className="flex items-center gap-3">
            <Muted className="font-mono">
              Approving will save the skill and end the flow.
            </Muted>
            <div className="flex-1" />
            <Button
              variant="secondary"
              onClick={reject}
              disabled={busy}
              className="text-danger"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button onClick={approve} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!proposal && !error && (
        <Small className="font-mono text-fg-subtle text-center block">Loading proposal…</Small>
      )}
    </StageShell>
  )
}
