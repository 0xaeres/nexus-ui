/**
 * Unified eval dashboard: shared types + helpers.
 *
 * Mirrors the Pydantic shapes in `anvay/api/routes/evals.py` /
 * `evals/harness.py`. One run scores every product over every evidence `mode`
 * through the shipping `retrieve_evidence` path, so the dashboard is
 * product × mode.
 */

export const RETRIEVAL_METRICS = ['recall_at_k', 'mrr', 'ndcg_at_k'] as const
export const ANSWER_METRICS = [
  'faithfulness',
  'answer_correctness',
  'context_precision',
  'context_recall',
] as const
export type MetricKey =
  | (typeof RETRIEVAL_METRICS)[number]
  | (typeof ANSWER_METRICS)[number]

export const METRIC_LABELS: Record<MetricKey, string> = {
  recall_at_k: 'Evidence recall',
  mrr: 'First-hit rank',
  ndcg_at_k: 'Ranking quality',
  faithfulness: 'Faithfulness',
  answer_correctness: 'Answer correctness',
  context_precision: 'Context precision',
  context_recall: 'Context recall',
}

export const METRIC_DESCRIPTIONS: Record<MetricKey, string> = {
  recall_at_k: 'How often the expected source evidence is present in the retrieved context.',
  mrr: 'How early the first relevant evidence appears; higher means less digging for the model.',
  ndcg_at_k: 'Whether the best evidence is ranked near the top, not just included somewhere.',
  faithfulness: 'Whether the generated answer stays grounded in the retrieved evidence.',
  answer_correctness: 'Whether the answer resolves the eval question correctly.',
  context_precision: 'How much of the retrieved context is useful instead of distractor material.',
  context_recall: 'Whether the retrieved context contains enough evidence to answer completely.',
}

export interface ModeMetrics {
  mode: string
  n: number
  recall_at_k: number
  mrr: number
  ndcg_at_k: number
  faithfulness: number | null
  answer_correctness: number | null
  context_precision: number | null
  context_recall: number | null
  avg_latency_ms: number
  avg_candidates: number
  graph_hit_rate: number
  misses: string[]
}

export interface ProductResult {
  product_id: string
  n: number
  passed: boolean
  modes: ModeMetrics[]
}

export interface Thresholds {
  recall_at_k: number
  ndcg_at_k: number
  mrr: number
  answer_correctness: number
  context_recall: number
}

export interface EvalRunArtifact {
  run_id: string
  generated_at: string
  config_path: string
  config_fingerprint: Record<string, unknown>
  top_k: number
  limit: number | null
  modes: string[]
  thresholds: Thresholds
  products: ProductResult[]
  output_dir: string
  passed: boolean
  /** present only on the detail endpoint (`getEvalRun`) */
  markdown?: string
}

export interface EvalJobRef {
  job_id: string
  status: string
}

export interface EvalJobStatus {
  job_id: string
  status: 'running' | 'completed' | 'failed'
  products: string[]
  modes: string[]
  started_at: string
  completed_at: string | null
  run_id: string | null
  error: string | null
}

export interface ProductEvalInfo {
  product_id: string
  language: string
  needs_ingest: boolean
}

// ---- tone helpers --------------------------------------------------------

export type MetricTone = 'success' | 'warning' | 'danger' | 'neutral'

/**
 * Color a metric value against its threshold. No gate is neutral; at/above the
 * gate is success; within 10% under warns; below that fails.
 */
export function metricTone(value: number | null, threshold?: number): MetricTone {
  if (value == null) return 'neutral'
  if (threshold == null || threshold <= 0) return 'neutral'
  if (value >= threshold) return 'success'
  if (value >= threshold * 0.9) return 'warning'
  return 'danger'
}

const TONE_TEXT: Record<MetricTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-fg',
}

export function toneTextClass(tone: MetricTone): string {
  return TONE_TEXT[tone]
}

const TONE_FILL: Record<MetricTone, string> = {
  success: '#2F8F73',
  warning: '#C9913D',
  danger: '#C2554D',
  neutral: '#7C8595',
}

export function toneFill(tone: MetricTone): string {
  return TONE_FILL[tone]
}

/** Stable per-mode hue for charts. */
const MODE_HUES = ['#5B8DEF', '#9B6FE0', '#3FA796', '#E0915B']

export function modeHue(index: number): string {
  return MODE_HUES[index % MODE_HUES.length]
}

/** The gate for a metric key, if the thresholds object defines one. */
export function thresholdFor(thresholds: Thresholds, key: string): number | undefined {
  return (thresholds as unknown as Record<string, number>)[key]
}

/** Mean of a metric across products for one mode (null values skipped). */
export function crossProductMean(
  products: ProductResult[],
  mode: string,
  key: MetricKey,
): number | null {
  const vals: number[] = []
  for (const p of products) {
    const m = p.modes.find((x) => x.mode === mode)
    const v = m ? (m[key] as number | null) : null
    if (v != null) vals.push(v)
  }
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function formatMetric(value: number | null): string {
  return value == null ? '—' : value.toFixed(3)
}

export function formatPercent(value: number | null): string {
  return value == null ? '—' : `${Math.round(value * 100)}%`
}
