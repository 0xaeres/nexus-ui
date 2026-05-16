'use client'
import { useRouter } from 'next/navigation'
import { Plug, Activity, Users, UserCheck, BookOpen } from 'lucide-react'
import { StatusDot } from '@/components/ui/status-dot'
import { Card } from '@/components/ui/card'
import { NEXUS_PIPELINE } from '@/lib/data'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  plug: Plug,
  pulse: Activity,
  council: Users,
  user: UserCheck,
  skills: BookOpen,
}

const GLOW_COLOR: Record<string, string> = {
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  high: 'text-high',
  danger: 'text-danger',
  violet: 'text-violet',
  neutral: 'text-fg-muted',
}

export function Pipeline({ base = '' }: { base?: string }) {
  const router = useRouter()
  const SCREEN_ROUTES: Record<string, string> = {
    connectors: `${base}/sources`,
    activity: `${base}/activity`,
    council: `${base}/council`,
    skills: `${base}/skills`,
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-fg-muted m-0">Pipeline</h2>
        <span className="text-sm font-mono text-fg-subtle">how knowledge becomes skills</span>
      </div>
      <Card variant="surface" className="p-4">
        <div className="flex items-stretch gap-0">
          {NEXUS_PIPELINE.map((s, i) => {
            const Icon = ICON_MAP[s.icon] ?? Plug
            const color = GLOW_COLOR[s.glow] ?? 'text-fg-muted'
            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => router.push(SCREEN_ROUTES[s.screen] ?? '/')}
                  className="flex-1 flex flex-col gap-2 p-4 rounded-md text-left hover:bg-bg-hover transition-colors min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4 shrink-0', color)} />
                    <span className="text-sm font-medium text-fg">{s.label}</span>
                    <div className="flex-1" />
                    {s.active && <StatusDot status="thinking" size={6} />}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn('text-2xl font-semibold font-mono leading-none', color)}>{s.count}</span>
                    <span className="text-xs text-fg-muted truncate">{s.sub}</span>
                  </div>
                  <div className="text-xs font-mono text-fg-subtle truncate">{s.now}</div>
                </button>
                {i < NEXUS_PIPELINE.length - 1 && <PipelineArrow active={!!s.active} />}
              </div>
            )
          })}
        </div>
      </Card>
    </section>
  )
}

function PipelineArrow({ active }: { active: boolean }) {
  return (
    <div className="w-7 shrink-0 flex items-center justify-center">
      <svg width="28" height="14" viewBox="0 0 32 14" fill="none" className="overflow-visible">
        <path d="M2 7 L26 7" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeLinecap="round" strokeDasharray={active ? '0' : '2 3'} />
        <path d="M23 3 L28 7 L23 11" stroke={active ? '#7C8CFF' : '#6E6E76'} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {active && (
          <path
            d="M2 7 L26 7"
            stroke="#7C8CFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="4 28"
            style={{ animation: 'nexus-flow 1.4s linear infinite' }}
          />
        )}
      </svg>
    </div>
  )
}
