'use client'
import { COUNCIL_AGENT_HUES, type AgentRole } from '@/lib/types'
import { cn } from '@/lib/utils'

const KNOWN = new Set<AgentRole>([
  'archaeologist',
  'domain_expert',
  'synthesizer',
  'adversary',
  'security_sentinel',
  'curator',
])

function hueFor(agent: string | undefined): string | undefined {
  if (!agent) return undefined
  return KNOWN.has(agent as AgentRole) ? COUNCIL_AGENT_HUES[agent as AgentRole] : undefined
}

export function CitationChip({ agent, path, line, onClick }: {
  agent?: string
  path: string
  line?: number | string
  onClick?: () => void
}) {
  const hue = hueFor(agent)
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
