'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Info, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { H3, Muted, Small } from '@/components/ui/typography'
import {
  ApiError,
  evalJobStreamUrl,
  getEvalCorpus,
  listEvalRuns,
  startEvalRun,
} from '@/lib/api'
import { useEventStream } from '@/lib/hooks/useEventStream'
import {
  ANSWER_METRICS,
  METRIC_DESCRIPTIONS,
  METRIC_LABELS,
  RETRIEVAL_METRICS,
  crossProductMean,
  formatMetric,
  formatPercent,
  metricTone,
  thresholdFor,
  toneTextClass,
  type EvalRunArtifact,
  type MetricKey,
  type ModeMetrics,
  type ProductEvalInfo,
  type ProductResult,
  type Thresholds,
} from '@/lib/evals'

/** A product's most recent score, plus where/when it came from. */
type MergedProduct = {
  product: ProductResult
  generatedAt: string
  runId: string
  language: string
}

/** Metrics surfaced both in the combined tiles and per-product summary rows. */
const HEADLINE_METRICS: MetricKey[] = ['recall_at_k', 'ndcg_at_k', 'answer_correctness']
const PRIMARY_MODE = 'auto'

export function EvalsScreen() {
  const [corpus, setCorpus] = useState<ProductEvalInfo[]>([])
  const [runs, setRuns] = useState<EvalRunArtifact[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [jobId, setJobId] = useState<string | null>(null)
  const [phase, setPhase] = useState<string>('')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  // null while a run is starting/settling; 'all' or a product_id once known.
  const [runningTarget, setRunningTarget] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([getEvalCorpus(), listEvalRuns()])
      setCorpus(c)
      setRuns(r)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEventStream(jobId ? evalJobStreamUrl(jobId) : null, {
    enabled: !!jobId,
    onEvent: (ev) => {
      const data = ev.data as {
        product_id?: string
        done?: number
        total?: number
        item_id?: string
        message?: string
      }
      if (ev.event === 'ingest_start' && data.product_id) {
        setPhase(`ingesting ${data.product_id}…`)
      } else if (ev.event === 'eval_start') {
        setPhase('preparing evaluator…')
      } else if (ev.event === 'product_start' && data.product_id) {
        setPhase(`scoring ${data.product_id}…`)
        setProgress(null)
      } else if (
        ev.event === 'item_progress' &&
        typeof data.done === 'number' &&
        typeof data.total === 'number'
      ) {
        setProgress({ done: data.done, total: data.total })
        setPhase(`scoring ${data.product_id ?? 'product'} · ${data.item_id ?? 'query'}…`)
      } else if (ev.event === 'product_done') {
        setProgress(null)
      } else if (ev.event === 'job_done') {
        setPhase('')
        setProgress(null)
        setJobId(null)
        setRunningTarget(null)
        void refresh()
      } else if (ev.event === 'error') {
        setPhase('')
        setProgress(null)
        setJobId(null)
        setRunningTarget(null)
        setError(data.message ? `eval job failed: ${data.message}` : 'eval job failed')
        void refresh()
      }
    },
  })

  const launch = useCallback(
    async (products: string[], target: string) => {
      if (products.length === 0) return
      try {
        setError(null)
        setRunningTarget(target)
        setPhase('starting eval job…')
        setProgress(null)
        const ref = await startEvalRun({ products, modes: [PRIMARY_MODE] })
        setJobId(ref.job_id)
      } catch (e) {
        setError(e instanceof ApiError ? e.message : String(e))
        setRunningTarget(null)
        setPhase('')
        setProgress(null)
      }
    },
    [],
  )

  const runAll = useCallback(
    () => launch(corpus.map((p) => p.product_id), 'all'),
    [corpus, launch],
  )
  const runProduct = useCallback((id: string) => launch([id], id), [launch])

  // Latest score per product, newest run wins — a single-product run refreshes
  // only that product and leaves every other score untouched.
  const merged = useMemo<MergedProduct[]>(() => {
    const langByProduct = new Map(corpus.map((p) => [p.product_id, p.language]))
    const order = corpus.map((p) => p.product_id)
    const byProduct = new Map<string, MergedProduct>()
    for (const run of runs) {
      for (const product of run.products) {
        if (byProduct.has(product.product_id)) continue
        byProduct.set(product.product_id, {
          product,
          generatedAt: run.generated_at,
          runId: run.run_id,
          language: langByProduct.get(product.product_id) ?? '?',
        })
      }
    }
    return [...byProduct.values()].sort(
      (a, b) => order.indexOf(a.product.product_id) - order.indexOf(b.product.product_id),
    )
  }, [runs, corpus])

  const mergedProducts = useMemo(() => merged.map((m) => m.product), [merged])
  const thresholds = runs[0]?.thresholds ?? null
  const running = runningTarget !== null

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="size-5 animate-spin text-fg-muted" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <H3>Evals</H3>
            <Muted>Context quality for the shipping retrieval path, scored per product.</Muted>
          </div>
          <Button size="sm" onClick={() => void runAll()} disabled={running || corpus.length === 0}>
            {running && runningTarget === 'all' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run all
          </Button>
        </div>

        {running && (
          <div
            className="space-y-2 rounded-md border border-accent/25 bg-accent/10 px-3 py-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-accent">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{phase || 'running eval…'}</span>
              {progress && (
                <span className="font-mono text-fg-muted">
                  {progress.done}/{progress.total}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-fg-muted">
                <Info className="size-3.5" />
                Keep this page open for live progress. Existing scores remain visible.
              </span>
            </div>
            <Progress
              value={progress ? (progress.done / Math.max(progress.total, 1)) * 100 : 4}
              className={progress ? undefined : 'animate-pulse'}
              aria-label={progress ? `${progress.done} of ${progress.total} eval queries complete` : phase}
            />
          </div>
        )}
        {error && (
          <Card variant="surface" className="border-danger/40">
            <CardContent className="text-sm text-danger">{error}</CardContent>
          </Card>
        )}

        {merged.length === 0 || !thresholds ? (
          <Card variant="surface">
            <CardContent className="py-6 text-sm text-fg-muted">
              No runs yet. Run all products to populate the dashboard.
            </CardContent>
          </Card>
        ) : (
          <>
            <CombinedSummary products={mergedProducts} thresholds={thresholds} />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Small className="uppercase tracking-wide text-fg-muted">Per-product</Small>
                <Small className="text-fg-subtle">expand a product for full metrics</Small>
              </div>
              <div className="space-y-2">
                {merged.map((m) => (
                  <ProductRow
                    key={m.product.product_id}
                    entry={m}
                    thresholds={thresholds}
                    running={running && runningTarget === m.product.product_id}
                    disabled={running}
                    onRun={() => void runProduct(m.product.product_id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---- combined summary -----------------------------------------------------

function CombinedSummary({
  products,
  thresholds,
}: {
  products: ProductResult[]
  thresholds: Thresholds
}) {
  const passed = products.every((p) => p.passed)
  const tiles: Array<{ label: string; value: string; detail: string; metric?: MetricKey }> = [
    {
      label: 'Evidence recall',
      value: formatMetric(crossProductMean(products, PRIMARY_MODE, 'recall_at_k')),
      detail: 'expected evidence found',
      metric: 'recall_at_k',
    },
    {
      label: 'Ranking quality',
      value: formatMetric(crossProductMean(products, PRIMARY_MODE, 'ndcg_at_k')),
      detail: 'best evidence lifted',
      metric: 'ndcg_at_k',
    },
    {
      label: 'Answer correctness',
      value: formatMetric(crossProductMean(products, PRIMARY_MODE, 'answer_correctness')),
      detail: 'answers pass judged evals',
      metric: 'answer_correctness',
    },
    {
      label: 'Graph navigation',
      value: formatPercent(meanDiagnostic(products, PRIMARY_MODE, 'graph_hit_rate')),
      detail: 'queries using graph context',
    },
  ]

  return (
    <Card variant="stat">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant={passed ? 'success' : 'danger'}>{passed ? 'PASS' : 'FAIL'}</Badge>
          <Small className="text-fg-muted">
            {products.length} product{products.length === 1 ? '' : 's'} · combined
          </Small>
        </div>
        <Small className="text-fg-subtle">mean across products, shipping retrieval</Small>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((tile) => {
          const threshold = tile.metric ? thresholdFor(thresholds, tile.metric) : undefined
          const tone = tile.metric
            ? metricTone(crossProductMean(products, PRIMARY_MODE, tile.metric), threshold)
            : 'neutral'
          return (
            <div key={tile.label} className="space-y-1">
              <Small>{tile.label}</Small>
              <div className={`font-mono text-2xl font-semibold ${toneTextClass(tone)}`}>
                {tile.value}
              </div>
              <Small className="text-fg-subtle">{tile.detail}</Small>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ---- per-product row (collapsed by default) -------------------------------

function ProductRow({
  entry,
  thresholds,
  running,
  disabled,
  onRun,
}: {
  entry: MergedProduct
  thresholds: Thresholds
  running: boolean
  disabled: boolean
  onRun: () => void
}) {
  const [open, setOpen] = useState(false)
  const { product, generatedAt, language } = entry
  const primary = product.modes.find((m) => m.mode === PRIMARY_MODE) ?? product.modes[0]

  return (
    <Card variant="surface" className="overflow-hidden">
      {/* summary line */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            className={`size-4 shrink-0 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
          <span
            className={`size-2 shrink-0 rounded-full ${product.passed ? 'bg-success' : 'bg-danger'}`}
            aria-hidden
          />
          <span className="truncate font-medium text-fg">{product.product_id}</span>
          <Small className="hidden text-fg-subtle sm:inline">
            {language} · n={product.n} · {relTime(generatedAt)}
          </Small>
        </button>

        <div className="flex items-center gap-3">
          {HEADLINE_METRICS.map((key) => {
            const v = primary ? (primary[key] as number | null) : null
            const tone = metricTone(v, thresholdFor(thresholds, key))
            return (
              <div key={key} className="hidden text-right md:block">
                <div className={`font-mono text-sm ${toneTextClass(tone)}`}>{formatMetric(v)}</div>
                <div className="text-xs uppercase tracking-wide text-fg-subtle">
                  {SHORT_LABEL[key]}
                </div>
              </div>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRun}
            disabled={disabled}
            title={`Re-run evals for ${product.product_id}`}
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run
          </Button>
        </div>
      </div>

      {/* expanded detail */}
      {open && (
        <div className="border-t border-border px-4 py-4">
          <ProductDetail product={product} thresholds={thresholds} />
        </div>
      )}
    </Card>
  )
}

function ProductDetail({
  product,
  thresholds,
}: {
  product: ProductResult
  thresholds: Thresholds
}) {
  const [showMisses, setShowMisses] = useState(false)
  const primary = product.modes.find((m) => m.mode === PRIMARY_MODE) ?? product.modes[0]
  const misses = primary?.misses ?? []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-2">
        <MetricGroup
          label="Retrieval"
          keys={RETRIEVAL_METRICS}
          metrics={primary}
          thresholds={thresholds}
        />
        <MetricGroup
          label="Answer quality"
          keys={ANSWER_METRICS}
          metrics={primary}
          thresholds={thresholds}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-3">
        <DiagStat label="graph hits" value={formatPercent(primary?.graph_hit_rate ?? null)} />
        <DiagStat label="candidates" value={primary ? primary.avg_candidates.toFixed(0) : 'N/A'} />
        <DiagStat label="latency" value={primary ? formatLatency(primary.avg_latency_ms) : 'N/A'} />
      </div>

      {misses.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowMisses((v) => !v)}
            className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
          >
            <ChevronDown className={`size-3.5 transition-transform ${showMisses ? 'rotate-180' : ''}`} />
            {misses.length} retrieval miss{misses.length === 1 ? '' : 'es'}
          </button>
          {showMisses && (
            <ul className="mt-1.5 space-y-1 border-l border-border pl-3 text-xs text-fg-muted">
              {misses.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/** One metric group: label + bullet bar per metric. Descriptions live in hover tooltips. */
function MetricGroup({
  label,
  keys,
  metrics,
  thresholds,
}: {
  label: string
  keys: readonly MetricKey[]
  metrics: ModeMetrics | undefined
  thresholds: Thresholds
}) {
  return (
    <div className="space-y-2.5">
      <Small className="uppercase tracking-wide text-fg-subtle">{label}</Small>
      {keys.map((key) => {
        const value = metrics ? (metrics[key] as number | null) : null
        const threshold = thresholdFor(thresholds, key)
        return (
          <BulletRow
            key={key}
            label={METRIC_LABELS[key]}
            description={METRIC_DESCRIPTIONS[key]}
            value={value}
            threshold={threshold}
          />
        )
      })}
    </div>
  )
}

/** Thin horizontal bar against a track, gate rendered as a tick. */
function BulletRow({
  label,
  description,
  value,
  threshold,
}: {
  label: string
  description: string
  value: number | null
  threshold?: number
}) {
  const tone = metricTone(value, threshold)
  const pct = value == null ? 0 : Math.max(0, Math.min(1, value)) * 100
  const tip = threshold != null ? `${description} Gate ${formatMetric(threshold)}.` : description
  return (
    <div className="flex items-center gap-3" title={tip}>
      <Small className="w-36 shrink-0 truncate text-fg-muted">{label}</Small>
      <div className="relative h-1.5 flex-1 rounded-full bg-surface-sunk">
        {value != null && (
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${TONE_BAR[tone]}`}
            style={{ width: `${pct}%` }}
          />
        )}
        {threshold != null && (
          <div
            className="absolute -inset-y-1 w-px bg-fg-subtle"
            style={{ left: `${threshold * 100}%` }}
          />
        )}
      </div>
      <div className={`w-14 shrink-0 text-right font-mono text-sm ${toneTextClass(tone)}`}>
        {formatMetric(value)}
      </div>
    </div>
  )
}

function DiagStat({ label, value }: { label: string; value: string }) {
  return (
    <Small className="text-fg-muted">
      {label} <span className="font-mono text-fg">{value}</span>
    </Small>
  )
}

// ---- helpers --------------------------------------------------------------

const SHORT_LABEL: Record<string, string> = {
  recall_at_k: 'recall',
  ndcg_at_k: 'ndcg',
  answer_correctness: 'answer',
}

/** Bar fill per tone — status colors are earned (gate comparison), not decoration. */
const TONE_BAR: Record<ReturnType<typeof metricTone>, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-fg-subtle',
}

function formatLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms)) return ''
  const m = Math.round(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

function meanDiagnostic(
  products: ProductResult[],
  mode: string,
  key: 'avg_latency_ms' | 'avg_candidates' | 'graph_hit_rate',
): number | null {
  const vals = products
    .map((p) => p.modes.find((m) => m.mode === mode)?.[key])
    .filter((v): v is number => v != null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
