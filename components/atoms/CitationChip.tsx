'use client'
import { AGENT_HUE } from '@/lib/agent-colors'
import { cn } from '@/lib/utils'

export function CitationChip({ agent, path, line, onClick }: {
  agent?: string
  path: string
  line?: number | string
  onClick?: () => void
}) {
  const hue = agent ? AGENT_HUE[agent] : undefined
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-surface',
        'font-mono text-[11px] text-fg transition-colors',
        onClick ? 'cursor-pointer hover:bg-bg-hover hover:border-border-strong' : 'cursor-default',
      )}
    >
      <span
        className="h-[11px] w-[2px] rounded-sm shrink-0 bg-fg-muted"
        style={hue ? { background: hue } : undefined}
      />
      <span>{path}</span>
      {line != null && <span className="text-fg-subtle">:{line}</span>}
    </span>
  )
}
