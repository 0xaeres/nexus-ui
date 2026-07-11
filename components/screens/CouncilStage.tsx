'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { H3, Muted, Small, Subtle } from '@/components/ui/typography'
import { useToast } from '@/components/ui/toast'
import { StageError, StageShell } from '@/components/stages/StageShell'
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
  type Product,
  type ProductStatus,
} from '@/lib/types'
import { TypingCard, agentHue, agentLabel, useCouncilStream } from '@/components/screens/council-stream'

export function CouncilStage({ productId }: { productId: string }) {
  const router = useRouter()
  const toast = useToast()
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
        if (s.currentStage === 'review') {
          router.replace(`/p/${productId}/review`)
          return
        }
        if (!s.hasEmbeddings) {
          router.replace(`/p/${productId}/ingest`)
          return
        }
        // Adopt an in-flight session if we don't already have one. Functional
        // update keeps sessionId out of the dep array so this guard runs only
        // on mount — otherwise starting a council sets sessionId, re-runs this
        // effect, and a still-stale hasEmbeddings bounces us back to /ingest.
        setSessionId((cur) => cur ?? s.currentSessionId ?? null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [productId, router])

  const runCouncil = async () => {
    setLaunching(true)
    setError(null)
    try {
      const { session_id } = await createSession(productId, {
        topic: `${product?.name ?? productId} overview`,
      })
      setSessionId(session_id)
      toast({ title: 'Council started', description: 'Expert pack is drafting proposals.', variant: 'success' })
    } catch (e: unknown) {
      const message = e instanceof ApiError ? e.message : String(e)
      setError(message)
      toast({ title: 'Council failed to start', description: message, variant: 'danger', duration: 7000 })
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
          onRetry={runCouncil}
          retrying={launching}
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
    <Card variant="glass" className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <H3>Run the Council</H3>
          <Muted>Expert agents will draft one product context skill for {productName}.</Muted>
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
  onRetry,
  retrying,
}: {
  sessionId: string
  productId: string
  onComplete: () => void
  onRetry: () => void
  retrying: boolean
}) {
  void productId
  const scrollRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)
  const {
    activeTokenEntries,
    completedAgents,
    ended,
    messages,
    notice,
    streamLive: live,
    totalTokens,
    visibleActiveAgent,
  } = useCouncilStream({
    sessionId,
    streamUrl: sessionStreamUrl(sessionId),
    tokenLimit: 1800,
  })

  useEffect(() => {
    if (ended && !notice && !completedRef.current) {
      completedRef.current = true
      const t = setTimeout(onComplete, 1200)
      return () => clearTimeout(t)
    }
  }, [ended, notice, onComplete])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, activeTokenEntries])
  const currentAgentLabel = agentLabel(visibleActiveAgent)
  const progressIndex = Math.max(0, COUNCIL_ROSTER.indexOf(visibleActiveAgent))

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        {live && !ended ? (
          <Badge variant="violet" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-[anvay-pulse_2.4s_ease-in-out_infinite]" />
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

      <Card variant="surface" className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          {COUNCIL_ROSTER.map((role, index) => {
            const active = (
              role === visibleActiveAgent || activeTokenEntries.some((entry) => entry.role === role)
            ) && live && !ended
            const done = index < progressIndex || completedAgents.has(role)
            return (
              <div
                key={role}
                className={[
                  'flex min-w-[118px] items-center gap-2 rounded-md border px-2.5 py-2',
                  active ? 'border-border-strong bg-bg-active' : 'border-border bg-bg/40',
                ].join(' ')}
              >
                <StatusDot status={active ? 'thinking' : done ? 'done' : 'idle'} size={6} />
                <span className="truncate text-xs font-mono" style={{ color: active ? agentHue(role) : undefined }}>
                  {agentLabel(role)}
                </span>
              </div>
            )
          })}
          <div className="ml-auto flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2">
            <span className="h-2 w-2 rounded-full animate-[anvay-pulse_1.4s_ease-in-out_infinite]" style={{ background: agentHue(visibleActiveAgent) }} />
            <Small className="font-mono text-fg">Now: {currentAgentLabel}</Small>
          </div>
        </div>
      </Card>

      {notice && (
        <Card variant="glass" className="border-warning/40 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 flex flex-col gap-1">
              <Small className="font-medium text-warning">Council stopped</Small>
              <p className="m-0 text-sm text-fg">{notice.message}</p>
              {notice.detail && <Small className="font-mono text-fg-muted">{notice.detail}</Small>}
            </div>
            <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Retry
            </Button>
          </div>
        </Card>
      )}

      <div ref={scrollRef} className="flex flex-col gap-3 max-h-[60vh] overflow-auto pr-1">
        {messages.length === 0 && (
          <Muted className="font-mono text-center py-12">
            {live ? 'Waiting for first agent turn…' : 'Loading session…'}
          </Muted>
        )}
        {messages.map((m, i) => (
          <Card key={i} variant="glass" className="p-4 flex max-w-[880px] flex-col gap-2 animate-[anvay-msg-in_0.22s_ease-out]">
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
            <p className="m-0 text-sm text-fg leading-relaxed whitespace-pre-wrap">
              {m.body || 'Step completed.'}
            </p>
          </Card>
        ))}
        {live && !ended && activeTokenEntries.length === 0 && (
          <TypingCard role={visibleActiveAgent} text="" label="streaming tokens" />
        )}
        {live && !ended && activeTokenEntries.map((entry) => (
          <TypingCard key={entry.role} role={entry.role} text={entry.text} label="streaming tokens" />
        ))}
        {ended && !notice && (
          <Muted className="text-center py-2 font-mono">— forwarding to review —</Muted>
        )}
        {ended && notice && (
          <Muted className="text-center py-2 font-mono">— session stopped —</Muted>
        )}
      </div>
    </div>
  )
}
