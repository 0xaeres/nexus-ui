'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusDot } from '@/components/ui/status-dot'
import { PageHeader } from '@/components/ui/page'
import { H1, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { useEventStream } from '@/lib/hooks/useEventStream'
import {
  getProposal,
  getSession,
  sessionStreamUrl,
} from '@/lib/api'
import {
  COUNCIL_AGENT_HUES,
  COUNCIL_AGENT_LABELS,
  COUNCIL_ROSTER,
  type AgentCost,
  type AgentRole,
  type CouncilPriors,
  type DeliberationMessage,
  type ProposalSection,
  type SkillProposal,
} from '@/lib/types'
import { useProduct } from '@/lib/product-context'
import { coverageSummary, sortByTier, tierLabel } from '@/lib/skills'
import { cn } from '@/lib/utils'

const KNOWN_AGENTS = new Set<AgentRole>(['drafter', 'critic', 'reviser'])

type CouncilNotice = {
  level?: 'info' | 'warning' | 'error'
  reason?: string
  message: string
  detail?: string
}

function asAgentRole(value: string): AgentRole | null {
  return KNOWN_AGENTS.has(value as AgentRole) ? (value as AgentRole) : null
}

function agentHue(name: string): string {
  const role = asAgentRole(name)
  return role ? COUNCIL_AGENT_HUES[role] : '#7C8CFF'
}

function agentLabel(name: string): string {
  const role = asAgentRole(name)
  return role ? COUNCIL_AGENT_LABELS[role] : name
}

export function CouncilSession({ sessionId }: { sessionId: string }) {
  const { currentProductId } = useProduct()
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [messages, setMessages] = useState<DeliberationMessage[]>([])
  const [costs, setCosts] = useState<AgentCost[]>([])
  const [topic, setTopic] = useState<string>('')
  const [proposalIds, setProposalIds] = useState<string[]>([])
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [proposals, setProposals] = useState<Record<string, SkillProposal>>({})
  const [critiqueSeverity, setCritiqueSeverity] = useState<string | null>(null)
  const [ended, setEnded] = useState(false)
  const [notice, setNotice] = useState<CouncilNotice | null>(null)
  const [priors, setPriors] = useState<CouncilPriors | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    getSession(sessionId)
      .then(sess => {
        if (cancelled || !sess) return
        setTopic(sess.topic ?? '')
        if (sess.deliberation?.length) setMessages(sess.deliberation as DeliberationMessage[])
        if (sess.costs?.length) setCosts(sess.costs as AgentCost[])
        const ids = sess.proposal_ids?.length ? sess.proposal_ids : sess.proposal_id ? [sess.proposal_id] : []
        if (ids.length) {
          setProposalIds(ids)
          setSelectedProposalId((current) => current ?? ids[0])
        }
        if (sess.priors) setPriors(sess.priors)
      })
      .catch(() => {/* not yet persisted */})
    return () => { cancelled = true }
  }, [sessionId])

  const { events, status } = useEventStream(sessionStreamUrl(sessionId))

  useEffect(() => {
    for (const ev of events) {
      if (ev.event === 'message' && typeof ev.data === 'object') {
        setMessages(prev => prev.concat(ev.data as DeliberationMessage))
      } else if (ev.event === 'cost' && typeof ev.data === 'object') {
        setCosts(prev => prev.concat(ev.data as AgentCost))
      } else if (ev.event === 'notice' && typeof ev.data === 'object') {
        setNotice(ev.data as CouncilNotice)
      } else if (ev.event === 'critique' && typeof ev.data === 'object') {
        const sev = (ev.data as { severity?: string }).severity
        if (sev) setCritiqueSeverity(sev)
      } else if (
        (ev.event === 'proposal' || ev.event === 'proposal_preview') &&
        typeof ev.data === 'object'
      ) {
        const d = ev.data as { proposal_id?: string; proposal_ids?: string[]; id?: string }
        const ids = d.proposal_ids?.length ? d.proposal_ids : [d.proposal_id ?? d.id].filter(Boolean) as string[]
        if (ids.length) {
          setProposalIds((prev) => Array.from(new Set(prev.concat(ids))))
          setSelectedProposalId((current) => current ?? ids[0])
        }
      } else if (ev.event === 'session_start' && typeof ev.data === 'object') {
        const d = ev.data as { topic?: string }
        if (d.topic) setTopic(d.topic)
      } else if (ev.event === 'session_end') {
        setEnded(true)
      }
    }
  }, [events])

  useEffect(() => {
    const missing = proposalIds.filter((id) => !proposals[id])
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(missing.map((id) => getProposal(id).catch(() => null)))
      .then((loaded) => {
        if (cancelled) return
        setProposals((prev) => {
          const next = { ...prev }
          for (const item of loaded) {
            if (item) next[item.id] = item
          }
          return next
        })
      })
      .catch(() => {/* ignore */})
    return () => { cancelled = true }
  }, [proposalIds, proposals])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const totalTokens = useMemo(
    () => costs.reduce((sum, c) => sum + (c.prompt_tokens ?? 0) + (c.completion_tokens ?? 0), 0),
    [costs],
  )

  const roster = useMemo(() => {
    const seen = new Set(messages.map(m => m.agent))
    return COUNCIL_ROSTER.map(role => ({
      role,
      label: COUNCIL_AGENT_LABELS[role],
      hue: COUNCIL_AGENT_HUES[role],
      status: (seen.has(role) ? 'done' : ended ? 'idle' : 'thinking') as
        | 'done' | 'thinking' | 'idle',
    }))
  }, [messages, ended])

  const proposalList = useMemo(
    () => sortByTier(proposalIds.map((id) => proposals[id]).filter(Boolean)),
    [proposalIds, proposals],
  )
  const selectedProposal =
    proposalList.find((item) => item.id === selectedProposalId) ?? proposalList[0] ?? null

  const streamLive = status === 'open' || status === 'connecting'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader>
        <Users className="h-5 w-5 text-fg-muted" />
        <H1>Council</H1>
        {streamLive && !ended ? (
          <Badge variant="violet">live</Badge>
        ) : (
          <Badge variant="outline">replay</Badge>
        )}
        <Subtle className="font-mono truncate">{topic || sessionId}</Subtle>
        <div className="flex-1" />
        {priors && (priors.revision > 0 || priors.corrections > 0 || priors.rejections > 0) && (
          <Badge variant="outline" className="font-mono" title="Priors carried into this session">
            priors · rev {priors.revision} · {priors.corrections} corr · {priors.rejections} rej
          </Badge>
        )}
        {totalTokens > 0 && (
          <Badge variant="outline" className="font-mono">
            {totalTokens.toLocaleString()} tok
          </Badge>
        )}
      </PageHeader>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {leftOpen ? (
          <aside className="w-[260px] shrink-0 border-r border-border flex flex-col bg-bg">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <SectionLabel>Agents</SectionLabel>
              <Subtle className="font-mono">{roster.length}</Subtle>
              <div className="flex-1" />
              <button onClick={() => setLeftOpen(false)} className="text-fg-subtle hover:text-fg p-0.5">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 flex flex-col gap-2">
              {roster.map(a => {
                const agentCost = costs.find(c => c.agent === a.role)
                const tokens = agentCost ? (agentCost.prompt_tokens + agentCost.completion_tokens) : 0
                return (
                  <Card key={a.role} variant="glass" className="p-3 flex flex-col gap-1.5">
                    <div className="flex items-stretch gap-3">
                      <span className="w-1 rounded-full" style={{ background: a.hue }} />
                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-fg">{a.label}</span>
                          <div className="flex-1" />
                          <StatusDot status={a.status} size={5} />
                        </div>
                        <Small className="font-mono text-fg-subtle">
                          {tokens > 0 ? `${tokens.toLocaleString()} tok` : a.status}
                        </Small>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </aside>
        ) : (
          <div className="w-8 shrink-0 border-r border-border flex flex-col items-center pt-3 bg-bg">
            <button onClick={() => setLeftOpen(true)} className="text-fg-subtle hover:text-fg p-1">
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col bg-bg">
          <div ref={scrollRef} className="flex-1 overflow-auto px-8 py-6 flex flex-col gap-4">
            {messages.length === 0 && !ended && (
              <Muted className="font-mono text-center py-12">
                {streamLive ? 'Waiting for first agent message…' : 'Loading session…'}
              </Muted>
            )}
            {notice && (
              <Card variant="glass" className="border-warning/40 bg-warning/10 p-4">
                <div className="flex flex-col gap-1">
                  <Small className="font-medium text-warning">Council stopped</Small>
                  <p className="m-0 text-sm text-fg">{notice.message}</p>
                  {notice.detail && <Small className="font-mono text-fg-muted">{notice.detail}</Small>}
                </div>
              </Card>
            )}
            {messages.map((msg, i) => <DeliberationMsg key={i} msg={msg} />)}
            {ended && messages.length > 0 && (
              <Muted className="text-center py-4 font-mono">— session ended —</Muted>
            )}
          </div>
        </div>

        {rightOpen ? (
          <aside className="w-[460px] shrink-0 border-l border-border flex flex-col bg-bg">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <SectionLabel>Draft pack</SectionLabel>
              <div className="flex-1" />
              {selectedProposal && (
                <>
                  <Progress
                    value={Math.round(selectedProposal.confidence * 100)}
                    className="w-20"
                    indicatorClassName={
                      selectedProposal.confidence >= 0.7 ? 'bg-success'
                      : selectedProposal.confidence >= 0.5 ? 'bg-warning'
                      : 'bg-danger'
                    }
                  />
                  <span className="font-mono text-sm">{Math.round(selectedProposal.confidence * 100)}%</span>
                </>
              )}
              <button onClick={() => setRightOpen(false)} className="text-fg-subtle hover:text-fg p-0.5">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {!selectedProposal ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <Muted className="font-mono">
                  {notice ? 'No proposals produced.' : streamLive ? 'Drafting pack…' : 'No proposals produced.'}
                </Muted>
              </div>
            ) : (
              <div className="flex-1 overflow-auto flex flex-col">
                <div className="px-3 py-3 border-b border-border flex flex-col gap-1">
                  {proposalList.map((item) => {
                    const active = item.id === selectedProposal.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedProposalId(item.id)}
                        className={cn(
                          'rounded-md px-3 py-2 text-left transition-colors',
                          active ? 'bg-bg-active' : 'hover:bg-surface',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-fg truncate">{item.name}</span>
                          <div className="flex-1" />
                          <Badge variant="outline" className="font-mono text-xs">{tierLabel(item.tier)}</Badge>
                        </div>
                        <Small className="mt-1 block text-fg-subtle">{coverageSummary(item.coverage)}</Small>
                      </button>
                    )
                  })}
                </div>
                <div className="px-5 py-4 border-b border-border">
                  <span className="text-sm font-mono text-fg break-all">{selectedProposal.name}</span>
                  <div className="flex gap-2 mt-2 text-xs">
                    <Badge variant="accent" className="font-mono">
                      {tierLabel(selectedProposal.tier)}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {selectedProposal.citations.length} citations
                    </Badge>
                  </div>
                </div>

                <div className="px-5 py-4 flex-1 overflow-auto flex flex-col gap-4">
                  {selectedProposal.sections && selectedProposal.sections.length > 0 ? (
                    selectedProposal.sections.map((sec, i) => (
                      <DraftSection key={i} section={sec} />
                    ))
                  ) : (
                    <pre className="text-xs font-mono whitespace-pre-wrap text-fg-muted leading-relaxed">
                      {selectedProposal.body}
                    </pre>
                  )}
                </div>

                {critiqueSeverity && critiqueSeverity !== 'minor' && (
                  <div className="px-5 py-4 border-t border-border">
                    <div className="p-3 rounded-md bg-high/[0.06] border border-high/30">
                      <Small className="font-medium text-high">
                        Adversary critique: {critiqueSeverity}
                      </Small>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedProposal && (
              <div className="border-t border-border bg-surface px-5 py-3 flex items-center gap-2">
                <Button asChild size="sm">
                  <Link href={`/p/${currentProductId}/review`}>
                    Review proposals
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <div className="flex-1" />
                <Subtle className="font-mono">
                  rev {priors ? priors.revision + 1 : selectedProposal.adversary_critique ? 2 : 1}
                </Subtle>
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

function DraftSection({ section }: { section: ProposalSection }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-fg-muted">
          {section.heading}
        </span>
        {section.inherited && (
          <Badge variant="outline" className="font-mono text-xs py-0 px-1.5" title="Carried over unchanged from the prior revision">
            inherited
          </Badge>
        )}
      </div>
      <pre className={cn(
        'text-xs font-mono whitespace-pre-wrap leading-relaxed',
        section.inherited ? 'text-fg-subtle' : 'text-fg-muted',
      )}>
        {section.body}
      </pre>
    </div>
  )
}

function DeliberationMsg({ msg }: { msg: DeliberationMessage }) {
  return (
    <div className="relative pl-5 animate-[nexus-msg-in_0.22s_ease-out]">
      <span
        className="absolute left-1 top-2 bottom-2 w-0.5 rounded-full"
        style={{ background: agentHue(msg.agent) }}
      />
      <div className="rounded-md px-2 py-1.5 hover:bg-bg-hover">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium" style={{ color: agentHue(msg.agent) }}>
            {agentLabel(msg.agent)}
          </span>
          <span className="text-xs font-mono text-fg-subtle">
            {msg.timestamp?.slice(11, 19) ?? ''}
          </span>
        </div>
        <p className="m-0 text-sm text-fg leading-relaxed whitespace-pre-wrap">{msg.body}</p>
      </div>
    </div>
  )
}
