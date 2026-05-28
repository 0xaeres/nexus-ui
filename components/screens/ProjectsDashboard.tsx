'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBody, PageHeader, PageGrid } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small } from '@/components/ui/typography'
import {
  ApiError,
  getProductStatus,
  listProducts,
  listProposals,
  listSources,
  syncSource,
} from '@/lib/api'
import type { Product, ProductStage, ProductStatus, SkillProposal } from '@/lib/types'
import { cn } from '@/lib/utils'

ModuleRegistry.registerModules([AllCommunityModule])

type CardState = ProductStatus | { error: string } | null

function isProductStatus(state: CardState): state is ProductStatus {
  return state !== null && !('error' in state)
}

interface StageVisual {
  label: string
  badge: 'success' | 'accent' | 'warning' | 'secondary' | 'danger'
  icon: typeof Sparkles
  cta: string
  href: (id: string) => string
  primary: boolean
  pending: string
}

interface PendingActionRow {
  id: string
  productId: string
  product: string
  owner: string
  status: string
  badge: StageVisual['badge']
  pending: string
  confidence: number | null
  action: string
  href: string
  primary: boolean
}

const STAGES: ProductStage[] = ['ingesting', 'council', 'review', 'skill']

const gridTheme = themeQuartz.withParams({
  accentColor: 'var(--color-accent)',
  backgroundColor: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  borderRadius: 8,
  browserColorScheme: 'dark',
  cellFontFamily: 'var(--font-sans)',
  cellFontSize: 14,
  cellTextColor: 'var(--color-fg)',
  chromeBackgroundColor: 'var(--color-surface-sunk)',
  dataBackgroundColor: 'var(--color-surface)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  foregroundColor: 'var(--color-fg)',
  headerBackgroundColor: 'var(--color-surface-sunk)',
  headerFontFamily: 'var(--font-mono)',
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: 'var(--color-fg-subtle)',
  oddRowBackgroundColor: 'var(--color-surface)',
  rowBorder: { color: 'var(--color-border)' },
  rowHoverColor: 'var(--color-bg-hover)',
  selectedRowBackgroundColor: 'var(--color-bg-selected)',
  wrapperBackgroundColor: 'var(--color-surface)',
  wrapperBorder: { color: 'var(--color-border)' },
  wrapperBorderRadius: 8,
})

function stageVisual(status: ProductStatus): StageVisual {
  if (status.currentStage === 'skill') {
    return {
      label: 'Skill ready',
      badge: 'success',
      icon: CheckCircle2,
      cta: 'View skills',
      href: (id) => `/p/${id}/skills`,
      primary: false,
      pending: 'No pending action',
    }
  }
  if (status.currentStage === 'review') {
    return {
      label: 'Awaiting review',
      badge: 'warning',
      icon: Inbox,
      cta: 'Review proposals',
      href: (id) => `/p/${id}/review`,
      primary: true,
      pending: 'SME pack proposal review',
    }
  }
  if (status.currentStage === 'council') {
    if (status.councilInProgress) {
      return {
        label: 'Council running',
        badge: 'accent',
        icon: Loader2,
        cta: 'Watch council',
        href: (id) => `/p/${id}/council`,
        primary: false,
        pending: 'Council session in progress',
      }
    }
    return {
      label: 'Ready for council',
      badge: 'accent',
      icon: Sparkles,
      cta: 'Run council',
      href: (id) => `/p/${id}/council`,
      primary: true,
      pending: 'Council draft needed',
    }
  }
  if (status.currentStage === 'ingesting') {
    return {
      label: 'Ingesting',
      badge: 'accent',
      icon: Loader2,
      cta: 'View ingest',
      href: (id) => `/p/${id}/ingest`,
      primary: false,
      pending: 'Source ingestion',
    }
  }
  return {
    label: 'Needs source',
    badge: 'secondary',
    icon: Database,
    cta: 'Add source',
    href: (id) => `/p/${id}/sources/new`,
    primary: true,
    pending: 'Source connection',
  }
}

export function ProjectsDashboard() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [statuses, setStatuses] = useState<Record<string, CardState>>({})
  const [pendingProposals, setPendingProposals] = useState<SkillProposal[]>([])
  const [listError, setListError] = useState<string | null>(null)
  const [syncingProduct, setSyncingProduct] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listProducts()
      .then((prods) => {
        if (cancelled) return
        setProducts(prods)
        Promise.all([
          Promise.all(
            prods.map((p) =>
              getProductStatus(p.id)
                .then((s) => [p.id, s] as const)
                .catch((e: unknown) => [
                  p.id,
                  { error: e instanceof ApiError ? e.message : String(e) },
                ] as const),
            ),
          ),
          listProposals({ status: 'pending' }).catch(() => []),
        ]).then(([entries, proposals]) => {
          if (cancelled) return
          setStatuses(Object.fromEntries(entries))
          setPendingProposals(proposals)
        })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setListError(e instanceof ApiError ? e.message : String(e))
        setProducts([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const resyncProduct = useCallback(async (productId: string) => {
    setSyncingProduct(productId)
    setListError(null)
    try {
      const sources = await listSources(productId)
      if (sources.length === 0) {
        router.push(`/p/${productId}/sources/new`)
        return
      }
      await Promise.allSettled(sources.map((source) => syncSource(productId, source.id)))
      router.push(`/p/${productId}/ingest?sync=1`)
    } catch (e: unknown) {
      setListError(e instanceof ApiError ? e.message : String(e))
      setSyncingProduct(null)
    }
  }, [router])

  const proposalByProduct = useMemo(() => {
    const map = new Map<string, SkillProposal>()
    for (const proposal of pendingProposals) map.set(proposal.product_id, proposal)
    return map
  }, [pendingProposals])

  const stats = useMemo(() => {
    const values = Object.values(statuses).filter(isProductStatus)
    return {
      total: products?.length ?? 0,
      review: values.filter((s) => s.currentStage === 'review').length,
      running: values.filter((s) => s.councilInProgress).length,
      ready: values.filter((s) => s.currentStage === 'skill').length,
    }
  }, [products?.length, statuses])

  const pendingRows = useMemo<PendingActionRow[]>(() => {
    return (products ?? []).flatMap((product) => {
      const state = statuses[product.id] ?? null
      if (!state) return []
      if ('error' in state) {
        return [{
          id: product.id,
          productId: product.id,
          product: product.name,
          owner: product.owner?.team || 'unassigned',
          status: 'Unavailable',
          badge: 'danger',
          pending: 'Status refresh failed',
          confidence: null,
          action: 'Open product',
          href: `/p/${product.id}`,
          primary: false,
        }]
      }
      if (state.currentStage === 'skill') return []
      const visual = stageVisual(state)
      const proposal = proposalByProduct.get(product.id)
      return [{
        id: product.id,
        productId: product.id,
        product: product.name,
        owner: product.owner?.team || 'unassigned',
        status: visual.label,
        badge: visual.badge,
        pending: proposal?.name ?? visual.pending,
        confidence: proposal?.confidence ?? null,
        action: visual.cta,
        href: visual.href(product.id),
        primary: visual.primary,
      }]
    })
  }, [products, proposalByProduct, statuses])

  const columnDefs = useMemo<ColDef<PendingActionRow>[]>(() => [
    {
      field: 'product',
      headerName: 'Product',
      flex: 1.2,
      minWidth: 180,
      cellRenderer: ProductCell,
    },
    { field: 'owner', headerName: 'Owner', flex: 0.8, minWidth: 140 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 150,
      cellRenderer: StatusCell,
    },
    { field: 'pending', headerName: 'Pending item', flex: 1.4, minWidth: 220 },
    {
      field: 'confidence',
      headerName: 'Confidence',
      width: 130,
      valueFormatter: ({ value }) => typeof value === 'number' ? `${Math.round(value * 100)}%` : '—',
    },
    {
      headerName: 'Action',
      width: 150,
      sortable: false,
      filter: false,
      cellRenderer: ActionCell,
    },
  ], [])

  return (
    <>
      <PageHeader>
        <H1>Products</H1>
        <Badge variant="outline" className="font-mono">
          {products?.length ?? '…'} total
        </Badge>
        <div className="flex-1" />
        <Button asChild>
          <Link href="/new">
            <Plus className="h-4 w-4" />
            New product
          </Link>
        </Button>
      </PageHeader>

      <PageBody>
        <PageGrid>
          {listError && (
            <div className="col-span-12">
              <Card variant="surface" className="p-4 border-danger/30 bg-danger/5">
                <Small className="font-mono text-danger">
                  Could not reach backend: {listError}
                </Small>
              </Card>
            </div>
          )}

          {products && products.length === 0 && !listError && (
            <div className="col-span-12">
              <EmptyState />
            </div>
          )}

          {products && products.length > 0 && (
            <>
              <div className="col-span-12 grid gap-3 md:grid-cols-4">
                <StatCard label="Products" value={stats.total.toLocaleString()} icon={Database} />
                <StatCard label="Awaiting review" value={stats.review.toLocaleString()} icon={Inbox} tone="warning" />
                <StatCard label="Council running" value={stats.running.toLocaleString()} icon={Sparkles} tone="accent" />
                <StatCard label="Skills ready" value={stats.ready.toLocaleString()} icon={CheckCircle2} tone="success" />
              </div>

              <div className="col-span-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    state={statuses[product.id] ?? null}
                    syncing={syncingProduct === product.id}
                    onResync={() => void resyncProduct(product.id)}
                  />
                ))}
              </div>

              <div className="col-span-12">
                <Card variant="surface" className="overflow-hidden">
                  <CardHeader className="border-b border-border">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-accent" />
                      <H3>Pending product actions</H3>
                      <div className="flex-1" />
                      <Badge variant="outline" className="font-mono">
                        {pendingRows.length}
                      </Badge>
                    </div>
                    <Muted>Open work across products, with action links in-row.</Muted>
                  </CardHeader>
                  <CardContent className="p-0">
                    {pendingRows.length === 0 ? (
                      <div className="flex min-h-[180px] items-center justify-center p-8 text-center">
                        <Small className="font-mono text-fg-subtle">No pending product actions</Small>
                      </div>
                    ) : (
                      <div className="h-[320px]">
                        <AgGridReact<PendingActionRow>
                          theme={gridTheme}
                          rowData={pendingRows}
                          columnDefs={columnDefs}
                          defaultColDef={{
                            filter: false,
                            resizable: true,
                            sortable: true,
                          }}
                          domLayout="normal"
                          getRowId={({ data }) => data.id}
                          headerHeight={40}
                          rowHeight={48}
                          suppressCellFocus
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </PageGrid>
      </PageBody>
    </>
  )
}

function EmptyState() {
  return (
    <Card variant="surface" className="p-10 flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
      <div className="h-16 w-16 rounded-full bg-bg-active text-accent flex items-center justify-center">
        <Sparkles className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-1">
        <H3>No products yet</H3>
        <Muted>
          Connect a repository, let Nexus ingest it, and the LLM Council will draft your first
          curated skill. You take it from there.
        </Muted>
      </div>
      <Button asChild>
        <Link href="/new">
          <Plus className="h-4 w-4" />
          Create your first product
        </Link>
      </Button>
    </Card>
  )
}

function ProductCard({
  product,
  state,
  syncing,
  onResync,
}: {
  product: Product
  state: CardState
  syncing: boolean
  onResync: () => void
}) {
  const isLoading = state === null
  const isError = state !== null && 'error' in state

  if (isLoading || isError) {
    return (
      <Card variant="surface" className="flex min-h-[190px] flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <H3 className="truncate">{product.name}</H3>
            {product.tagline && <Muted className="truncate">{product.tagline}</Muted>}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {isLoading ? 'loading…' : 'unavailable'}
          </Badge>
        </div>
        <div className="flex-1" />
        {isError && (
          <Small className="font-mono text-danger truncate">
            {(state as { error: string }).error}
          </Small>
        )}
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/p/${product.id}/skills`}>
              <BookOpen className="h-3.5 w-3.5" />
              View skills
            </Link>
          </Button>
        </div>
      </Card>
    )
  }

  const status = state as ProductStatus
  const v = stageVisual(status)
  const Icon = v.icon
  const spin = status.currentStage === 'ingesting' || (status.currentStage === 'council' && status.councilInProgress)

  return (
    <Card variant="glassAction" className="flex min-h-[220px] flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/p/${product.id}`} className="flex flex-col gap-1 min-w-0 no-underline">
          <H3 className="truncate text-fg hover:text-accent transition-colors">{product.name}</H3>
          {product.tagline ? (
            <Muted className="truncate">{product.tagline}</Muted>
          ) : product.owner?.team ? (
            <Small className="font-mono text-fg-subtle truncate">{product.owner.team}</Small>
          ) : (
            <Small className="font-mono text-fg-subtle">{product.id}</Small>
          )}
        </Link>
        <Badge variant={v.badge} className="shrink-0 gap-1.5">
          <Icon className={cn('h-3 w-3', spin && 'animate-spin')} />
          {v.label}
        </Badge>
      </div>

      <StageProgress stage={status.currentStage} />

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Metric label="sources" value={product.sources.toLocaleString()} />
        <Metric label="skills" value={product.skills.toLocaleString()} />
        <Metric label="team" value={product.owner?.team || 'none'} />
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-fg-subtle"
          disabled={syncing}
          onClick={onResync}
        >
          {syncing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Sync
        </Button>
        <div className="flex-1" />
        <Button asChild variant="secondary" size="sm">
          <Link href={`/p/${product.id}/skills`}>
            <BookOpen className="h-3.5 w-3.5" />
            View skills
          </Link>
        </Button>
        <Button asChild variant={v.primary ? 'default' : 'secondary'} size="sm">
          <Link href={v.href(product.id)}>
            {v.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'accent',
}: {
  label: string
  value: string
  icon: typeof Database
  tone?: 'accent' | 'success' | 'warning'
}) {
  return (
    <Card variant="stat" className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-9 w-9 items-center justify-center rounded-md bg-bg-active',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'accent' && 'text-accent',
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <SectionLabel>{label}</SectionLabel>
          <Small className="block truncate font-mono text-fg">{value}</Small>
        </div>
      </div>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-bg-active px-2.5 py-2">
      <SectionLabel>{label}</SectionLabel>
      <Small className="block truncate font-mono text-fg-muted">{value}</Small>
    </div>
  )
}

function StageProgress({ stage }: { stage: ProductStage }) {
  const reached = stage === 'none' ? -1 : STAGES.indexOf(stage)
  return (
    <div className="flex items-center gap-1.5" aria-label={`stage ${stage}`}>
      {STAGES.map((s, i) => (
        <div
          key={s}
          className={cn(
            'h-1 flex-1 rounded-full',
            i < reached && 'bg-success',
            i === reached && 'bg-accent',
            (i > reached || reached === -1) && 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

function ProductCell(params: ICellRendererParams<PendingActionRow>) {
  if (!params.data) return null
  return (
    <Link href={`/p/${params.data.productId}`} className="font-medium text-fg no-underline hover:text-accent">
      {params.data.product}
    </Link>
  )
}

function StatusCell(params: ICellRendererParams<PendingActionRow>) {
  if (!params.data) return null
  return <Badge variant={params.data.badge}>{params.data.status}</Badge>
}

function ActionCell(params: ICellRendererParams<PendingActionRow>) {
  if (!params.data) return null
  return (
    <Button asChild size="sm" variant={params.data.primary ? 'default' : 'secondary'} className="h-7">
      <Link href={params.data.href}>
        {params.data.action}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
  )
}
