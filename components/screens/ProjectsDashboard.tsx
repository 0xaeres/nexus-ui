'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, Loader2, Sparkles, CheckCircle2, Inbox, Database, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBody, PageHeader, PageGrid } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { ApiError, getProductStatus, listProducts, listSources, syncSource } from '@/lib/api'
import type { Product, ProductStage, ProductStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type CardState = ProductStatus | { error: string } | null

interface StageVisual {
  label: string
  badge: 'success' | 'accent' | 'warning' | 'secondary'
  icon: typeof Sparkles
  cta: string
  href: (id: string) => string
  primary: boolean
}

type BoardKey = 'ingest' | 'council' | 'review' | 'skill'

const BOARD: Array<{
  key: BoardKey
  title: string
  caption: string
  icon: typeof Database
}> = [
  { key: 'ingest', title: 'Ingest', caption: 'Sources and embeddings', icon: Database },
  { key: 'council', title: 'Council', caption: 'Draft skill proposal', icon: Sparkles },
  { key: 'review', title: 'Review', caption: 'SME approval loop', icon: Inbox },
  { key: 'skill', title: 'Skill Ready', caption: 'Approved knowledge', icon: CheckCircle2 },
]

function stageVisual(status: ProductStatus): StageVisual {
  if (status.currentStage === 'skill') {
    return {
      label: 'Skill ready',
      badge: 'success',
      icon: CheckCircle2,
      cta: 'View skill',
      href: (id) => `/p/${id}/skill`,
      primary: false,
    }
  }
  if (status.currentStage === 'review') {
    return {
      label: 'Awaiting your review',
      badge: 'warning',
      icon: Inbox,
      cta: 'Review proposal',
      href: (id) => `/p/${id}/review`,
      primary: true,
    }
  }
  if (status.currentStage === 'council') {
    if (status.councilInProgress) {
      return {
        label: 'Council in progress',
        badge: 'accent',
        icon: Loader2,
        cta: 'Watch deliberation',
        href: (id) => `/p/${id}/council`,
        primary: false,
      }
    }
    return {
      label: 'Embeddings ready',
      badge: 'accent',
      icon: Sparkles,
      cta: 'Run Council',
      href: (id) => `/p/${id}/council`,
      primary: true,
    }
  }
  if (status.currentStage === 'ingesting') {
    return {
      label: 'Ingesting source',
      badge: 'accent',
      icon: Loader2,
      cta: 'View progress',
      href: (id) => `/p/${id}/ingest`,
      primary: false,
    }
  }
  return {
    label: 'No source yet',
    badge: 'secondary',
    icon: Database,
    cta: 'Add a source',
    href: (id) => `/p/${id}/ingest`,
    primary: true,
  }
}

export function ProjectsDashboard() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [statuses, setStatuses] = useState<Record<string, CardState>>({})
  const [listError, setListError] = useState<string | null>(null)
  const [syncingProduct, setSyncingProduct] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listProducts()
      .then((prods) => {
        if (cancelled) return
        setProducts(prods)
        Promise.all(
          prods.map((p) =>
            getProductStatus(p.id)
              .then((s) => [p.id, s] as const)
              .catch((e: unknown) => [
                p.id,
                { error: e instanceof ApiError ? e.message : String(e) },
              ] as const),
          ),
        ).then((entries) => {
          if (cancelled) return
          setStatuses(Object.fromEntries(entries))
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

  const grouped = BOARD.map((stage) => ({
    ...stage,
    products: (products ?? []).filter((product) => boardKeyForState(statuses[product.id] ?? null) === stage.key),
  }))

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

          {products && products.length > 0 && grouped.map((stage) => (
            <div key={stage.key} className="col-span-12 lg:col-span-6 2xl:col-span-3">
              <FlowColumn stage={stage}>
                {stage.products.length === 0 ? (
                  <EmptyColumn />
                ) : (
                  stage.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      state={statuses[product.id] ?? null}
                      syncing={syncingProduct === product.id}
                      onResync={() => void resyncProduct(product.id)}
                    />
                  ))
                )}
              </FlowColumn>
            </div>
          ))}
        </PageGrid>
      </PageBody>
    </>
  )
}

function boardKeyForState(state: CardState): BoardKey {
  if (!state || 'error' in state) return 'ingest'
  if (state.currentStage === 'skill') return 'skill'
  if (state.currentStage === 'review') return 'review'
  if (state.currentStage === 'council') return 'council'
  return 'ingest'
}

function FlowColumn({
  stage,
  children,
}: {
  stage: (typeof BOARD)[number] & { products: Product[] }
  children: React.ReactNode
}) {
  const Icon = stage.icon
  return (
    <Card variant="surface" className="flex min-h-[420px] flex-col overflow-hidden">
      <CardHeader className="border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          <H3>{stage.title}</H3>
          <div className="flex-1" />
          <Badge variant="outline" className="font-mono">{stage.products.length}</Badge>
        </div>
        <Subtle>{stage.caption}</Subtle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {children}
      </CardContent>
    </Card>
  )
}

function EmptyColumn() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border bg-bg/40 p-5 text-center">
      <Small className="font-mono text-fg-subtle">No products here</Small>
    </div>
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
      <Card variant="surface" className="flex min-h-[170px] flex-col gap-3 p-4">
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
      </Card>
    )
  }

  const status = state as ProductStatus
  const v = stageVisual(status)
  const Icon = v.icon
  const spin = status.currentStage === 'ingesting' || (status.currentStage === 'council' && status.councilInProgress)

  return (
    <Card variant="glassAction" className="flex min-h-[190px] flex-col gap-4 p-4">
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

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Metric label="state" value={v.label} />
        <Metric label="id" value={product.id} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
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
        <Button
          asChild
          variant={v.primary ? 'default' : 'secondary'}
          size="sm"
        >
          <Link href={v.href(product.id)}>
            {v.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
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

const STAGES: ProductStage[] = ['ingesting', 'council', 'review', 'skill']

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
            i > reached && 'bg-border',
          )}
        />
      ))}
    </div>
  )
}
