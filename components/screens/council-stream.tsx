'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
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

type TokenBuffer = {
  chunks: string[]
  length: number
}

// Map backend ChatClient stream roles to UI lanes. Skill generation streams
// only the synthesizer (+ repair/eval when they make a call); legacy aliases
// kept for older sessions.
const TOKEN_AGENT: Record<string, AgentRole> = {
  synthesizer: 'synthesizer',
  drafter: 'synthesizer',
  repair: 'repair',
  reviser: 'repair',
  evaluator: 'skill-eval',
  critic: 'skill-eval',
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
  return role ? COUNCIL_AGENT_HUES[role] : COUNCIL_AGENT_HUES.planner
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
  const tokenBuffersRef = useRef<Partial<Record<AgentRole, TokenBuffer>>>({})

  const appendToken = useCallback((role: AgentRole, text: string) => {
    const buffers = tokenBuffersRef.current
    const buffer = buffers[role] ?? { chunks: [], length: 0 }
    if (text) {
      buffer.chunks.push(text)
      buffer.length += text.length
    }
    while (buffer.length > tokenLimit && buffer.chunks.length > 0) {
      const overflow = buffer.length - tokenLimit
      const first = buffer.chunks[0]
      if (first.length <= overflow) {
        buffer.length -= first.length
        buffer.chunks.shift()
      } else {
        buffer.chunks[0] = first.slice(overflow)
        buffer.length -= overflow
      }
    }
    buffers[role] = buffer
    return buffer.chunks.join('')
  }, [tokenLimit])

  const onStreamEvent = useCallback((ev: SseEvent) => {
    if (ev.event === 'message' && typeof ev.data === 'object') {
      const msg = ev.data as DeliberationMessage
      const role = asAgentRole(msg.agent)
      if (role) {
        setActiveAgent(role)
        delete tokenBuffersRef.current[role]
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
      const text = appendToken(mapped, token.text ?? '')
      setTokenTextByAgent((current) => ({
        ...current,
        [mapped]: text,
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
  }, [activeAgent, appendToken, onUnhandledEvent])

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
