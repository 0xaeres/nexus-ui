'use client'
import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { NEXUS_SYNC_LOG } from '@/lib/data'

const KIND_COLOR: Record<string, string> = {
  ok: 'text-success',
  warn: 'text-warning',
  err: 'text-danger',
}

/**
 * Reusable streaming ingestion progress block.
 * - `progress` 0-100 drives the bar
 * - `streaming` reveals NEXUS_SYNC_LOG entries one at a time
 * - Compact, mono, no fluff. Used in Sources cards + Onboarding step 3.
 */
export function IngestionProgress({
  progress,
  streaming = true,
  className,
  showHeader = true,
}: {
  progress: number
  streaming?: boolean
  className?: string
  showHeader?: boolean
}) {
  const [shown, setShown] = useState(streaming ? 1 : NEXUS_SYNC_LOG.length)

  useEffect(() => {
    if (!streaming) return
    if (shown >= NEXUS_SYNC_LOG.length) return
    const t = setTimeout(() => setShown(s => s + 1), 650)
    return () => clearTimeout(t)
  }, [shown, streaming])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {showHeader && (
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-mono text-fg-subtle">Ingesting</span>
          <Progress value={progress} className="flex-1" indicatorClassName="bg-warning" />
          <span className="text-sm font-mono text-fg w-12 text-right">{progress}%</span>
        </div>
      )}
      <div className="rounded-md border border-border bg-surface-sunk">
        <ScrollArea className="h-52">
          <div className="p-4 flex flex-col gap-1">
            {NEXUS_SYNC_LOG.slice(0, shown).map((l, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs font-mono leading-snug animate-[nexus-msg-in_0.2s_ease-out_both]"
              >
                <span className="text-fg-subtle shrink-0">{l.t}</span>
                <span className={cn('shrink-0', KIND_COLOR[l.kind])}>
                  {l.kind === 'ok' ? '·' : l.kind === 'warn' ? '!' : '×'}
                </span>
                <span className={cn(l.kind === 'warn' ? 'text-warning' : 'text-fg-muted')}>{l.text}</span>
              </div>
            ))}
            {streaming && shown < NEXUS_SYNC_LOG.length && (
              <div className="flex items-center gap-1 pt-1 text-xs font-mono text-fg-subtle">
                <span className="animate-[nexus-dot_1.4s_ease-in-out_infinite]">●</span>
                <span>streaming…</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
