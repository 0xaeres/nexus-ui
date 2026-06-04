'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MarkdownContent } from '@/components/ui/markdown'
import { H3, Muted, Small, Subtle } from '@/components/ui/typography'
import { StageError, StageShell } from '@/components/stages/StageShell'
import {
  ApiError,
  createSession,
  getProduct,
  getProductStatus,
  listProductSkills,
} from '@/lib/api'
import {
  coverageSummary,
  evalStatusLabel,
  evalStatusVariant,
  groupByTier,
  masterSkill,
  SKILL_TIER_ORDER,
  skillRouteId,
  tierLabel,
} from '@/lib/skills'
import type { Product, ProductSkillsResponse, ProductStatus, Skill } from '@/lib/types'

export function SkillStage({ productId }: { productId: string }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<ProductStatus | null>(null)
  const [skills, setSkills] = useState<ProductSkillsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [launchingCouncil, setLaunchingCouncil] = useState(false)

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
        if (hier.skills.length === 0) {
          if (s.currentStage === 'review') router.replace(`/p/${productId}/review`)
          else if (s.hasEmbeddings) router.replace(`/p/${productId}/council`)
          else router.replace(`/p/${productId}/ingest`)
          return
        }
        setSkills(hier)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [productId, router])

  const runCouncil = async () => {
    setLaunchingCouncil(true)
    setError(null)
    try {
      const { session_id } = await createSession(productId, {
        topic: `${product?.name ?? productId} overview`,
      })
      router.push(`/p/${productId}/council?session=${session_id}`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
      setLaunchingCouncil(false)
    }
  }

  return (
    <StageShell
      productId={productId}
      productName={product?.name}
      stage="skill"
      reached={status?.currentStage ?? 'none'}
      headerExtra={
        <Button variant="secondary" size="sm" onClick={runCouncil} disabled={launchingCouncil}>
          {launchingCouncil ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Run another council
            </>
          )}
        </Button>
      }
    >
      {error && <StageError message={error} />}

      {skills && (
        <div className="flex w-full flex-col gap-4">
          <Card variant="glass">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <H3>{product?.name ?? productId} product skill</H3>
                <Muted>Approved product context skill served through MCP.</Muted>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                {masterSkill(skills.skills) && (
                  <Badge variant="success">{Math.round(masterSkill(skills.skills)!.confidence * 100)}% confidence</Badge>
                )}
                <Badge variant="outline" className="font-mono">{skills.skills.length} approved</Badge>
              </div>
            </CardContent>
          </Card>

          {masterSkill(skills.skills) && (
            <SkillPackCard skill={masterSkill(skills.skills)!} productId={productId} featured />
          )}

          {SKILL_TIER_ORDER.filter((tier) => tier !== 'product_master').map((tier) => {
            const items = (skills.grouped[tier] ?? groupByTier(skills.skills)[tier] ?? []) as Skill[]
            if (items.length === 0) return null
            return (
              <div key={tier} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Subtle className="font-mono text-xs uppercase tracking-wider">{tierLabel(tier)}</Subtle>
                  <Badge variant="outline" className="font-mono">{items.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {items.map((skill) => <SkillPackCard key={skill.id} skill={skill} productId={productId} />)}
                </div>
              </div>
            )
          })}

          <Card variant="surface">
            <CardContent className="p-4 flex items-center gap-3 flex-wrap">
              <Subtle className="font-mono text-xs uppercase tracking-wider">Provenance</Subtle>
              <Small className="font-mono">
                {skills.skills.reduce((sum, skill) => sum + skill.provenance.evidence_chunks.length, 0)} evidence chunks
              </Small>
            </CardContent>
          </Card>
        </div>
      )}

      {!skills && !error && (
        <Small className="font-mono text-fg-subtle text-center block">Loading product skill...</Small>
      )}
    </StageShell>
  )
}

function SkillPackCard({ skill, productId, featured = false }: { skill: Skill; productId: string; featured?: boolean }) {
  return (
    <Card variant={featured ? 'glass' : 'surface'}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <H3>{skill.name}</H3>
              <Badge variant="accent">{tierLabel(skill.tier)}</Badge>
              <Badge variant="outline" className="font-mono">v{skill.version}</Badge>
              <Badge variant={evalStatusVariant(skill.eval_status)} className="font-mono">
                {evalStatusLabel(skill.eval_status)}
              </Badge>
            </div>
            <Small className="font-mono text-fg-subtle">{coverageSummary(skill.coverage)}</Small>
            {skill.description && <Small className="block text-fg-subtle">{skill.description}</Small>}
          </div>
          <Badge variant={skill.confidence >= 0.8 ? 'success' : 'outline'} className="font-mono">
            {Math.round(skill.confidence * 100)}%
          </Badge>
          {skill.quality_score > 0 && (
            <Badge variant={evalStatusVariant(skill.eval_status)} className="font-mono">
              q {Math.round(skill.quality_score * 100)}%
            </Badge>
          )}
        </div>
        {(skill.parent || (skill.related?.length ?? 0) > 0) && (
          <div className="flex flex-wrap gap-2">
            {skill.parent && <Badge variant="outline" className="font-mono">parent {skill.parent}</Badge>}
            {(skill.related ?? []).map((id) => <Badge key={id} variant="outline" className="font-mono">rel {id}</Badge>)}
          </div>
        )}
        <MarkdownContent compact className="max-h-48 overflow-auto">
          {skill.body}
        </MarkdownContent>
        <div className="flex items-center gap-2">
          <Small className="font-mono text-fg-subtle">{skill.provenance.evidence_chunks.length} evidence</Small>
          <div className="flex-1" />
          <Button asChild variant="secondary" size="sm">
            <Link href={`/p/${productId}/skills/${skillRouteId(skill.id)}`}>Open</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
