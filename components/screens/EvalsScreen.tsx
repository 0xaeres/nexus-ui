'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Loader2, Play, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { H3, Muted, Small } from '@/components/ui/typography'
import { MetricGroupedBarChart } from '@/components/evals/MetricGroupedBarChart'
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
  RETRIEVAL_METRICS,
  crossProductMean,
  formatMetric,
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

const ABLATION_KEYS: MetricKey[] = [
  'recall_at_k',
  'ndcg_at_k',
  'answer_correctness',
  'context_recall',
]

export function EvalsScreen() {
  const [corpus, setCorpus] = useState<ProductEvalInfo[]>([])
  const [runs, setRuns] = useState<EvalRunArtifact[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rewrite, setRewrite] = useState(true)
  const [jobId, setJobId] = useState<string | null>(null)
  const [phase, setPhase] = useState<string>('')

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
      const data = ev.data as { product_id?: string }
      if (ev.event === 'ingest_start' && data.product_id) {
        setPhase(`ingesting ${data.product_id}…`)
      } else if (ev.event === 'eval_start') {
        setPhase('scoring…')
      } else if (ev.event === 'job_done') {
        setPhase('')
        setJobId(null)
        void refresh()
      } else if (ev.event === 'error') {
        setPhase('')
        setJobId(null)
        setError('eval job failed')
        void refresh()
      }
    },
  })

  const startRun = useCallback(async () => {
    const products = corpus.map((p) => p.product_id)
    if (products.length === 0) return
    try {
      setError(null)
      const modes = rewrite ? ['auto', 'rewrite'] : ['auto']
      const ref = await startEvalRun({ products, modes })
      setJobId(ref.job_id)
      setPhase('starting…')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }, [corpus, rewrite])

  // The most recent run is the dashboard; older runs are history.
  const latest = runs[0] ?? null
  const running = !!jobId

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="size-5 animate-spin text-fg-muted" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <H3>Evals dashboard</H3>
            <Muted>
              Context quality on the shipping <code>retrieve_evidence</code> path, scored across
              products. Improvements must hold across all products, or it&apos;s overfitting.
            </Muted>
          </div>
          <div className="flex items-center gap-2">
            <label
              className="flex items-center gap-1.5 text-xs text-fg-muted"
              title="Also score the rewrite mode, side by side with auto, for an A/B ablation"
            >
              <input
                type="checkbox"
                checked={rewrite}
                onChange={(e) => setRewrite(e.target.checked)}
                disabled={running}
              />
              query-rewrite A/B
            </label>
            <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={running}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button size="sm" onClick={() => void startRun()} disabled={running || corpus.length === 0}>
              {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              Run all products
            </Button>
          </div>
        </div>

        {running && (
          <div className="flex items-center gap-2 text-xs text-accent">
            <Loader2 className="size-3.5 animate-spin" /> {phase || 'running…'}
          </div>
        )}
        {error && (
          <Card variant="surface" className="border-danger/40">
            <CardContent className="text-sm text-danger">{error}</CardContent>
          </Card>
        )}

        {!latest ? (
          <Card variant="surface">
            <CardContent className="py-6 text-sm text-fg-muted">
              No runs yet — run all products to populate the dashboard.
            </CardContent>
          </Card>
        ) : (
          <>
            <RunMeta run={latest} corpus={corpus} />
            {latest.modes.length > 1 && <AblationBanner run={latest} />}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {latest.products.map((product) => (
                <ProductCard key={product.product_id} product={product} thresholds={latest.thresholds} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---- run meta strip -------------------------------------------------------

function RunMeta({ run, corpus }: { run: EvalRunArtifact; corpus: ProductEvalInfo[] }) {
  const judge = String(run.config_fingerprint?.judge_model ?? '?')
  const langByProduct = new Map(corpus.map((p) => [p.product_id, p.language]))
  return (
    <Card variant="stat">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={run.passed ? 'success' : 'danger'}>{run.passed ? 'PASS' : 'FAIL'}</Badge>
          <Small className="font-mono text-fg-muted">{run.run_id}</Small>
        </div>
        <Small className="text-fg-muted">
          judge <code>{judge}</code> · modes {run.modes.join(', ')} · top_k {run.top_k}
          {run.limit ? ` · limit ${run.limit}` : ''}
        </Small>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {run.products.map((p) => (
          <Badge key={p.product_id} variant={p.passed ? 'success' : 'danger'} className="gap-1.5">
            {p.product_id}
            <span className="opacity-60">·</span>
            {langByProduct.get(p.product_id) ?? '?'}
            <span className="opacity-60">·</span>
            n={p.n}
          </Badge>
        ))}
      </CardContent>
    </Card>
  )
}

// ---- ablation banner: cross-product mean delta, auto -> last mode ---------

function AblationBanner({ run }: { run: EvalRunArtifact }) {
  const base = run.modes[0]
  const other = run.modes[run.modes.length - 1]
  const deltas = ABLATION_KEYS.map((key) => {
    const b = crossProductMean(run.products, base, key)
    const o = crossProductMean(run.products, other, key)
    return { key, delta: b != null && o != null ? o - b : null }
  })
  const latencyDelta = avgLatencyDelta(run.products, base, other)
  const moved = deltas.some((d) => d.delta != null && Math.abs(d.delta) >= 0.03)

  return (
    <Card variant="surface">
      <CardHeader className="pb-2">
        <Small className="uppercase tracking-wide text-fg-muted">
          Ablation · <code>{other}</code> vs <code>{base}</code> (cross-product mean)
        </Small>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {deltas.map(({ key, delta }) => (
            <Badge key={key} variant="outline" className="font-mono">
              {key} {delta == null ? '—' : signed(delta)}
            </Badge>
          ))}
          {latencyDelta != null && (
            <Badge variant="outline" className="font-mono">
              latency {latencyDelta >= 0 ? '+' : ''}
              {(latencyDelta / 1000).toFixed(1)}s
            </Badge>
          )}
        </div>
        <Muted className="text-xs">
          {moved
            ? `${other} moves quality metrics beyond run-to-run noise — inspect per-product before adopting.`
            : `${other} does not move retrieval/answer quality beyond noise (±0.03); the added latency is not earning its cost.`}
        </Muted>
      </CardContent>
    </Card>
  )
}

// ---- per-product card -----------------------------------------------------

function ProductCard({ product, thresholds }: { product: ProductResult; thresholds: Thresholds }) {
  const [showMisses, setShowMisses] = useState(false)
  const modes = product.modes
  const primary = modes[0]
  const misses = primary?.misses ?? []

  return (
    <Card variant="surface">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{product.product_id}</span>
          <Badge variant={product.passed ? 'success' : 'danger'}>
            {product.passed ? 'pass' : 'fail'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <MetricTable label="Retrieval" keys={RETRIEVAL_METRICS} modes={modes} thresholds={thresholds} />
        <MetricTable label="Answer (RAGAS)" keys={ANSWER_METRICS} modes={modes} thresholds={thresholds} />

        {/* diagnostics row */}
        <div className="flex flex-wrap gap-2 border-t border-border pt-2">
          {modes.map((m) => (
            <Badge key={m.mode} variant="secondary" className="gap-1 font-mono text-xs">
              {m.mode}: graph {formatMetric(m.graph_hit_rate)} · {Math.round(m.avg_latency_ms)}ms ·{' '}
              {m.avg_candidates.toFixed(0)} cand
            </Badge>
          ))}
        </div>

        <MetricGroupedBarChart product={product} />

        {misses.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowMisses((v) => !v)}
              className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
            >
              <ChevronDown className={`size-3.5 transition-transform ${showMisses ? 'rotate-180' : ''}`} />
              {misses.length} retrieval miss{misses.length === 1 ? '' : 'es'} ({primary.mode})
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
      </CardContent>
    </Card>
  )
}

function MetricTable({
  label,
  keys,
  modes,
  thresholds,
}: {
  label: string
  keys: readonly MetricKey[]
  modes: ModeMetrics[]
  thresholds: Thresholds
}) {
  const showDelta = modes.length > 1
  const base = modes[0]
  const last = modes[modes.length - 1]
  return (
    <div>
      <Small className="text-fg-muted">{label}</Small>
      <table className="mt-1 w-full text-sm">
        <thead>
          <tr className="text-xs text-fg-muted">
            <th className="text-left font-normal">metric</th>
            {modes.map((m) => (
              <th key={m.mode} className="text-right font-normal">
                {m.mode}
              </th>
            ))}
            {showDelta && <th className="text-right font-normal">Δ</th>}
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const threshold = thresholdFor(thresholds, key)
            const b = base[key] as number | null
            const l = last[key] as number | null
            const delta = showDelta && b != null && l != null ? l - b : null
            return (
              <tr key={key}>
                <td className="text-fg-muted">{key}</td>
                {modes.map((m) => {
                  const v = m[key] as number | null
                  const tone = metricTone(v, threshold)
                  return (
                    <td key={m.mode} className={`text-right font-mono ${toneTextClass(tone)}`}>
                      {formatMetric(v)}
                    </td>
                  )
                })}
                {showDelta && (
                  <td
                    className={`text-right font-mono text-xs ${
                      delta == null ? 'text-fg-muted' : delta >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {delta == null ? '—' : signed(delta)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---- helpers --------------------------------------------------------------

function signed(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)}`
}

function avgLatencyDelta(products: ProductResult[], base: string, other: string): number | null {
  const diffs: number[] = []
  for (const p of products) {
    const b = p.modes.find((m) => m.mode === base)?.avg_latency_ms
    const o = p.modes.find((m) => m.mode === other)?.avg_latency_ms
    if (b != null && o != null) diffs.push(o - b)
  }
  if (diffs.length === 0) return null
  return diffs.reduce((a, b) => a + b, 0) / diffs.length
}
