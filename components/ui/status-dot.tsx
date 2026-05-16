import { cn } from '@/lib/utils'

type Status = 'connected' | 'watching' | 'syncing' | 'error' | 'running' | 'done' | 'thinking' | 'idle' | 'success'

const STATUS_COLORS: Record<string, string> = {
  connected: 'bg-success',
  running: 'bg-success',
  done: 'bg-success',
  success: 'bg-success',
  watching: 'bg-accent',
  syncing: 'bg-warning',
  thinking: 'bg-warning',
  error: 'bg-danger',
  idle: 'bg-fg-subtle',
}

const PULSE_STATES = new Set(['watching', 'syncing', 'thinking'])

export function StatusDot({ status, size = 7, className }: { status: Status | string; size?: number; className?: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-fg-subtle'
  const pulse = PULSE_STATES.has(status)
  return (
    <span
      className={cn('inline-block rounded-full', color, pulse && 'animate-[nexus-pulse_2.4s_ease-in-out_infinite]', className)}
      style={{ width: size, height: size }}
    />
  )
}
