'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { StatusDot } from '@/components/ui/status-dot'
import { CitationChip } from '@/components/atoms/CitationChip'
import { PageHeader } from '@/components/ui/page'
import { H1, Subtle } from '@/components/ui/typography'
import { AGENT_HUE, AGENT_LABEL } from '@/lib/agent-colors'
import {
  NEXUS_DELIBERATION,
  NEXUS_DRAFT_SKILL,
  COUNCIL_ROSTERS,
  COUNCIL_AGENT_LABELS,
  COUNCIL_AGENT_HUES,
  COUNCIL_COST_ESTIMATES,
  type SkillKind,
} from '@/lib/data'
import { cn } from '@/lib/utils'

type DelibEntry = typeof NEXUS_DELIBERATION[number]

function buildDynamicRoster(kind: SkillKind, msgCount: number) {
  const roles = COUNCIL_ROSTERS[kind]
  return roles.map((role, i) => {
    const status: 'done' | 'thinking' | 'idle' =
      i === 0 ? (msgCount >= 2 ? 'done' : 'thinking')
      : i < roles.length - 1 ? (msgCount >= 3 ? 'thinking' : 'idle')
      : 'idle'
    return {
      role,
      label: COUNCIL_AGENT_LABELS[role],
      hue: COUNCIL_AGENT_HUES[role],
      status,
      elapsed: status === 'done' ? '6.4s' : status === 'thinking' ? '3.1s' : '—',
      tokens: status === 'done' ? '0.9k' : status === 'thinking' ? '0.4k' : '—',
      note: status === 'done' ? 'analysis complete' : status === 'thinking' ? 'processing…' : 'queued',
    }
  })
}

export function CouncilSession({ skillKind = 'tech_stack' }: { skillKind?: SkillKind }) {
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [messages, setMessages] = useState<DelibEntry[]>([])
  const [typing, setTyping] = useState<string | null>(null)
  const [validated, setValidated] = useState<'approved' | 'rejected' | null>(null)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [usdUsed, setUsdUsed] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef(0)

  const costEstimate = COUNCIL_COST_ESTIMATES[skillKind]

  useEffect(() => {
    if (idxRef.current >= NEXUS_DELIBERATION.length) return
    const tick = () => {
      const entry = NEXUS_DELIBERATION[idxRef.current]
      if (!entry) { setTyping(null); return }
      setTyping(entry.agent)
      setTimeout(() => {
        setMessages(prev => [...prev, entry])
        setTyping(null)
        const tokDelta = 80 + Math.floor(Math.random() * 120)
        setTokensUsed(t => t + tokDelta)
        setUsdUsed(u => u + tokDelta * (costEstimate.usd / costEstimate.tokens))
        idxRef.current++
        if (idxRef.current < NEXUS_DELIBERATION.length) setTimeout(tick, 900 + Math.random() * 600)
      }, 700 + Math.random() * 400)
    }
    const t = setTimeout(tick, 400)
    return () => clearTimeout(t)
  }, [costEstimate.usd, costEstimate.tokens])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, typing])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'a') setValidated('approved')
      if (e.key === 'r') setValidated('rejected')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const dynamicRoster = buildDynamicRoster(skillKind, messages.length)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader>
        <Users className="h-5 w-5 text-fg-muted" />
        <H1>Council</H1>
        <Badge variant="violet">live</Badge>
        <Subtle className="font-mono truncate">forge/tech_stack/rust/tokio-spawn-patterns</Subtle>
        <div className="flex-1" />
        {tokensUsed > 0 && (
          <Badge variant="outline" className="font-mono">
            ${usdUsed.toFixed(4)} · {tokensUsed.toLocaleString()} tok
          </Badge>
        )}
        <Button variant="ghost" size="sm">End session</Button>
      </PageHeader>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT — Roster */}
        {leftOpen ? (
          <aside className="w-[260px] shrink-0 border-r border-border flex flex-col bg-bg">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-fg-muted">Agents</span>
              <span className="text-xs font-mono text-fg-subtle">{dynamicRoster.length} · {skillKind}</span>
              <div className="flex-1" />
              <button onClick={() => setLeftOpen(false)} className="text-fg-subtle hover:text-fg p-0.5">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 flex flex-col gap-2">
              {dynamicRoster.map(a => (
                <Card key={a.role} variant="surface" className="p-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: a.hue }} />
                    <span className="text-sm font-medium text-fg">{a.label}</span>
                    <div className="flex-1" />
                    <StatusDot status={a.status} size={5} />
                  </div>
                  <div className="flex gap-2 text-xs font-mono text-fg-subtle">
                    <span>{a.elapsed}</span>
                    <span>·</span>
                    <span>{a.tokens}</span>
                  </div>
                  <span className="text-xs text-fg-muted">{a.note}</span>
                </Card>
              ))}
            </div>
          </aside>
        ) : (
          <div className="w-8 shrink-0 border-r border-border flex flex-col items-center pt-3 bg-bg">
            <button onClick={() => setLeftOpen(true)} className="text-fg-subtle hover:text-fg p-1">
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* CENTER — Deliberation */}
        <div className="flex-1 min-w-0 flex flex-col bg-bg">
          <div ref={scrollRef} className="flex-1 overflow-auto px-8 py-6 flex flex-col gap-4">
            {messages.map((msg, i) => <DeliberationMsg key={i} msg={msg} />)}
            {typing && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-surface border border-border">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: AGENT_HUE[typing] }}
                />
                <span className="text-xs text-fg-muted">{AGENT_LABEL[typing]} is thinking</span>
                <span className="inline-flex gap-0.5 ml-1">
                  {[0, 1, 2].map(j => (
                    <span
                      key={j}
                      className="h-1 w-1 rounded-full"
                      style={{ background: AGENT_HUE[typing], animation: `nexus-dot 1.2s ease-in-out ${j * 0.2}s infinite` }}
                    />
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Validator */}
        {rightOpen ? (
          <aside className="w-[460px] shrink-0 border-l border-border flex flex-col bg-bg">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-fg-muted">Draft skill</span>
              <div className="flex-1" />
              <Progress
                value={NEXUS_DRAFT_SKILL.confidence * 100}
                className="w-20"
                indicatorClassName="bg-success"
              />
              <span className="font-mono text-sm">{Math.round(NEXUS_DRAFT_SKILL.confidence * 100)}%</span>
              <button onClick={() => setRightOpen(false)} className="text-fg-subtle hover:text-fg p-0.5">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {validated ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10 text-center">
                <span className={cn('text-4xl', validated === 'approved' ? 'text-success' : 'text-danger')}>
                  {validated === 'approved' ? '✓' : '✕'}
                </span>
                <span className={cn('text-base font-medium', validated === 'approved' ? 'text-success' : 'text-danger')}>
                  Skill {validated === 'approved' ? 'approved' : 'rejected'}
                </span>
                <span className="text-xs font-mono text-fg-subtle">Skill committed to forge/tech_stack/rust/</span>
                <Button variant="ghost" size="sm" onClick={() => setValidated(null)}>Review another →</Button>
              </div>
            ) : (
              <div className="flex-1 overflow-auto flex flex-col">
                <div className="px-5 py-4 border-b border-border">
                  <span className="text-sm font-mono text-fg break-all">{NEXUS_DRAFT_SKILL.name}</span>
                  <div className="flex gap-4 mt-2 text-xs">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs uppercase tracking-wider font-mono text-fg-subtle">glob</span>
                      <span className="font-mono text-fg-muted">{NEXUS_DRAFT_SKILL.appliesTo}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs uppercase tracking-wider font-mono text-fg-subtle">prereq</span>
                      <span className="font-mono text-fg-muted">{NEXUS_DRAFT_SKILL.prerequisites[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-b border-border flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-fg-muted">Rules</span>
                  {NEXUS_DRAFT_SKILL.rules.map(r => (
                    <div key={r.n} className="flex gap-2.5 px-3 py-2.5 rounded-md bg-success/[0.05] border border-success/20">
                      <span className="text-xs font-mono text-fg-subtle">{r.n}.</span>
                      <span className="text-sm text-fg leading-relaxed">{r.text}</span>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 border-b border-border flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-fg-muted">Citations</span>
                  <div className="flex flex-wrap gap-1.5">
                    {NEXUS_DRAFT_SKILL.citations.map(c => (
                      <CitationChip key={c.id} agent={c.agent} path={c.path} line={String(c.line)} />
                    ))}
                  </div>
                </div>

                <div className="px-5 py-4 border-b border-border">
                  <div className="p-3 rounded-md bg-high/[0.06] border border-high/30">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: AGENT_HUE.adversary }}
                      />
                      <span className="text-xs font-medium text-high">Adversary · cycle 1 of 1</span>
                    </div>
                    <span className="text-sm text-fg leading-relaxed">
                      Rule #2 weakened: &quot;store handle unless caller is a trace-only path&quot;. Accepted into revision 2.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!validated && (
              <div className="px-5 py-3 border-t border-border flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setValidated('approved')}
                  className="bg-success/15 text-success border border-success/35 hover:bg-success/25"
                >
                  Approve <kbd className="ml-1 text-xs font-mono opacity-70">A</kbd>
                </Button>
                <Button size="sm" className="bg-warning/15 text-warning border border-warning/35 hover:bg-warning/25">
                  Edit <kbd className="ml-1 text-xs font-mono opacity-70">E</kbd>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setValidated('rejected')}
                  className="bg-danger/15 text-danger border border-danger/35 hover:bg-danger/25"
                >
                  Reject <kbd className="ml-1 text-xs font-mono opacity-70">R</kbd>
                </Button>
                <div className="flex-1" />
                <span className="text-xs font-mono text-fg-subtle">rev 2 of 2</span>
              </div>
            )}
          </aside>
        ) : (
          <div className="w-8 shrink-0 border-l border-border flex flex-col items-center pt-3 bg-bg">
            <button onClick={() => setRightOpen(true)} className="text-fg-subtle hover:text-fg p-1">
              <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DeliberationMsg({ msg }: { msg: DelibEntry }) {
  return (
    <Card variant="surface" className="p-5 flex flex-col gap-2 animate-[nexus-msg-in_0.22s_ease-out]">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: AGENT_HUE[msg.agent] }}
        />
        <span className="text-sm font-medium" style={{ color: AGENT_HUE[msg.agent] }}>
          {AGENT_LABEL[msg.agent]}
        </span>
        <span className="text-xs font-mono text-fg-subtle">{msg.t}</span>
        {msg.isDraft && (
          <Badge variant="success">draft{msg.revision ? ` · rev ${msg.revision}` : ''}</Badge>
        )}
        {msg.severity && (
          <Badge variant={msg.severity === 'low' ? 'warning' : 'danger'}>{msg.severity}</Badge>
        )}
      </div>
      <p className="m-0 text-sm text-fg leading-relaxed">{msg.body}</p>
      {msg.cites && msg.cites.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {msg.cites.map((c, i) => (
            <CitationChip key={i} agent={msg.agent} path={c.path} line={String(c.line)} />
          ))}
        </div>
      )}
    </Card>
  )
}

