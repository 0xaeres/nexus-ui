'use client'

import { useCallback, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { Small } from '@/components/ui/typography'
import { useEventStream, type SseEvent } from '@/lib/hooks/useEventStream'
import {
  COUNCIL_AGENT_HUES,
  COUNCIL_AGENT_LABELS,
  COUNCIL_ROSTER,
  type AgentCost,
  type AgentRole,
  type DeliberationMessage,
} from '@/lib/types'

const KNOWN_AGENTS = new Set<AgentRole>(COUNCIL_ROSTER)

type LlmToken = {
  role?: string
  text?: string
}

const TOKEN_AGENT: Record<string, AgentRole> = {
  drafter: 'synthesizer',
  critic: 'domain_expert',
  experts: 'domain_expert',
  reviser: 'repair',
}

type CouncilNotice = {
  level?: 'info' | 'warning' | 'error'
  reason?: string
  message: string
  detail?: string
}

type UseCouncilStreamOptions = {
  sessionId: string
  streamUrl: string
  tokenLimit: number
  onUnhandledEvent?: (event: SseEvent) => void
}

function asAgentRole(value: string): AgentRole | null {
  return KNOWN_AGENTS.has(value as AgentRole) ? (value as AgentRole) : null
}

export function agentHue(name: string): string {
  const role = asAgentRole(name)
  return role ? COUNCIL_AGENT_HUES[role] : '#7C8CFF'
}

export function agentLabel(name: string): string {
  const role = asAgentRole(name)
  return role ? COUNCIL_AGENT_LABELS[role] : name
}

export function useCouncilStream({
  sessionId,
  streamUrl,
  tokenLimit,
  onUnhandledEvent,
}: UseCouncilStreamOptions) {
  const [messages, setMessages] = useState<DeliberationMessage[]>([])
  const [costs, setCosts] = useState<AgentCost[]>([])
  const [tokenTextByAgent, setTokenTextByAgent] = useState<Partial<Record<AgentRole, string>>>({})
  const [activeAgent, setActiveAgent] = useState<AgentRole>('planner')
  const [ended, setEnded] = useState(false)
  const [notice, setNotice] = useState<CouncilNotice | null>(null)

  const onStreamEvent = useCallback((ev: SseEvent) => {
    if (ev.event === 'message' && typeof ev.data === 'object') {
      const msg = ev.data as DeliberationMessage
      const role = asAgentRole(msg.agent)
      if (role) {
        setActiveAgent(role)
        setTokenTextByAgent((current) => {
          const next = { ...current }
          delete next[role]
          return next
        })
      }
      setMessages((prev) => prev.concat(msg))
      return
    }

    if (ev.event === 'llm_token' && typeof ev.data === 'object') {
      const token = ev.data as LlmToken
      const mapped = TOKEN_AGENT[token.role ?? ''] ?? asAgentRole(token.role ?? '') ?? activeAgent
      setActiveAgent(mapped)
      setTokenTextByAgent((current) => ({
        ...current,
        [mapped]: ((current[mapped] ?? '') + (token.text ?? '')).slice(-tokenLimit),
      }))
      return
    }

    if (ev.event === 'cost' && typeof ev.data === 'object') {
      setCosts((prev) => prev.concat(ev.data as AgentCost))
      return
    }

    if (ev.event === 'notice' && typeof ev.data === 'object') {
      setNotice(ev.data as CouncilNotice)
      return
    }

    if (ev.event === 'session_end') {
      setEnded(true)
      return
    }

    onUnhandledEvent?.(ev)
  }, [activeAgent, onUnhandledEvent, tokenLimit])

  const { status } = useEventStream(streamUrl, { onEvent: onStreamEvent })
  const streamLive = status === 'open' || status === 'connecting'

  const totalTokens = useMemo(
    () => costs.reduce((sum, cost) => sum + (cost.prompt_tokens ?? 0) + (cost.completion_tokens ?? 0), 0),
    [costs],
  )
  const completedAgents = useMemo(
    () => new Set(messages.map((message) => asAgentRole(message.agent)).filter(Boolean) as AgentRole[]),
    [messages],
  )
  const activeTokenEntries = useMemo(
    () => COUNCIL_ROSTER
      .map((role) => ({ role, text: tokenTextByAgent[role] ?? '' }))
      .filter((entry) => entry.text),
    [tokenTextByAgent],
  )
  const visibleActiveAgent =
    activeTokenEntries.length > 0 || !streamLive || ended
      ? activeAgent
      : COUNCIL_ROSTER.find((role) => !completedAgents.has(role)) ?? activeAgent

  return {
    activeTokenEntries,
    completedAgents,
    costs,
    ended,
    messages,
    notice,
    sessionId,
    setCosts,
    setEnded,
    setMessages,
    status,
    streamLive,
    totalTokens,
    visibleActiveAgent,
  }
}

export function TypingCard({
  role,
  text,
  label,
  className = 'max-w-[880px]',
}: {
  role: AgentRole
  text: string
  label: string
  className?: string
}) {
  return (
    <Card variant="surface" className={`${className} border-border-strong p-4 shadow-glow`}>
      <div className="mb-2 flex items-center gap-2">
        <StatusDot status="thinking" size={6} />
        <span className="text-sm font-medium" style={{ color: agentHue(role) }}>
          {agentLabel(role)} typing
        </span>
        <Small className="font-mono text-fg-subtle">{label}</Small>
      </div>
      <p className="m-0 min-h-10 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
        {text || 'Preparing next turn...'}
        <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-fg-muted" />
      </p>
    </Card>
  )
}
