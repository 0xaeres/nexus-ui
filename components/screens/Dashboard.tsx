'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Database,
  GitBranch,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { PageBody, PageGrid, PageHeader } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import { ApiError, getDashboard, getProductStatus, listSources } from '@/lib/api'
import type { DashboardData, ProductStage, ProductStatus, Source } from '@/lib/types'
import { cn } from '@/lib/utils'

const FLOW: Array<{
  stage: Exclude<ProductStage, 'none'>
  title: string
  caption: string
  icon: typeof Database
  href: (base: string) => string
  cta: string
}> = [
  {
    stage: 'ingesting',
    title: 'Ingest',
    caption: 'Clone repositories, chunk files, enrich context, and build embeddings.',
    icon: Database,
    href: (base) => `${base}/ingest`,
    cta: 'Open ingest',
  },
  {
    stage: 'council',
    title: 'Council',
    caption: 'Run the expert council to draft product skill pack proposals.',
    icon: Sparkles,
    href: (base) => `${base}/council`,
    cta: 'Run Council',
  },
  {
    stage: 'review',
    title: 'Review',
    caption: 'SME reviews, edits, rejects, or approves skill pack proposals.',
    icon: ClipboardCheck,
    href: (base) => `${base}/review`,
    cta: 'Review proposals',
  },
  {
    stage: 'skill',
    title: 'Skill',
    caption: 'Approved skill pack is ready to view and serve through MCP.',
    icon: BookOpen,
    href: (base) => `${base}/skill`,
    cta: 'View skills',
  },
]

export function Dashboard() {
  const { currentProductId, currentProduct, perms } = useProduct()
  const sp = useSearchParams()
  const forceLoading = sp?.get('loading') === '1'
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<ProductStatus | null>(null)
  const [sources, setSources] = useState<Source[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [dashboard, productStatus, sourceList] = await Promise.all([
        getDashboard(currentProductId),
        getProductStatus(currentProductId),
        listSources(currentProductId),
      ])
      setData(dashboard)
      setStatus(productStatus)
      setSources(sourceList)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }, [currentProductId])

  useEffect(() => { void refresh() }, [refresh])

  if (forceLoading) return <DashboardSkeleton />
  if (!data && !status && !error) return <DashboardSkeleton />

  const base = `/p/${currentProductId}`
  const sourceCount = sources?.length ?? 0
  const resourceCount = sources?.reduce((sum, source) => sum + source.resourceCount, 0) ?? 0
  const pendingCount = data?.pending.length ?? 0
  const currentStage = status?.currentStage ?? 'none'
  const nextAction = getNextAction(currentStage, base, sourceCount)

  return (
    <>
      <PageHeader>
        <H1>{currentProduct?.name ?? currentProductId}</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
        <div className="flex-1" />
        <Button asChild variant="secondary">
          <Link href={`${base}/sources`}>
            <GitBranch className="h-4 w-4" />
            Configure sources
          </Link>
        </Button>
        {nextAction && (
          <Button asChild>
            <Link href={nextAction.href}>
              {nextAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </PageHeader>

      <PageBody>
        <PageGrid>
          {error && (
            <div className="col-span-12">
              <Card variant="surface" className="border-danger/30 bg-danger/10 px-5 py-4">
                <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
                <Muted className="font-mono">{error}</Muted>
              </Card>
            </div>
          )}

          <div className="col-span-12 xl:col-span-8">
            <Card variant="glass" className="h-full">
              <CardContent className="flex h-full flex-col gap-6 p-6">
                <div className="flex flex-col gap-2">
                  <SectionLabel>Product flow</SectionLabel>
                  <H3>Configure once, then move through the skill pipeline.</H3>
                  <Muted>
                    Sources belong to this product. Ingestion prepares evidence, Council drafts,
                    SME review gates approval, and approved skills become visible here.
                  </Muted>
                </div>
                <StageProgress current={currentStage} />
                <div className="grid gap-3 md:grid-cols-2">
                  {FLOW.map((item) => (
                    <FlowStep key={item.stage} item={item} current={currentStage} base={base} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 xl:col-span-4">
            <Card variant="surface" className="h-full">
              <CardHeader>
                <SectionLabel>Configuration</SectionLabel>
                <H3>Product sources</H3>
                <Muted>Add GitHub repositories or local filesystem sources for this product.</Muted>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="sources" value={sourceCount.toLocaleString()} />
                  <Stat label="resources" value={resourceCount.toLocaleString()} />
                  <Stat label="pending" value={pendingCount.toLocaleString()} />
                  <Stat label="stage" value={stageLabel(currentStage)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`${base}/sources`}>
                      <GitBranch className="h-3.5 w-3.5" />
                      Sources
                    </Link>
                  </Button>
                  {perms.canManageSources && (
                    <Button asChild size="sm">
                      <Link href={`${base}/sources/new`}>
                        <Plus className="h-3.5 w-3.5" />
                        Add source
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <Card variant="surface">
              <CardHeader>
                <SectionLabel>Sources</SectionLabel>
                <H3>Connected repositories and docs</H3>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {sources && sources.length === 0 && (
                  <Muted>No sources yet. Add one to start the ingestion pipeline.</Muted>
                )}
                {sources?.slice(0, 4).map((source) => (
                  <SourceRow key={source.id} source={source} base={base} />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <Card variant="surface">
              <CardHeader>
                <SectionLabel>Next action</SectionLabel>
                <H3>{nextAction?.label ?? 'Flow complete'}</H3>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Muted>{nextAction?.description ?? 'Approved skill pack is ready. View it or run another council session when sources change.'}</Muted>
                {nextAction ? (
                  <Button asChild>
                    <Link href={nextAction.href}>
                      {nextAction.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="secondary">
                    <Link href={`${base}/skill`}>
                      View skills
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </PageGrid>
      </PageBody>
    </>
  )
}

function getNextAction(stage: ProductStage, base: string, sourceCount: number) {
  if (sourceCount === 0) {
    return {
      label: 'Add source',
      href: `${base}/sources/new`,
      description: 'Connect at least one repository or local source before ingestion can run.',
    }
  }
  if (stage === 'none' || stage === 'ingesting') {
    return {
      label: 'Open ingest',
      href: `${base}/ingest`,
      description: 'Watch the live ingestion pipeline and continue to Council when embeddings are ready.',
    }
  }
  if (stage === 'council') {
    return {
      label: 'Run Council',
      href: `${base}/council`,
      description: 'Embeddings are ready. Start the Council to draft skill pack proposals.',
    }
  }
  if (stage === 'review') {
    return {
      label: 'Review proposals',
      href: `${base}/review`,
      description: 'Skill pack proposals are waiting for SME approval, edit, or rejection.',
    }
  }
  return null
}

function StageProgress({ current }: { current: ProductStage }) {
  const reached = current === 'none' ? -1 : FLOW.findIndex((item) => item.stage === current)
  return (
    <div className="grid grid-cols-4 gap-2">
      {FLOW.map((item, index) => (
        <div
          key={item.stage}
          className={cn(
            'h-1.5 rounded-full',
            index < reached && 'bg-success',
            index === reached && 'bg-accent',
            index > reached && 'bg-border',
            reached === -1 && 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

function FlowStep({
  item,
  current,
  base,
}: {
  item: (typeof FLOW)[number]
  current: ProductStage
  base: string
}) {
  const Icon = item.icon
  const reached = current === 'none' ? -1 : FLOW.findIndex((step) => step.stage === current)
  const index = FLOW.findIndex((step) => step.stage === item.stage)
  const active = index === reached
  const done = index < reached
  return (
    <Link href={item.href(base)} className="group block no-underline">
      <Card
        variant={active ? 'glassAction' : 'surface'}
        className={cn(
          'h-full p-4 transition-colors',
          active && 'border-accent/35',
          done && 'border-success/20',
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-active',
            active && 'text-accent',
            done && 'text-success',
            !active && !done && 'text-fg-subtle',
          )}>
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <H3>{item.title}</H3>
            <Muted className="block">{item.caption}</Muted>
            <Small className="mt-3 inline-flex items-center gap-1 font-mono text-fg-subtle group-hover:text-fg">
              {item.cta}
              <ArrowRight className="h-3 w-3" />
            </Small>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function SourceRow({ source, base }: { source: Source; base: string }) {
  return (
    <Link href={`${base}/sources/${encodeURIComponent(source.name)}`} className="no-underline">
      <div className="flex items-center gap-3 rounded-md border border-border bg-bg/40 px-3 py-2 hover:bg-bg-hover">
        <GitBranch className="h-4 w-4 text-fg-subtle" />
        <div className="min-w-0 flex-1">
          <Small className="block truncate font-mono text-fg">{source.name}</Small>
          <Small className="font-mono text-fg-subtle">{source.type}</Small>
        </div>
        <Badge variant={source.status === 'error' ? 'danger' : 'outline'}>
          {source.status}
        </Badge>
        <Small className="font-mono text-fg-subtle">
          {source.resourceCount.toLocaleString()}
        </Small>
      </div>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-bg-active px-3 py-2">
      <SectionLabel>{label}</SectionLabel>
      <Small className="block truncate font-mono text-fg">{value}</Small>
    </div>
  )
}

function stageLabel(stage: ProductStage): string {
  if (stage === 'none') return 'setup'
  return stage === 'ingesting' ? 'ingest' : stage
}
