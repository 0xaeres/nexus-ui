'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Database, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { H3, Muted, Small } from '@/components/ui/typography'
import { StageError, StageShell } from '@/components/stages/StageShell'
import { IngestionProgress, type IngestStatus } from '@/components/sources/IngestionProgress'
import {
  ApiError,
  createSession,
  getProduct,
  getProductStatus,
  listSources,
} from '@/lib/api'
import type { Product, ProductStatus, Source } from '@/lib/types'

export function IngestStage({ productId }: { productId: string }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<ProductStatus | null>(null)
  const [sources, setSources] = useState<Source[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [launching, setLaunching] = useState(false)
  const statusByIdRef = useRef<Record<string, IngestStatus>>({})
  const [, force] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([getProduct(productId), getProductStatus(productId), listSources(productId)])
      .then(([p, s, srcs]) => {
        if (cancelled) return
        setProduct(p)
        setStatus(s)
        setSources(srcs)
        if (s.currentStage === 'skill') router.replace(`/p/${productId}/skill`)
        else if (s.currentStage === 'review') router.replace(`/p/${productId}/review`)
        else if (s.currentStage === 'council' || s.hasEmbeddings) {
          router.replace(`/p/${productId}/council`)
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [productId, router])

  const onSourceStatus = useCallback((sourceId: string, s: IngestStatus) => {
    statusByIdRef.current[sourceId] = s
    force((n) => n + 1)
  }, [])

  const launchCouncil = async () => {
    setLaunching(true)
    setError(null)
    try {
      const { session_id } = await createSession(productId, {
        topic: `${product?.name ?? productId} overview`,
        skill_kind: 'master',
      })
      router.push(`/p/${productId}/council?session=${session_id}`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
      setLaunching(false)
    }
  }

  const allDone =
    sources && sources.length > 0 &&
    sources.every((s) => {
      const live = statusByIdRef.current[s.id]
      if (live === 'done') return true
      if (live) return false
      return !!s.lastSync && s.resourceCount > 0
    })

  const headerExtra = allDone && (
    <Button onClick={launchCouncil} disabled={launching}>
      {launching ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting…
        </>
      ) : (
        <>
          Continue to Council
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  )

  return (
    <StageShell
      productId={productId}
      productName={product?.name}
      stage="ingesting"
      reached={status?.currentStage ?? 'none'}
      headerExtra={headerExtra}
    >
      {error && <StageError message={error} />}

      {sources && sources.length === 0 && (
        <Card variant="surface" className="p-8 flex flex-col items-center text-center gap-4 max-w-xl mx-auto">
          <div className="h-12 w-12 rounded-full bg-bg-active text-accent flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <H3>No sources connected</H3>
            <Muted>
              Add a source to ingest. We&rsquo;ll clone, chunk, enrich, and embed it.
            </Muted>
          </div>
          <Button asChild>
            <Link href={`/p/${productId}/sources/new`}>
              <Plus className="h-4 w-4" />
              Add a source
            </Link>
          </Button>
        </Card>
      )}

      {sources && sources.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sources.map((s) => (
            <Card key={s.id} variant="surface" className="p-4">
              <IngestionProgress
                productId={productId}
                source={s}
                onStatusChange={(st) => onSourceStatus(s.id, st)}
              />
            </Card>
          ))}
        </div>
      )}

      {sources === null && !error && (
        <Small className="font-mono text-fg-subtle">Loading sources…</Small>
      )}
    </StageShell>
  )
}
