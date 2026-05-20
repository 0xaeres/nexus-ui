'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page'
import { H1, H2, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import {
  ApiError,
  addSource,
  createProduct,
  createSession,
} from '@/lib/api'
import {
  COUNCIL_AGENT_HUES,
  COUNCIL_AGENT_LABELS,
  COUNCIL_ROSTERS,
} from '@/lib/types'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4

const CONNECTOR_TEMPLATES = [
  { id: 'github', name: 'GitHub', secret: 'token', placeholder: 'ghp_...' },
  { id: 'filesystem', name: 'Local filesystem', secret: null, placeholder: '/path/to/code' },
]


function StepIndicator({ current }: { current: Step }) {
  const total = 4
  return (
    <div className="flex items-center mb-10 max-w-lg w-full">
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as Step
        const done = step < current
        const active = step === current
        return (
          <div key={i} className={cn('flex items-center', i < total - 1 && 'flex-1')}>
            <div
              className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 shrink-0 transition-colors',
                done && 'bg-success border-success text-bg',
                active && !done && 'bg-accent border-accent text-bg',
                !done && !active && 'bg-surface border-border-strong text-fg-subtle',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : step}
            </div>
            {i < total - 1 && (
              <div className={cn('flex-1 h-px mx-2 transition-colors', done ? 'bg-success' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}


export function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Step 1 state
  const [productId, setProductId] = useState('')
  const [productName, setProductName] = useState('')
  const [tagline, setTagline] = useState('')
  const [teamLead, setTeamLead] = useState('')

  // Step 2 state
  const [sourceType, setSourceType] = useState<string>('github')
  const [sourceName, setSourceName] = useState('github')
  const [sourceSecret, setSourceSecret] = useState('')
  const [sourceRoot, setSourceRoot] = useState('')

  // Step 4 state
  const [councilTopic, setCouncilTopic] = useState('')

  // ------------------------------------------------------------ step actions

  const createProductStep = async () => {
    setBusy(true); setError(null)
    try {
      const id = productId.trim() || productName.trim().toLowerCase().replace(/\s+/g, '-')
      await createProduct({
        id,
        name: productName.trim() || id,
        tagline: tagline.trim(),
        owner: { team: id, lead: teamLead.trim() || 'unknown' },
      })
      setProductId(id)
      setStep(2)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const addSourceStep = async () => {
    setBusy(true); setError(null)
    try {
      const config: Record<string, unknown> = {}
      if (sourceType === 'github' && sourceSecret) config.token = sourceSecret
      if (sourceType === 'filesystem' && sourceRoot) config.roots = sourceRoot.split(',').map(s => s.trim())
      await addSource(productId, {
        name: sourceName.trim() || sourceType,
        type: sourceType,
        config,
      })
      setStep(3)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const skipIngestStep = () => {
    // Real ingestion runs via the daemon; the wizard just advances past it
    // since /ingest is a CLI command, not an API endpoint.
    setStep(4)
  }

  const startCouncilStep = async () => {
    setBusy(true); setError(null)
    try {
      const topic = councilTopic.trim() || `${productName} overview`
      const { session_id } = await createSession(productId, {
        topic,
        skill_kind: 'master',
      })
      router.push(`/p/${productId}/council/${session_id}`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  // ------------------------------------------------------------ render

  return (
    <div className="flex-1 flex flex-col items-center px-10 py-12 overflow-auto">
      <PageHeader>
        <H1>Onboard a product</H1>
        <Badge variant="outline" className="font-mono">step {step} of 4</Badge>
      </PageHeader>

      <div className="w-full max-w-2xl flex flex-col items-center pt-6">
        <StepIndicator current={step} />

        {error && (
          <Card variant="surface" className="w-full mb-4 px-5 py-3 border border-danger/30 bg-danger/10">
            <Small className="text-danger font-mono">{error}</Small>
          </Card>
        )}

        <Card variant="surface" className="w-full p-6 flex flex-col gap-4">
          {step === 1 && (
            <>
              <H2>Identity</H2>
              <Muted>Name your product. The id becomes its URL slug.</Muted>
              <KV label="product id">
                <Input
                  value={productId}
                  onChange={e => setProductId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="forge"
                  required
                />
              </KV>
              <KV label="display name">
                <Input
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="Forge"
                  required
                />
              </KV>
              <KV label="tagline">
                <Input
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="What this product is"
                />
              </KV>
              <KV label="team lead">
                <Input
                  value={teamLead}
                  onChange={e => setTeamLead(e.target.value)}
                  placeholder="jane.doe@org"
                />
              </KV>
              <StepFooter
                onNext={createProductStep}
                nextDisabled={!productName.trim() || busy}
                busy={busy}
              />
            </>
          )}

          {step === 2 && (
            <>
              <H2>First source</H2>
              <Muted>Add at least one MCP-compatible source. You can add more later.</Muted>
              <div className="grid grid-cols-2 gap-2">
                {CONNECTOR_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setSourceType(t.id); setSourceName(t.id) }}
                    className={cn(
                      'rounded-md border p-3 text-left transition-colors',
                      sourceType === t.id
                        ? 'border-accent bg-bg-active'
                        : 'border-border bg-surface hover:bg-bg-active',
                    )}
                  >
                    <div className="font-mono text-base text-fg">{t.name}</div>
                  </button>
                ))}
              </div>
              <KV label="source name">
                <Input value={sourceName} onChange={e => setSourceName(e.target.value)} />
              </KV>
              {sourceType === 'github' && (
                <KV label="github token">
                  <Input
                    type="password"
                    value={sourceSecret}
                    onChange={e => setSourceSecret(e.target.value)}
                    placeholder="ghp_..."
                  />
                </KV>
              )}
              {sourceType === 'filesystem' && (
                <KV label="root path">
                  <Input
                    value={sourceRoot}
                    onChange={e => setSourceRoot(e.target.value)}
                    placeholder="/path/to/code"
                  />
                </KV>
              )}
              <StepFooter
                onBack={() => setStep(1)}
                onNext={addSourceStep}
                nextDisabled={busy}
                busy={busy}
              />
            </>
          )}

          {step === 3 && (
            <>
              <H2>Ingestion</H2>
              <Muted>
                Run <code className="font-mono">nexus ingest --product {productId} --path …</code>
                {' '}from your terminal to populate the corpus. The daemon will keep it
                fresh once you set <code className="font-mono">watch: true</code> in the
                connector config.
              </Muted>
              <div className="bg-bg-active rounded-md p-3 font-mono text-xs text-fg-muted whitespace-pre-wrap">
                {`uv run nexus ingest --product ${productId} --path /path/to/code`}
              </div>
              <StepFooter
                onBack={() => setStep(2)}
                onNext={skipIngestStep}
                nextLabel="Skip and continue"
              />
            </>
          )}

          {step === 4 && (
            <>
              <H2>Master skill council</H2>
              <Muted>
                Kick off the first council session to draft the Master Skill.
                4 agents will run; estimated cost ≈ $0.012, ~6-8 minutes.
              </Muted>
              <KV label="topic">
                <Input
                  value={councilTopic}
                  onChange={e => setCouncilTopic(e.target.value)}
                  placeholder={`${productName} overview`}
                />
              </KV>
              <div className="flex flex-wrap gap-2 pt-2">
                <SectionLabel className="w-full">Roster preview</SectionLabel>
                {COUNCIL_ROSTERS.master.map(r => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface border border-border text-xs font-mono"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: COUNCIL_AGENT_HUES[r] }} />
                    {COUNCIL_AGENT_LABELS[r]}
                  </span>
                ))}
              </div>
              <StepFooter
                onBack={() => setStep(3)}
                onNext={startCouncilStep}
                nextLabel="Start council"
                busy={busy}
              />
            </>
          )}
        </Card>

        <Subtle className="mt-6 font-mono">
          {step === 1 && 'After onboarding you can manage everything from /p/{id}/settings'}
          {step === 2 && 'MCP-compatible connectors only - we map type → command at runtime'}
          {step === 3 && 'Live status will appear on the Sources page once daemon is running'}
          {step === 4 && 'Master skill seeds the product; domain skills come later'}
        </Subtle>
      </div>
    </div>
  )
}


function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Subtle className="font-mono uppercase tracking-wider text-xs">{label}</Subtle>
      {children}
    </div>
  )
}


function StepFooter({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  busy = false,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  busy?: boolean
}) {
  return (
    <div className="flex items-center gap-2 pt-3">
      {onBack ? (
        <Button variant="ghost" size="sm" onClick={onBack} disabled={busy}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      ) : <div />}
      <div className="flex-1" />
      <Button onClick={onNext} disabled={nextDisabled || busy} size="sm">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Working…' : nextLabel}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  )
}
