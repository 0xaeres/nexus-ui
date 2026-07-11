'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, Maximize2, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

let mermaidInitialized = false

type MermaidApi = typeof import('mermaid').default

const MIN_SCALE = 0.5
const MAX_SCALE = 4
const SCALE_STEP = 0.25

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
  const [zoomed, setZoomed] = useState(false)

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
    <>
      <figure
        className={cn(
          'group relative m-0 min-h-48 overflow-x-auto rounded-md border border-border bg-surface-sunk p-4 shadow-card',
          '[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full',
          className,
        )}
        aria-label="Architecture diagram"
      >
        {svg ? (
          <>
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/90 px-2.5 py-1.5 text-xs font-medium text-fg-muted opacity-0 shadow-card backdrop-blur transition-all hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
              aria-label="Expand diagram"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Expand
            </button>
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </>
        ) : (
          <div className="grid min-h-40 place-items-center font-mono text-xs text-fg-subtle">
            Rendering diagram…
          </div>
        )}
      </figure>
      {zoomed ? <DiagramLightbox svg={svg} onClose={() => setZoomed(false)} /> : null}
    </>
  )
}

/** Full-screen diagram viewer with zoom controls and drag-to-pan. */
function DiagramLightbox({ svg, onClose }: { svg: string; onClose: () => void }) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
  const zoomIn = useCallback(() => setScale((s) => clampScale(s + SCALE_STEP)), [])
  const zoomOut = useCallback(() => setScale((s) => clampScale(s - SCALE_STEP)), [])
  const reset = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === '+' || e.key === '=') zoomIn()
      else if (e.key === '-') zoomOut()
      else if (e.key === '0') reset()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, zoomIn, zoomOut, reset])

  const onWheel = (e: React.WheelEvent) => {
    setScale((s) => clampScale(s - Math.sign(e.deltaY) * SCALE_STEP))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) })
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Diagram viewer"
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-end gap-1 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface/90 p-1 shadow-card backdrop-blur">
          <IconButton label="Zoom out" onClick={zoomOut} disabled={scale <= MIN_SCALE}>
            <Minus className="h-4 w-4" />
          </IconButton>
          <button
            type="button"
            onClick={reset}
            className="min-w-14 rounded-md px-2 py-1.5 text-center font-mono text-xs text-fg-muted hover:text-fg"
            aria-label="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <IconButton label="Zoom in" onClick={zoomIn} disabled={scale >= MAX_SCALE}>
            <Plus className="h-4 w-4" />
          </IconButton>
          <IconButton label="Reset view" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </IconButton>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      <div
        className="flex flex-1 cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="select-none [&_svg]:h-auto [&_svg]:max-w-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragRef.current ? 'none' : 'transform 120ms ease-out',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}
