'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { H3, Muted, Small, Subtle } from '@/components/ui/typography'
import { StageError, StageShell } from '@/components/stages/StageShell'
import {
  ApiError,
  getProduct,
  getProductStatus,
  listProductSkills,
} from '@/lib/api'
import type { Product, ProductStatus, Skill } from '@/lib/types'

export function SkillStage({ productId }: { productId: string }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<ProductStatus | null>(null)
  const [skill, setSkill] = useState<Skill | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getProduct(productId),
      getProductStatus(productId),
      listProductSkills(productId),
    ])
      .then(([p, s, hier]) => {
        if (cancelled) return
        setProduct(p)
        setStatus(s)
        if (!hier.master) {
          if (s.currentStage === 'review') router.replace(`/p/${productId}/review`)
          else if (s.hasEmbeddings) router.replace(`/p/${productId}/council`)
          else router.replace(`/p/${productId}/ingest`)
          return
        }
        setSkill(hier.master)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [productId, router])

  return (
    <StageShell
      productId={productId}
      productName={product?.name}
      stage="skill"
      reached={status?.currentStage ?? 'none'}
      headerExtra={
        <Button asChild variant="secondary" size="sm">
          <Link href={`/p/${productId}/council`}>
            <RefreshCw className="h-3.5 w-3.5" />
            Run another council
          </Link>
        </Button>
      }
    >
      {error && <StageError message={error} />}

      {skill && (
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <Card variant="surface" className="p-5 flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <H3>{skill.name}</H3>
              <Muted>Approved master skill for {product?.name ?? productId}</Muted>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Badge variant="success">{Math.round(skill.confidence * 100)}% confidence</Badge>
              <Badge variant="outline" className="font-mono">v{skill.version}</Badge>
              <Badge variant="outline" className="font-mono">{skill.kind}</Badge>
            </div>
          </Card>

          <Card variant="surface" className="p-0 overflow-hidden">
            <div className="px-4 py-2 border-b border-border">
              <Subtle className="font-mono text-xs uppercase tracking-wider">Skill body</Subtle>
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap text-fg leading-relaxed p-4 m-0">
              {skill.body}
            </pre>
          </Card>

          <Card variant="surface" className="px-4 py-3 flex items-center gap-3 flex-wrap">
            <Subtle className="font-mono text-xs uppercase tracking-wider">Provenance</Subtle>
            <Small className="font-mono">validated by {skill.provenance.validated_by}</Small>
            <Small className="font-mono">at {skill.provenance.validated_at}</Small>
            {skill.provenance.council_session && (
              <Small className="font-mono">· session {skill.provenance.council_session}</Small>
            )}
            <Small className="font-mono">
              · {skill.provenance.evidence_chunks.length} evidence chunks
            </Small>
          </Card>
        </div>
      )}

      {!skill && !error && (
        <Small className="font-mono text-fg-subtle text-center block">Loading skill…</Small>
      )}
    </StageShell>
  )
}
