'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ANSWER_METRICS,
  METRIC_LABELS,
  RETRIEVAL_METRICS,
  modeHue,
  type ProductResult,
} from '@/lib/evals'

const METRICS = [...RETRIEVAL_METRICS, ...ANSWER_METRICS]

/**
 * Grouped bars per metric, one bar per evidence mode — the A/B view. Bars side
 * by side per metric make the cross-mode delta obvious at a glance.
 */
export function MetricGroupedBarChart({ product }: { product: ProductResult }) {
  const modes = product.modes.map((m) => m.mode)
  const singleMode = modes.length === 1

  const data = METRICS.map((metric) => {
    const row: Record<string, number | string> = { metric: METRIC_LABELS[metric] }
    for (const m of product.modes) {
      const v = m[metric] as number | null
      row[m.mode] = v ?? 0
    }
    return row
  })

  if (data.length === 0) return <EmptyChart label="No metrics yet" />

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="metric"
          tick={{ fontSize: 10, fill: 'var(--color-fg-muted)' }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={56}
        />
        <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }} />
        <Tooltip
          contentStyle={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => Number(v).toFixed(3)}
        />
        {!singleMode && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {modes.map((mode, mi) => (
          <Bar
            key={mode}
            dataKey={mode}
            name={singleMode ? 'Score' : displayModeName(mode)}
            fill={modeHue(mi)}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function displayModeName(mode: string): string {
  return mode === 'auto' ? 'Shipping retrieval' : mode
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-xs text-fg-muted">
      {label}
    </div>
  )
}
