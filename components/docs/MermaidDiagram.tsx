'use client'

import { useEffect, useId, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

let mermaidInitialized = false

type MermaidApi = typeof import('mermaid').default

function initializeMermaid(mermaid: MermaidApi) {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    suppressErrorRendering: true,
    theme: 'dark',
    themeCSS: `
      .node rect, .node circle, .node ellipse, .node polygon, .node path {
        fill: var(--color-surface-raised) !important;
        stroke: var(--color-accent) !important;
      }
      .cluster rect {
        fill: var(--color-surface) !important;
        stroke: var(--color-border-strong) !important;
      }
      .flowchart-link, .edgePath .path, .actor-line, .messageLine0, .messageLine1 {
        stroke: var(--color-fg-subtle) !important;
      }
      .arrowheadPath {
        fill: var(--color-fg-subtle) !important;
      }
      .label text, .nodeLabel, .edgeLabel, .messageText, .labelText, .loopText {
        fill: var(--color-fg) !important;
        color: var(--color-fg) !important;
      }
      .edgeLabel rect, .labelBox, .actor {
        fill: var(--color-surface-sunk) !important;
        stroke: var(--color-border-strong) !important;
      }
      .note {
        fill: var(--color-accent-soft) !important;
        stroke: var(--color-accent) !important;
      }
    `,
    flowchart: {
      curve: 'basis',
      htmlLabels: false,
    },
  })
  mermaidInitialized = true
}

export function MermaidDiagram({
  chart,
  className,
}: {
  chart: string
  className?: string
}) {
  const reactId = useId()
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let active = true
    const diagramId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}-${isNarrow ? 'narrow' : 'wide'}`
    const responsiveChart = isNarrow
      ? chart.replace(/^flowchart\s+LR\b/m, 'flowchart TB')
      : chart

    ;(async () => {
      try {
        const { default: mermaid } = await import('mermaid')
        initializeMermaid(mermaid)
        const result = await mermaid.render(diagramId, responsiveChart)
        if (!active) return
        setSvg(result.svg)
        setError('')
      } catch (reason) {
        if (!active) return
        setSvg('')
        setError(reason instanceof Error ? reason.message : 'Diagram could not be rendered')
      }
    })()

    return () => {
      active = false
    }
  }, [chart, isNarrow, reactId])

  if (error) {
    return (
      <div className={cn('rounded-md border border-danger/40 bg-danger/10 p-4', className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-danger">
          <AlertTriangle className="h-4 w-4" />
          Diagram could not be rendered
        </div>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{error}</p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-fg-muted">
          {chart}
        </pre>
      </div>
    )
  }

  return (
    <figure
      className={cn(
        'm-0 min-h-48 overflow-x-auto rounded-md border border-border bg-surface-sunk p-4 shadow-card',
        '[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full',
        className,
      )}
      aria-label="Architecture diagram"
    >
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="grid min-h-40 place-items-center font-mono text-xs text-fg-subtle">
          Rendering diagram…
        </div>
      )}
    </figure>
  )
}
