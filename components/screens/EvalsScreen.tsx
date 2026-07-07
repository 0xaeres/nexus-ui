'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Info, Loader2, Play, RefreshCw } from 'lucide-react'
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
      const ref = await startEvalRun({ products, modes: ['auto'] })
      setJobId(ref.job_id)
      setPhase('starting…')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    }
  }, [corpus])

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
              Launch-grade context quality for Anvay&apos;s shipping retrieval path, scored across
              products so teams can see the indexes that make answers trustworthy.
            </Muted>
          </div>
          <div className="flex items-center gap-2">
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
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-accent/25 bg-accent/10 px-3 py-2 text-xs text-accent">
            <Loader2 className="size-3.5 animate-spin" /> {phase || 'running…'}
            <span className="inline-flex items-center gap-1 text-fg-muted">
              <Info className="size-3.5" />
              auto mode runs the production retrieval policy for each product.
            </span>
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
            <DashboardSummary run={latest} />
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
          judge <code>{judge}</code> · {formatModeSummary(run.modes)} · top_k {run.top_k}
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

function DashboardSummary({ run }: { run: EvalRunArtifact }) {
  const mode = run.modes[0]
  const tiles: Array<{ label: string; value: string; detail: string; metric?: MetricKey }> = [
    {
      label: 'Evidence recall',
      value: formatMetric(crossProductMean(run.products, mode, 'recall_at_k')),
      detail: 'expected evidence found',
      metric: 'recall_at_k',
    },
    {
      label: 'Ranking quality',
      value: formatMetric(crossProductMean(run.products, mode, 'ndcg_at_k')),
      detail: 'best evidence lifted',
      metric: 'ndcg_at_k',
    },
    {
      label: 'Answer correctness',
      value: formatMetric(crossProductMean(run.products, mode, 'answer_correctness')),
      detail: 'answers pass judged evals',
      metric: 'answer_correctness',
    },
    {
      label: 'Graph navigation',
      value: formatPercent(meanDiagnostic(run.products, mode, 'graph_hit_rate')),
      detail: 'queries using graph context',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const threshold = tile.metric ? thresholdFor(run.thresholds, tile.metric) : undefined
        const tone = tile.metric
          ? metricTone(crossProductMean(run.products, mode, tile.metric), threshold)
          : 'neutral'
        return (
          <Card key={tile.label} variant="stat">
            <CardContent className="space-y-1.5 py-4">
              <Small>{tile.label}</Small>
              <div className={`font-mono text-2xl font-semibold ${toneTextClass(tone)}`}>{tile.value}</div>
              <Small>{tile.detail}</Small>
            </CardContent>
          </Card>
        )
      })}
    </div>
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
          Ablation · <code>{displayModeName(other)}</code> vs <code>{displayModeName(base)}</code>{' '}
          (cross-product mean)
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
            ? `${displayModeName(other)} moves quality metrics beyond run-to-run noise — inspect per-product before adopting.`
            : `${displayModeName(other)} does not move retrieval/answer quality beyond noise (±0.03); the added latency is not earning its cost.`}
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
          <H3>{product.product_id}</H3>
          <Badge variant={product.passed ? 'success' : 'danger'}>
            {product.passed ? 'pass' : 'fail'}
          </Badge>
        </div>
        <Small>
          {product.n} eval questions · scores run from 0 to 1, where higher means better evidence
          and better grounded answers.
        </Small>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <MetricTable label="Retrieval" keys={RETRIEVAL_METRICS} modes={modes} thresholds={thresholds} />
        <MetricTable label="Answer (RAGAS)" keys={ANSWER_METRICS} modes={modes} thresholds={thresholds} />

        <div className="grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-3">
          <IndexStat
            label="Graph navigation"
            value={formatPercent(primary?.graph_hit_rate ?? null)}
            detail="share of questions helped by graph-local context"
          />
          <IndexStat
            label="Candidate pool"
            value={primary ? primary.avg_candidates.toFixed(0) : '—'}
            detail="average evidence candidates considered before rerank"
          />
          <IndexStat
            label="Latency"
            value={primary ? `${Math.round(primary.avg_latency_ms)}ms` : '—'}
            detail="average end-to-end retrieval time"
          />
          {modes.length > 1 &&
            modes.slice(1).map((m) => (
              <IndexStat
                key={m.mode}
                label={displayModeName(m.mode)}
                value={`${formatPercent(m.graph_hit_rate)} graph`}
                detail={`${Math.round(m.avg_latency_ms)}ms · ${m.avg_candidates.toFixed(0)} candidates`}
              />
            ))}
        </div>

        <div className="rounded-md border border-border bg-surface-sunk/40 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Small className="font-medium text-fg">Index scorecard</Small>
            <Small>0 weak · 1 strong · gated metrics use launch thresholds</Small>
          </div>
          <MetricGroupedBarChart product={product} />
        </div>

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
            <th className="text-left font-normal">index</th>
            <th className="hidden text-left font-normal sm:table-cell">what it proves</th>
            {modes.map((m) => (
              <th key={m.mode} className="text-right font-normal">
                {displayModeName(m.mode)}
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
              <tr key={key} className="align-top">
                <td className="py-1 pr-3 text-fg">{METRIC_LABELS[key]}</td>
                <td className="hidden max-w-[18rem] py-1 pr-3 text-xs text-fg-muted sm:table-cell">
                  {METRIC_DESCRIPTIONS[key]}
                  {threshold != null && (
                    <span className="font-mono text-fg-subtle"> · gate {formatMetric(threshold)}</span>
                  )}
                </td>
                {modes.map((m) => {
                  const v = m[key] as number | null
                  const tone = metricTone(v, threshold)
                  return (
                    <td key={m.mode} className={`py-1 text-right font-mono ${toneTextClass(tone)}`}>
                      {formatMetric(v)}
                    </td>
                  )
                })}
                {showDelta && (
                  <td
                    className={`py-1 text-right font-mono text-xs ${
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

function IndexStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-sunk/40 px-3 py-2">
      <Small>{label}</Small>
      <div className="font-mono text-base font-semibold text-fg">{value}</div>
      <Small>{detail}</Small>
    </div>
  )
}

// ---- helpers --------------------------------------------------------------

function signed(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)}`
}

function displayModeName(mode: string): string {
  return mode === 'auto' ? 'Shipping retrieval' : mode
}

function formatModeSummary(modes: string[]): string {
  if (modes.length === 1 && modes[0] === 'auto') return 'shipping retrieval'
  return `modes ${modes.map(displayModeName).join(', ')}`
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
