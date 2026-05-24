'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { H3, Muted, Small, Subtle } from '@/components/ui/typography'
import { StageError, StageShell } from '@/components/stages/StageShell'
import { useEventStream } from '@/lib/hooks/useEventStream'
import {
  ApiError,
  createSession,
  getProduct,
  getProductStatus,
  sessionStreamUrl,
} from '@/lib/api'
import {
  COUNCIL_AGENT_HUES,
  COUNCIL_AGENT_LABELS,
  COUNCIL_ROSTER,
  type AgentCost,
  type AgentRole,
  type DeliberationMessage,
  type Product,
  type ProductStatus,
} from '@/lib/types'

const KNOWN_AGENTS = new Set<AgentRole>(['drafter', 'critic', 'reviser'])

const asAgentRole = (v: string): AgentRole | null =>
  KNOWN_AGENTS.has(v as AgentRole) ? (v as AgentRole) : null

const agentHue = (n: string) => {
  const role = asAgentRole(n)
  return role ? COUNCIL_AGENT_HUES[role] : '#7C8CFF'
}
const agentLabel = (n: string) => {
  const role = asAgentRole(n)
  return role ? COUNCIL_AGENT_LABELS[role] : n
}

export function CouncilStage({ productId }: { productId: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const sessionFromUrl = params.get('session')

  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<ProductStatus | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(sessionFromUrl)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getProduct(productId), getProductStatus(productId)])
      .then(([p, s]) => {
        if (cancelled) return
        setProduct(p)
        setStatus(s)
        if (s.currentStage === 'skill') {
          router.replace(`/p/${productId}/skill`)
          return
        }
        if (s.currentStage === 'review') {
          router.replace(`/p/${productId}/review`)
          return
        }
        if (!s.hasEmbeddings) {
          router.replace(`/p/${productId}/ingest`)
          return
        }
        if (!sessionId && s.currentSessionId) setSessionId(s.currentSessionId)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [productId, router, sessionId])

  const runCouncil = async () => {
    setLaunching(true)
    setError(null)
    try {
      const { session_id } = await createSession(productId, {
        topic: `${product?.name ?? productId} overview`,
      })
      setSessionId(session_id)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
    } finally {
      setLaunching(false)
    }
  }

  return (
    <StageShell
      productId={productId}
      productName={product?.name}
      stage="council"
      reached={status?.currentStage ?? 'none'}
    >
      {error && <StageError message={error} />}

      {!sessionId && status?.hasEmbeddings && (
        <KickoffCard onRun={runCouncil} busy={launching} productName={product?.name ?? productId} />
      )}

      {sessionId && (
        <CouncilLive
          sessionId={sessionId}
          productId={productId}
          onComplete={() => router.replace(`/p/${productId}/review`)}
        />
      )}
    </StageShell>
  )
}

function KickoffCard({
  onRun,
  busy,
  productName,
}: {
  onRun: () => void
  busy: boolean
  productName: string
}) {
  return (
    <Card variant="surface" className="max-w-2xl mx-auto p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <H3>Run the Council</H3>
          <Muted>Three agents will draft → critique → revise the skill for {productName}.</Muted>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {COUNCIL_ROSTER.map((r) => (
          <span
            key={r}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-raised border border-border text-xs font-mono"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: COUNCIL_AGENT_HUES[r] }} />
            {COUNCIL_AGENT_LABELS[r]}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Subtle className="font-mono">~6–8 minutes · ~$0.012 estimated</Subtle>
        <Button onClick={onRun} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting…
            </>
          ) : (
            <>
              Start Council
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

function CouncilLive({
  sessionId,
  productId,
  onComplete,
}: {
  sessionId: string
  productId: string
  onComplete: () => void
}) {
  void productId
  const [messages, setMessages] = useState<DeliberationMessage[]>([])
  const [costs, setCosts] = useState<AgentCost[]>([])
  const [ended, setEnded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)

  const { events, status: streamStatus } = useEventStream(sessionStreamUrl(sessionId))

  useEffect(() => {
    for (const ev of events) {
      if (ev.event === 'message' && typeof ev.data === 'object') {
        setMessages((prev) => prev.concat(ev.data as DeliberationMessage))
      } else if (ev.event === 'cost' && typeof ev.data === 'object') {
        setCosts((prev) => prev.concat(ev.data as AgentCost))
      } else if (ev.event === 'session_end') {
        setEnded(true)
      }
    }
  }, [events])

  useEffect(() => {
    if (ended && !completedRef.current) {
      completedRef.current = true
      const t = setTimeout(onComplete, 1200)
      return () => clearTimeout(t)
    }
  }, [ended, onComplete])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const totalTokens = useMemo(
    () =>
      costs.reduce(
        (sum, c) => sum + (c.prompt_tokens ?? 0) + (c.completion_tokens ?? 0),
        0,
      ),
    [costs],
  )

  const live = streamStatus === 'open' || streamStatus === 'connecting'

  return (
    <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-2">
        {live && !ended ? (
          <Badge variant="violet" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-[nexus-pulse_2.4s_ease-in-out_infinite]" />
            Live
          </Badge>
        ) : ended ? (
          <Badge variant="success">Session complete</Badge>
        ) : (
          <Badge variant="outline">Replay</Badge>
        )}
        <Subtle className="font-mono">session · {sessionId}</Subtle>
        <div className="flex-1" />
        {totalTokens > 0 && (
          <Badge variant="outline" className="font-mono">
            {totalTokens.toLocaleString()} tok
          </Badge>
        )}
      </div>

      <div ref={scrollRef} className="flex flex-col gap-3 max-h-[60vh] overflow-auto pr-1">
        {messages.length === 0 && (
          <Muted className="font-mono text-center py-12">
            {live ? 'Waiting for first agent turn…' : 'Loading session…'}
          </Muted>
        )}
        {messages.map((m, i) => (
          <Card key={i} variant="surface" className="p-4 flex flex-col gap-2 animate-[nexus-msg-in_0.22s_ease-out]">
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: agentHue(m.agent) }}
              />
              <span className="text-sm font-medium" style={{ color: agentHue(m.agent) }}>
                {agentLabel(m.agent)}
              </span>
              {m.timestamp && (
                <Small className="font-mono text-fg-subtle">
                  {m.timestamp.slice(11, 19)}
                </Small>
              )}
            </div>
            <p className="m-0 text-sm text-fg leading-relaxed whitespace-pre-wrap">{m.body}</p>
          </Card>
        ))}
        {ended && (
          <Muted className="text-center py-2 font-mono">— forwarding to review —</Muted>
        )}
      </div>
    </div>
  )
}
