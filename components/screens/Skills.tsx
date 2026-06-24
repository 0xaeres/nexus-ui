'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Hexagon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkillsSkeleton } from '@/components/skeletons/SkillsSkeleton'
import { PageBody, PageHeader } from '@/components/ui/page'
import { MarkdownContent } from '@/components/ui/markdown'
import { H1, H3, SectionLabel, Subtle, Code, Muted } from '@/components/ui/typography'
import { SkillAppliesToCard, SkillConfidenceCard } from '@/components/screens/skill-facts'
import { useProduct } from '@/lib/product-context'
import { ApiError, listProductSkills } from '@/lib/api'
import type { ProductSkillsResponse, Skill } from '@/lib/types'
import {
  coverageSummary,
  evalStatusLabel,
  evalStatusVariant,
  masterSkill,
} from '@/lib/skills'

export function Skills() {
  const { currentProductId, currentProduct } = useProduct()
  const sp = useSearchParams()
  const forceLoading = sp?.get('loading') === '1'

  const [data, setData] = useState<ProductSkillsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const d = await listProductSkills(currentProductId)
      setData(d)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [currentProductId])

  useEffect(() => { void refresh() }, [refresh])

  const totalCount = data?.skills.length ?? 0
  const packSkill = useMemo(() => data ? masterSkill(data.skills) : null, [data])
  const skill = packSkill ?? data?.skills[0] ?? null
  const evidenceCount = useMemo(
    () => data?.skills.reduce((sum, skill) => sum + skill.provenance.evidence_chunks.length, 0) ?? 0,
    [data],
  )
  const coverage = skill ? coverageSummary(skill.coverage) : null
  const hasCoverage = coverage !== null && coverage !== 'no scoped coverage'

  if (forceLoading || (!data && !error)) return <SkillsSkeleton />

  if (error) {
    return (
      <>
        <PageHeader>
          <H1>Skills</H1>
        </PageHeader>
        <div className="p-5">
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <H1>Skills</H1>
        {skill && <Badge variant={evalStatusVariant(skill.eval_status)}>{evalStatusLabel(skill.eval_status)}</Badge>}
        {totalCount > 0 && <Badge variant="outline" className="font-mono">{totalCount} approved</Badge>}
      </PageHeader>

      <PageBody>
        <div className="flex max-w-5xl flex-col gap-5">
          <SkillPackSummary
            productName={currentProduct?.name ?? currentProductId}
            evidenceCount={evidenceCount}
            master={skill}
          />
          {skill ? (
            <SkillDetail skill={skill} showCoverage={hasCoverage} />
          ) : (
            <Card variant="surface" className="p-8">
              <H3>No approved skill yet</H3>
              <Muted>Run Council and approve a proposal to publish this product skill.</Muted>
            </Card>
          )}
        </div>
      </PageBody>
    </>
  )
}

function SkillPackSummary({
  productName,
  evidenceCount,
  master,
}: {
  productName: string
  evidenceCount: number
  master: Skill | null
}) {
  return (
    <Card variant="glass">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="h-12 w-12 rounded-md border border-border bg-bg-active text-fg-muted flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <H3>{productName} product skill</H3>
          <Muted>Approved product context served through MCP.</Muted>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {master && (
            <Badge variant="success">{Math.round(master.confidence * 100)}% confidence</Badge>
          )}
          {evidenceCount > 0 && <Badge variant="outline" className="font-mono">{evidenceCount} evidence</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}

function SkillDetail({ skill, showCoverage }: { skill: Skill; showCoverage: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <Hexagon className="h-6 w-6 shrink-0 mt-1 text-fg-subtle" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Code>{skill.name}</Code>
            <Badge variant={evalStatusVariant(skill.eval_status)}>
              {evalStatusLabel(skill.eval_status)}
            </Badge>
          </div>
          <Subtle className="font-mono">
            v{skill.version}{showCoverage ? ` · ${coverageSummary(skill.coverage)}` : ''}
          </Subtle>
          {skill.description && <Subtle>{skill.description}</Subtle>}
        </div>
      </div>

      <SkillConfidenceCard skill={skill} />

      <SkillAppliesToCard skill={skill} />

      <Card variant="surface">
        <CardHeader>
          <SectionLabel>Body</SectionLabel>
        </CardHeader>
        <CardContent>
          <MarkdownContent>{skill.body}</MarkdownContent>
        </CardContent>
      </Card>
    </div>
  )
}
