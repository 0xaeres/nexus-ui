'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Hexagon, Search, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SkillsSkeleton } from '@/components/skeletons/SkillsSkeleton'
import { PageHeader } from '@/components/ui/page'
import { H1, SectionLabel, Body, Subtle, Code, Small } from '@/components/ui/typography'
import { NEXUS_SKILLS, NEXUS_MASTER_SKILL } from '@/lib/data'
import { cn } from '@/lib/utils'

type Skill = typeof NEXUS_SKILLS[number]

const CAP_COLOR: Record<string, string> = {
  product: '#7C8CFF',
  tech_stack: '#4DD4AC',
  sdlc: '#E8B86B',
  security: '#F26D6D',
  docs: '#C58BFF',
}

function confColor(c: number) {
  if (c < 0.5) return 'text-danger'
  if (c < 0.8) return 'text-warning'
  return 'text-success'
}

const HIERARCHY = {
  master: NEXUS_SKILLS.filter(s => 'master' in s && s.master),
  tech_stack: NEXUS_SKILLS.filter(s => !('master' in s) && s.cap === 'tech_stack'),
  language: [] as Skill[],
  security: NEXUS_SKILLS.filter(s => !('master' in s) && s.cap === 'security'),
  practice: NEXUS_SKILLS.filter(s => !('master' in s) && (s.cap === 'sdlc' || s.cap === 'docs')),
}

const SECTION_LABELS: Record<string, string> = {
  tech_stack: 'Tech Stack',
  language: 'Language',
  security: 'Security',
  practice: 'Practice',
}

export function Skills() {
  const sp = useSearchParams()
  const loading = sp?.get('loading') === '1'
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Skill>(NEXUS_SKILLS[0])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  if (loading) return <SkillsSkeleton />

  const toggleSection = (s: string) => setCollapsed(p => ({ ...p, [s]: !p[s] }))
  const match = (s: Skill) => !query || s.path.toLowerCase().includes(query.toLowerCase())

  const totalMatches = (HIERARCHY.master.filter(match).length
    + HIERARCHY.tech_stack.filter(match).length
    + HIERARCHY.security.filter(match).length
    + HIERARCHY.practice.filter(match).length)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader>
        <H1>Skills</H1>
        <Badge variant="outline" className="font-mono">{NEXUS_SKILLS.length} skills</Badge>
      </PageHeader>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left tree pane */}
        <aside className="w-[340px] shrink-0 border-r border-border flex flex-col bg-bg">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle pointer-events-none" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Filter skills…"
                className="h-9 pl-9 text-sm font-mono"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 flex flex-col gap-0.5">
              {totalMatches === 0 && (
                <div className="px-3 py-6 text-center text-sm text-fg-subtle">No skills match your filter.</div>
              )}

              {/* Master skill — pinned */}
              {HIERARCHY.master.filter(match).map(s => {
                const isActive = selected.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors mb-1',
                      'border bg-accent/[0.04] border-accent/15 hover:bg-accent/10',
                      isActive && 'bg-accent/10 border-accent/40',
                    )}
                  >
                    <Hexagon className="h-4 w-4 text-accent shrink-0" />
                    <span className={cn('flex-1 text-sm font-mono font-semibold truncate', isActive ? 'text-fg' : 'text-fg-muted')}>
                      forge <span className="text-fg-subtle">(Master)</span>
                    </span>
                    <span className={cn('text-xs font-mono', confColor(s.conf))}>{Math.round(s.conf * 100)}</span>
                  </button>
                )
              })}

              {(['tech_stack', 'language', 'security', 'practice'] as const).map(section => {
                const skills = (HIERARCHY as Record<string, Skill[]>)[section].filter(match)
                const isCollapsed = collapsed[section]
                return (
                  <div key={section} className="mt-1">
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-bg-hover transition-colors text-left"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 text-fg-subtle" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />
                      )}
                      <span className="text-sm font-medium text-fg-muted flex-1">{SECTION_LABELS[section]}</span>
                      <span className="text-xs font-mono text-fg-subtle">{skills.length}</span>
                    </button>

                    {!isCollapsed && (
                      <div className="pl-3 mt-0.5">
                        {skills.length === 0 && (
                          <div className="px-2.5 py-1.5 text-xs italic text-fg-faint font-mono">
                            no {SECTION_LABELS[section].toLowerCase()} skills yet
                          </div>
                        )}
                        {skills.map(s => {
                          const isActive = selected.id === s.id
                          const leaf = s.path.split('/').slice(-1)[0]
                          return (
                            <button
                              key={s.id}
                              onClick={() => setSelected(s)}
                              className={cn(
                                'w-full flex items-center gap-2 pl-2 pr-2 py-2 rounded-md text-left transition-colors',
                                isActive ? 'bg-accent/10 text-fg' : 'hover:bg-bg-hover text-fg-muted',
                                isActive && 'border-l-2 border-accent pl-1.5',
                              )}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ background: CAP_COLOR[s.cap] }}
                              />
                              <span className="flex-1 text-sm font-mono truncate">{leaf}</span>
                              <span className={cn('text-xs font-mono', confColor(s.conf))}>{Math.round(s.conf * 100)}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Right detail pane */}
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-4xl flex flex-col gap-7">
            {'master' in selected && selected.master ? (
              <MasterSkillDetail skill={selected as typeof NEXUS_MASTER_SKILL} />
            ) : (
              <SkillDetail skill={selected} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function MasterSkillDetail({ skill }: { skill: typeof NEXUS_MASTER_SKILL }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
          <Hexagon className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <H1>{skill.path}</H1>
          <Body className="text-fg-muted mt-1.5">{skill.tagline}</Body>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-xs uppercase tracking-wider text-fg-subtle font-mono">Confidence</span>
          <div className="flex items-center gap-2">
            <Progress value={skill.conf * 100} className="w-24" indicatorClassName="bg-success" />
            <Code>{Math.round(skill.conf * 100)}%</Code>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Team" value={skill.ownership.team} />
        <StatCard label="Lead" value={skill.ownership.lead} />
        <StatCard label="Repos" value={String(skill.ownership.repos)} />
      </div>

      <section>
        <SectionLabel className="mb-3">About</SectionLabel>
        <Body className="max-w-3xl">{skill.about}</Body>
      </section>

      <section>
        <SectionLabel className="mb-3">Stack</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {skill.stack.map(s => (
            <Badge key={s} variant="outline" className="font-mono">{s}</Badge>
          ))}
        </div>
      </section>

      <LifecycleTimeline />
    </>
  )
}

function SkillDetail({ skill }: { skill: Skill }) {
  const parts = skill.path.split('/')
  const isMaster = 'master' in skill && skill.master
  const hasComposition = !isMaster && 'composesWith' in skill && Array.isArray(skill.composesWith) && skill.composesWith.length > 0
  const leaf = parts[parts.length - 1]

  return (
    <>
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-sm font-mono flex-wrap">
          {parts.map((p, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className={i === parts.length - 1 ? 'text-fg' : 'text-fg-subtle'}>{p}</span>
              {i < parts.length - 1 && <span className="text-fg-faint">/</span>}
            </span>
          ))}
        </div>
        <H1>{leaf}</H1>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <Progress value={skill.conf * 100} className="w-24" indicatorClassName={
              skill.conf < 0.5 ? 'bg-danger' : skill.conf < 0.8 ? 'bg-warning' : 'bg-success'
            } />
            <Code>{Math.round(skill.conf * 100)}%</Code>
          </div>
          <Subtle className="font-mono">used {skill.used}</Subtle>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Capability" value={skill.cap} />
        <StatCard label="Applies to" value={skill.glob} mono />
        <StatCard label="Prerequisites" value={String(skill.prereq)} />
      </div>

      {hasComposition && <CompositionSection skill={skill} />}

      <section>
        <SectionLabel className="mb-3">Skill body preview</SectionLabel>
        <Card variant="surface" className="p-5 max-w-3xl">
          <pre className="text-sm leading-relaxed font-mono text-fg-muted m-0 whitespace-pre-wrap">
{`# ${leaf}

Applies to: ${skill.glob}
Confidence: ${Math.round(skill.conf * 100)}%

## Rules

1. [Rule content from council deliberation]
2. [Rule content from council deliberation]`}
          </pre>
        </Card>
      </section>

      <LifecycleTimeline />
    </>
  )
}

function CompositionSection({ skill }: { skill: Skill }) {
  const leaf = skill.path.split('/').slice(-1)[0]
  const skillColor = CAP_COLOR[skill.cap] ?? '#A1A1AA'

  return (
    <section>
      <SectionLabel className="mb-2.5">Composes with</SectionLabel>
      <div className="max-w-md">
        <svg viewBox="0 0 320 110" className="w-full overflow-visible">
          <defs>
            <marker id="arrow" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.3)" />
            </marker>
          </defs>
          {/* current skill */}
          <g transform="translate(60, 50)">
            <rect x={-52} y={-18} width={104} height={36} rx={6} fill={`${skillColor}1f`} stroke={`${skillColor}66`} strokeWidth={1.2} />
            <text x={0} y={4} textAnchor="middle" fill={skillColor} fontSize={11} fontFamily="var(--font-mono)">{leaf}</text>
          </g>
          {/* arrow */}
          <line x1={114} y1={50} x2={196} y2={50} stroke="rgba(255,255,255,0.18)" strokeWidth={1.2} markerEnd="url(#arrow)" />
          <text x={155} y={42} textAnchor="middle" fill="#6E6E76" fontSize={9} fontFamily="var(--font-mono)">composes</text>
          {/* master */}
          <g transform="translate(248, 50)">
            <path d="M0,-24 L21,-12 L21,12 L0,24 L-21,12 L-21,-12 Z" fill="rgba(124,140,255,0.12)" stroke="rgba(124,140,255,0.55)" strokeWidth={1.4} />
            <text x={0} y={-3} textAnchor="middle" fill="#7C8CFF" fontSize={11} fontFamily="var(--font-mono)" fontWeight={600}>forge</text>
            <text x={0} y={10} textAnchor="middle" fill="#7C8CFF" fontSize={8} fontFamily="var(--font-mono)" opacity={0.7}>master</text>
          </g>
          <text x={60} y={86} textAnchor="middle" fill="#6E6E76" fontSize={9} fontFamily="var(--font-mono)">{skill.cap}</text>
          <text x={248} y={86} textAnchor="middle" fill="#6E6E76" fontSize={9} fontFamily="var(--font-mono)">product</text>
        </svg>
        <Small className="block mt-1.5">
          Bundled with the forge Master skill at query time to provide full product context.
        </Small>
      </div>
    </section>
  )
}

function LifecycleTimeline() {
  const events = [
    { label: 'Created', time: '2024-11-12', color: 'bg-success' },
    { label: 'Council rev 2', time: '2024-11-18', color: 'bg-accent' },
    { label: 'Approved', time: '2024-11-18', color: 'bg-success' },
    { label: 'Used by PR review', time: '2h ago', color: 'bg-violet' },
  ]
  return (
    <section>
      <SectionLabel className="mb-3">Lifecycle</SectionLabel>
      <div className="flex flex-col">
        {events.map((e, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center w-3 pt-1">
              <span className={cn('h-2 w-2 rounded-full shrink-0', e.color)} />
              {i < events.length - 1 && <span className="w-px h-6 bg-border mt-1" />}
            </div>
            <div className={cn('flex flex-col gap-0.5', i < events.length - 1 && 'pb-3')}>
              <span className="text-sm text-fg">{e.label}</span>
              <span className="text-xs font-mono text-fg-subtle">{e.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Card variant="stat" glowColor="rgba(124,140,255,0.08)" className="p-5 flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider font-medium text-fg-muted">{label}</span>
      <span className={cn('text-base text-fg truncate', mono && 'font-mono')}>{value}</span>
    </Card>
  )
}
