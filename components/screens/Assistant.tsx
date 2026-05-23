'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Sparkles, Send, AlertTriangle, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page'
import { H1, H3, Body, Muted, Small, SectionLabel, Code } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import {
  ApiError,
  confirmAction,
  getAssistantIdentity,
  rejectAction,
  startAtlassianAuth,
  streamAssistantMessage,
} from '@/lib/api'
import type { ActionProposal, ActionProposalStatus, AssistantIdentity } from '@/lib/types'
import { cn } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  proposal?: ActionProposal | null
}

type LiveStep = { tool: string; status: 'running' | 'done' | 'error' }

let _idc = 0
const nextId = () => `m${++_idc}`

const STATUS_VARIANT: Record<ActionProposalStatus, 'warning' | 'success' | 'accent' | 'outline' | 'danger'> = {
  pending: 'warning',
  confirmed: 'accent',
  executed: 'success',
  rejected: 'outline',
  failed: 'danger',
}

export function Assistant() {
  const { currentProductId, currentUser } = useProduct()
  const actor = currentUser.id
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [liveSteps, setLiveSteps] = useState<LiveStep[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [identity, setIdentity] = useState<AssistantIdentity | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAssistantIdentity(currentProductId, actor)
      .then(setIdentity)
      .catch(() => setIdentity(null))
  }, [currentProductId, actor])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setError(null)
    setMessages(m => [...m, { id: nextId(), role: 'user', content: text }])
    setSending(true)
    setLiveSteps([])
    try {
      await streamAssistantMessage(
        currentProductId,
        { text, conversation_id: conversationId ?? undefined, actor },
        {
          onConversationId: id => setConversationId(id),
          onToolCall: tool =>
            setLiveSteps(s => [...s, { tool, status: 'running' }]),
          onToolResult: (_tool, ok) =>
            setLiveSteps(s => {
              const next = [...s]
              for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].status === 'running') {
                  next[i] = { ...next[i], status: ok ? 'done' : 'error' }
                  break
                }
              }
              return next
            }),
          onFinal: final => {
            setConversationId(final.conversation_id)
            setMessages(m => [
              ...m,
              {
                id: nextId(),
                role: 'assistant',
                content: final.reply,
                proposal: final.action_proposal,
              },
            ])
          },
          onError: msg => setError(msg),
        },
      )
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
      setLiveSteps([])
    }
  }, [input, sending, conversationId, currentProductId, actor])

  const replaceProposal = useCallback((p: ActionProposal) => {
    setMessages(m => m.map(msg => (msg.proposal?.id === p.id ? { ...msg, proposal: p } : msg)))
  }, [])

  const onConfirm = useCallback(async (id: string) => {
    try {
      replaceProposal(await confirmAction(id, actor))
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [actor, replaceProposal])

  const onReject = useCallback(async (id: string) => {
    try {
      replaceProposal(await rejectAction(id, actor))
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [actor, replaceProposal])

  const newConversation = () => {
    setConversationId(null)
    setMessages([])
    setError(null)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader>
        <Sparkles className="h-5 w-5 text-accent" />
        <H1>Assistant</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={newConversation} disabled={!messages.length}>
          New conversation
        </Button>
      </PageHeader>

      {identity?.available && !identity.connected && <ConnectBanner actor={actor} />}
      {identity && !identity.available && (
        <div className="px-8 py-2 bg-surface border-b border-border">
          <Small className="text-fg-subtle">
            Atlassian not configured — the assistant runs against stubbed Jira/Confluence
            data.{identity.reason ? ` (${identity.reason})` : ''}
          </Small>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-[860px] mx-auto px-8 py-8 flex flex-col gap-6">
          {messages.length === 0 && <EmptyState onPick={setInput} />}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onConfirm={onConfirm} onReject={onReject} />
          ))}
          {sending && <LiveProgress steps={liveSteps} />}
          {error && (
            <Card variant="surface" className="px-4 py-3 border border-danger/30 bg-danger/10">
              <Muted className="font-mono text-sm">{error}</Muted>
            </Card>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-bg">
        <div className="max-w-[860px] mx-auto px-8 py-4 flex items-center gap-3">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder="Ask about a Jira issue, search Confluence, or draft changes…"
            disabled={sending}
            className="flex-1 h-11"
          />
          <Button onClick={() => void send()} disabled={sending || !input.trim()} className="h-11">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

function ConnectBanner({ actor }: { actor: string }) {
  const [busy, setBusy] = useState(false)
  const connect = async () => {
    setBusy(true)
    try {
      const { authorize_url } = await startAtlassianAuth(actor)
      window.location.href = authorize_url
    } catch {
      setBusy(false)
    }
  }
  return (
    <div className="px-8 py-3 bg-accent/10 border-b border-accent/20 flex items-center gap-3">
      <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
      <Small className="flex-1">
        Connect your Atlassian account so the assistant can read and act on your Jira &amp;
        Confluence as you.
      </Small>
      <Button size="sm" onClick={connect} disabled={busy}>
        {busy ? 'Redirecting…' : 'Connect Atlassian'}
      </Button>
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  const examples = [
    'Summarize JIRA-1234 and its current status',
    'Search Confluence for our on-call runbook',
    'Break JIRA-1234 into subtasks',
  ]
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Sparkles className="h-10 w-10 text-accent" />
      <H3>Ask the assistant</H3>
      <Muted className="max-w-md">
        Query Jira and Confluence, search the indexed codebase, or draft changes for your
        confirmation. Writes never happen without an explicit confirm.
      </Muted>
      <div className="flex flex-col gap-2 mt-2">
        {examples.map(ex => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="text-sm text-accent hover:underline font-mono"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}

function LiveProgress({ steps }: { steps: LiveStep[] }) {
  return (
    <div className="flex flex-col gap-2 items-start">
      <SectionLabel>Assistant</SectionLabel>
      <Card
        variant="surface"
        className="px-4 py-3 max-w-[90%] bg-surface-raised flex flex-col gap-1.5"
      >
        {steps.length === 0 && (
          <div className="flex items-center gap-2 text-fg-subtle">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <Small className="font-mono">Thinking…</Small>
          </div>
        )}
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-xs">
            {s.status === 'running' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            )}
            {s.status === 'done' && (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            )}
            {s.status === 'error' && <XCircle className="h-3.5 w-3.5 text-danger" />}
            <span className={s.status === 'running' ? 'text-fg-muted' : 'text-fg-subtle'}>
              {s.tool}
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}

function MessageBubble({
  msg,
  onConfirm,
  onReject,
}: {
  msg: ChatMessage
  onConfirm: (id: string) => void
  onReject: (id: string) => void
}) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
      <SectionLabel>{isUser ? 'You' : 'Assistant'}</SectionLabel>
      <Card
        variant="surface"
        className={cn('px-4 py-3 max-w-[90%]', isUser ? 'bg-surface' : 'bg-surface-raised')}
      >
        <Body className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</Body>
      </Card>
      {msg.proposal && (
        <ActionProposalCard proposal={msg.proposal} onConfirm={onConfirm} onReject={onReject} />
      )}
    </div>
  )
}

function ActionProposalCard({
  proposal,
  onConfirm,
  onReject,
}: {
  proposal: ActionProposal
  onConfirm: (id: string) => void
  onReject: (id: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const pending = proposal.status === 'pending'
  const wrap = async (fn: () => void | Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card variant="surface" className="w-full max-w-[90%] p-4 flex flex-col gap-3 border-warning/30">
      <div className="flex items-center gap-2 flex-wrap">
        <SectionLabel>Proposed {proposal.target.system} change</SectionLabel>
        <Code className="text-xs">{proposal.target.key}</Code>
        <div className="flex-1" />
        <Badge variant={STATUS_VARIANT[proposal.status]}>{proposal.status}</Badge>
      </div>
      <pre className="font-mono text-xs whitespace-pre-wrap bg-bg-active rounded-md p-3 text-fg-muted overflow-x-auto">
        {proposal.preview}
      </pre>
      {proposal.status === 'executed' && (
        <Small className="text-success flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Applied — {proposal.plan.length} change{proposal.plan.length === 1 ? '' : 's'}.
        </Small>
      )}
      {proposal.status === 'failed' && (
        <Small className="text-danger flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5" />
          {proposal.error ?? 'Execution failed.'}
        </Small>
      )}
      {pending && (
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={busy} onClick={() => wrap(() => onConfirm(proposal.id))}>
            {busy ? 'Working…' : 'Confirm & apply'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => wrap(() => onReject(proposal.id))}
          >
            Reject
          </Button>
        </div>
      )}
    </Card>
  )
}
