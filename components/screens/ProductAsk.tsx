'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CornerDownLeft, Loader2, MessageSquareText, Send } from 'lucide-react'
import { askProductAgent, listProductAgentModels } from '@/lib/api'
import type { GraphRAGAnswer, GraphRAGMessage } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MarkdownContent } from '@/components/ui/markdown'
import { PageBody, PageHeader } from '@/components/ui/page'
import { Textarea } from '@/components/ui/textarea'
import { H1, Small } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

type ChatTurn =
  | { id: string; role: 'user'; content: string }
  | { id: string; role: 'assistant'; content: string; answer: GraphRAGAnswer }

export function ProductAsk({ productId }: { productId: string }) {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const history = useMemo<GraphRAGMessage[]>(
    () => turns.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    [turns],
  )

  useEffect(() => {
    let alive = true
    listProductAgentModels(productId)
      .then((result) => {
        if (!alive) return
        setModels(result.models)
        setModel(result.default || result.models[0] || '')
      })
      .catch(() => {
        if (!alive) return
        setModels([])
      })
    return () => {
      alive = false
    }
  }, [productId])

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const message = draft.trim()
    if (!message || loading) return
    setError(null)
    setLoading(true)
    setDraft('')
    const userTurn: ChatTurn = { id: crypto.randomUUID(), role: 'user', content: message }
    setTurns((current) => [...current, userTurn])
    try {
      const answer = await askProductAgent(productId, {
        message,
        history,
        max_depth: 3,
        top_k: 12,
        model: model || undefined,
      })
      const assistantTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer.answer,
        answer,
      }
      setTurns((current) => [...current, assistantTurn])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setDraft(message)
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const askClarification = (name: string) => {
    const lastQuestion = [...turns].reverse().find((turn) => turn.role === 'user')?.content
    setDraft(lastQuestion ? `${lastQuestion}\n\nFocus on ${name}.` : name)
    textareaRef.current?.focus()
  }

  return (
    <>
      <PageHeader>
        <MessageSquareText className="h-5 w-5 text-accent" />
        <H1>Ask</H1>
        <Badge variant="outline" className="font-mono">{productId}</Badge>
        {models.length > 0 && (
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="ml-auto h-8 rounded-md border border-border bg-surface px-2 font-mono text-xs text-fg outline-none focus:border-accent"
            disabled={loading}
            aria-label="Chat model"
          >
            {models.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      </PageHeader>
      <PageBody className="max-w-6xl py-5">
        <div className="grid min-h-[calc(100vh-11rem)] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="flex min-h-0 flex-col rounded-lg border border-border bg-surface">
            <div className="flex-1 overflow-y-auto p-4">
              {turns.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="max-w-md space-y-3">
                    <MessageSquareText className="mx-auto h-9 w-9 text-fg-subtle" />
                    <Small className="block text-fg-subtle">No messages yet.</Small>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {turns.map((turn) => (
                    <ChatBubble
                      key={turn.id}
                      turn={turn}
                      onClarification={askClarification}
                    />
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-fg-subtle">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <form onSubmit={submit} className="border-t border-border p-3">
              {error && (
                <div className="mb-3 flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{error}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void submit()
                    }
                  }}
                  placeholder="Ask Nexus..."
                  rows={3}
                  className="min-h-[84px] resize-none font-sans"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading || !draft.trim()} aria-label="Send">
                  {loading ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
                <kbd className="rounded border border-border-strong bg-surface px-1.5 py-0.5 font-mono">
                  Enter
                </kbd>
                <span>send</span>
                <kbd className="rounded border border-border-strong bg-surface px-1.5 py-0.5 font-mono">
                  Shift Enter
                </kbd>
                <span>new line</span>
              </div>
            </form>
          </section>
          <aside className="hidden min-h-0 xl:block">
            <ContextRail latest={latestAnswer(turns)} />
          </aside>
        </div>
      </PageBody>
    </>
  )
}

function ChatBubble({
  turn,
  onClarification,
}: {
  turn: ChatTurn
  onClarification: (name: string) => void
}) {
  const isUser = turn.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[82%] rounded-lg border px-4 py-3',
        isUser
          ? 'border-accent/30 bg-accent/[0.12] text-fg'
          : 'border-border bg-bg',
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.content}</p>
        ) : (
          <div className="space-y-3">
            <MarkdownContent compact>{turn.content}</MarkdownContent>
            <AnswerMeta answer={turn.answer} onClarification={onClarification} />
          </div>
        )}
      </div>
    </div>
  )
}

function AnswerMeta({
  answer,
  onClarification,
}: {
  answer: GraphRAGAnswer
  onClarification: (name: string) => void
}) {
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant={answer.graph_used ? 'success' : 'outline'}>
          {answer.graph_used ? 'graph' : 'retrieval'}
        </Badge>
        <Badge variant="outline" className="font-mono">
          {Math.round(answer.confidence * 100)}%
        </Badge>
        {answer.reranked && <Badge variant="outline">reranked</Badge>}
      </div>
      {answer.needs_clarification && answer.clarification_options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {answer.clarification_options.map((entity) => (
            <Button
              key={entity.stable_id}
              variant="secondary"
              size="sm"
              onClick={() => onClarification(entity.name || entity.stable_id)}
              type="button"
            >
              <CornerDownLeft />
              {entity.name || entity.stable_id}
            </Button>
          ))}
        </div>
      )}
      {answer.citations.length > 0 && (
        <div className="grid gap-2">
          {answer.citations.slice(0, 4).map((citation) => (
            <div key={citation.id} className="rounded-md border border-border bg-surface px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{citation.id}</Badge>
                <Small className="font-mono text-fg-subtle truncate">{citation.anchor}</Small>
              </div>
              {citation.excerpt && (
                <p className="mt-1 max-h-10 overflow-hidden text-xs leading-relaxed text-fg-muted">
                  {citation.excerpt}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContextRail({ latest }: { latest: GraphRAGAnswer | null }) {
  if (!latest) {
    return (
      <Card>
        <CardContent className="space-y-3">
          <Small className="font-mono uppercase tracking-wider text-fg-subtle">Context</Small>
          <Small className="block text-fg-subtle">No answer selected.</Small>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <Small className="font-mono uppercase tracking-wider text-fg-subtle">Entities</Small>
          <div className="space-y-2">
            {latest.resolved_entities.length === 0 ? (
              <Small className="block text-fg-subtle">None resolved.</Small>
            ) : latest.resolved_entities.slice(0, 8).map((entity) => (
              <div key={entity.stable_id} className="rounded-md border border-border bg-bg px-3 py-2">
                <Small className="block truncate text-fg">{entity.name || entity.stable_id}</Small>
                <Small className="block truncate font-mono text-fg-subtle">
                  {entity.labels.join(', ')}
                </Small>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3">
          <Small className="font-mono uppercase tracking-wider text-fg-subtle">Paths</Small>
          <div className="space-y-2">
            {latest.graph_paths.length === 0 ? (
              <Small className="block text-fg-subtle">No paths returned.</Small>
            ) : latest.graph_paths.slice(0, 6).map((path) => (
              <div key={`${path.seed_id}-${path.edge_ids.join('-')}`} className="rounded-md border border-border bg-bg px-3 py-2">
                <Small className="block text-fg">{path.summary}</Small>
                <Small className="block font-mono text-fg-subtle">
                  {path.edge_ids.length} edges · {Math.round(path.confidence * 100)}%
                </Small>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {latest.unknowns.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <Small className="font-mono uppercase tracking-wider text-fg-subtle">Unknowns</Small>
            <div className="space-y-2">
              {latest.unknowns.map((unknown) => (
                <Small key={unknown} className="block rounded-md border border-border bg-bg px-3 py-2 text-fg-subtle">
                  {unknown}
                </Small>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function latestAnswer(turns: ChatTurn[]): GraphRAGAnswer | null {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    const turn = turns[i]
    if (turn.role === 'assistant') return turn.answer
  }
  return null
}
