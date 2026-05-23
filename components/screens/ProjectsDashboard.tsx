'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus, Loader2, Sparkles, CheckCircle2, Inbox, Database, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBody, PageHeader } from '@/components/ui/page'
import { H1, H3, Muted, Small } from '@/components/ui/typography'
import { ApiError, getProductStatus, listProducts } from '@/lib/api'
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
  const [products, setProducts] = useState<Product[] | null>(null)
  const [statuses, setStatuses] = useState<Record<string, CardState>>({})
  const [listError, setListError] = useState<string | null>(null)

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
        {listError && (
          <Card variant="surface" className="p-4 border-danger/30 bg-danger/5">
            <Small className="font-mono text-danger">
              Could not reach backend: {listError}
            </Small>
          </Card>
        )}

        {products && products.length === 0 && !listError && (
          <EmptyState />
        )}

        {products && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} state={statuses[p.id] ?? null} />
            ))}
          </div>
        )}
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

function ProductCard({ product, state }: { product: Product; state: CardState }) {
  const isLoading = state === null
  const isError = state !== null && 'error' in state

  if (isLoading || isError) {
    return (
      <Card variant="action" className="p-5 flex flex-col gap-3 min-h-[180px]">
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
    <Card variant="action" className="p-5 flex flex-col gap-3 min-h-[180px]">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/p/${product.id}`} className="flex flex-col gap-1 min-w-0 no-underline">
          <H3 className="truncate text-fg hover:text-accent transition-colors">{product.name}</H3>
          {product.tagline ? (
            <Muted className="truncate">{product.tagline}</Muted>
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

      <div className="flex-1" />
      <div className="flex items-center justify-between">
        {status.currentStage !== 'none' ? (
          <Button asChild variant="ghost" size="sm" className="text-fg-subtle h-7 px-2">
            <Link href={`/p/${product.id}/sources`}>
              <RefreshCw className="h-3 w-3" />
              Re-sync
            </Link>
          </Button>
        ) : (
          <span />
        )}
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
