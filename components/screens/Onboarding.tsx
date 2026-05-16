'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Hexagon, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BrandIcon } from '@/components/icons/BrandIcon'
import { IngestionProgress } from '@/components/sources/IngestionProgress'
import { PageHeader } from '@/components/ui/page'
import { H1, H2 } from '@/components/ui/typography'
import {
  NEXUS_CONNECTORS,
  COUNCIL_ROSTERS,
  COUNCIL_COST_ESTIMATES,
  COUNCIL_AGENT_LABELS,
  COUNCIL_AGENT_HUES,
} from '@/lib/data'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4

function StepIndicator({ current, total }: { current: Step; total: number }) {
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
  const [step, setStep] = useState<Step>(1)
  const [productName, setProductName] = useState('')
  const [tagline, setTagline] = useState('')
  const [teamLead, setTeamLead] = useState('')
  const [addedSources, setAddedSources] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  const newProductId = productName.toLowerCase().replace(/\s+/g, '-') || 'new-product'

  // Step 3 progress simulation
  useEffect(() => {
    if (step !== 3) return
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return Math.min(100, p + Math.random() * 12)
      })
    }, 600)
    return () => clearInterval(interval)
  }, [step])

  const ingestDone = progress >= 100

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader>
        <Hexagon className="h-5 w-5 text-accent" />
        <H1>Onboard new product</H1>
        <Badge variant="outline" className="font-mono">step {step} of 4</Badge>
      </PageHeader>

      <div className="flex-1 overflow-auto px-10 py-10">
        <div className="max-w-5xl mx-auto flex flex-col">
          <StepIndicator current={step} total={4} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
            <div className="max-w-3xl">
              {step === 1 && (
                <Step1
                  productName={productName} setProductName={setProductName}
                  tagline={tagline} setTagline={setTagline}
                  teamLead={teamLead} setTeamLead={setTeamLead}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <Step2
                  addedSources={addedSources} setAddedSources={setAddedSources}
                  onBack={() => setStep(1)} onNext={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <Step3 progress={progress} ingestDone={ingestDone} onNext={() => setStep(4)} />
              )}
              {step === 4 && (
                <Step4
                  newProductId={newProductId}
                  onLater={() => router.push(`/p/${newProductId}/dashboard`)}
                  onStart={() => router.push(`/p/${newProductId}/council/onboarding-master`)}
                />
              )}
            </div>

            <aside className="hidden lg:block sticky top-0">
              {step === 1 && <RailExplainer1 />}
              {step === 2 && <RailExplainer2 />}
              {step === 3 && <RailExplainer3 sources={addedSources} />}
              {step === 4 && <RailExplainer4 />}
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step1({ productName, setProductName, tagline, setTagline, teamLead, setTeamLead, onNext }: {
  productName: string; setProductName: (v: string) => void
  tagline: string; setTagline: (v: string) => void
  teamLead: string; setTeamLead: (v: string) => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <H2>Identity</H2>
        <p className="text-sm font-mono text-fg-subtle mt-1 mb-0">Tell Nexus about your product</p>
      </div>
      <div className="flex flex-col gap-4">
        <FormField label="Product name *" placeholder="forge" value={productName} onChange={setProductName} mono />
        <FormField label="Short tagline" placeholder="Sovereign agentic harness for developer workflows" value={tagline} onChange={setTagline} />
        <FormField label="Team lead" placeholder="j.lambert" value={teamLead} onChange={setTeamLead} mono />
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!productName.trim()}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function Step2({ addedSources, setAddedSources, onBack, onNext }: {
  addedSources: string[]; setAddedSources: (v: string[]) => void
  onBack: () => void; onNext: () => void
}) {
  const toggle = (id: string) => {
    setAddedSources(addedSources.includes(id) ? addedSources.filter(s => s !== id) : [...addedSources, id])
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <H2>Sources</H2>
        <p className="text-sm font-mono text-fg-subtle mt-1 mb-0">Connect knowledge sources for this product</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {NEXUS_CONNECTORS.map(c => {
          const added = addedSources.includes(c.id)
          return (
            <button key={c.id} onClick={() => toggle(c.id)} className="text-left">
              <Card
                variant="action"
                className={cn(
                  'p-5 flex flex-col gap-2 cursor-pointer transition-colors',
                  added && 'border-success/50 bg-success/[0.05]',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <BrandIcon id={c.id} size={22} />
                  <span className="text-base font-medium text-fg flex-1">{c.name}</span>
                  <span
                    className={cn(
                      'h-5 w-5 rounded-full border flex items-center justify-center shrink-0',
                      added ? 'bg-success border-success' : 'border-border-strong',
                    )}
                  >
                    {added && <Check className="h-3 w-3 text-bg" />}
                  </span>
                </div>
                <span className="text-sm text-fg-muted">{c.desc}</span>
              </Card>
            </button>
          )
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={addedSources.length === 0}>
          Start ingestion <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function Step3({ progress, ingestDone, onNext }: { progress: number; ingestDone: boolean; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <H2>Ingestion</H2>
        <p className="text-sm font-mono text-fg-subtle mt-1 mb-0">Nexus is indexing your knowledge sources</p>
      </div>
      <Card variant="surface" className="p-5">
        <IngestionProgress progress={Math.round(progress)} streaming={!ingestDone} />
      </Card>
      {ingestDone && (
        <div className="flex justify-end">
          <Button onClick={onNext}>Continue <ArrowRight className="h-3.5 w-3.5" /></Button>
        </div>
      )}
    </div>
  )
}

function Step4({ newProductId, onLater, onStart }: { newProductId: string; onLater: () => void; onStart: () => void }) {
  const roster = COUNCIL_ROSTERS['master']
  const cost = COUNCIL_COST_ESTIMATES['master']

  return (
    <div className="flex flex-col gap-6">
      <div>
        <H2>Council kickoff</H2>
        <p className="text-sm font-mono text-fg-subtle mt-1 mb-0">Run Council to draft your Master Skill for <span className="text-fg">{newProductId}</span></p>
      </div>

      <Card variant="stat" glowColor="rgba(124,140,255,0.14)" className="p-7">
        <div className="text-lg font-semibold text-fg mb-4">Run Council to draft your Master Skill</div>
        <div className="flex flex-col gap-2 mb-5">
          {roster.map(role => (
            <div key={role} className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: COUNCIL_AGENT_HUES[role] }} />
              <span className="text-sm text-fg-muted">{COUNCIL_AGENT_LABELS[role]}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 px-4 py-3 rounded-md bg-accent/10 border border-accent/20 text-sm font-mono mb-5">
          <span className="text-success">~${cost.usd.toFixed(3)}</span>
          <span className="text-fg-subtle">·</span>
          <span className="text-fg-muted">~{cost.tokens.toLocaleString()} tokens</span>
          <span className="text-fg-subtle">·</span>
          <span className="text-fg-muted">~{Math.round(cost.seconds / 60)} min</span>
        </div>
        <Button onClick={onStart}>Run Council <ArrowRight className="h-4 w-4" /></Button>
      </Card>

      <button
        onClick={onLater}
        className="self-start text-sm text-fg-subtle hover:text-fg-muted underline underline-offset-4"
      >
        I&apos;ll do this later — go to dashboard
      </button>
    </div>
  )
}

function RailExplainer1() {
  return (
    <Card variant="surface" className="p-5">
      <div className="text-sm font-semibold text-fg mb-3">What&apos;s a product in Nexus?</div>
      <p className="text-sm text-fg-muted leading-relaxed m-0">
        A product is the root entity in Nexus. It owns its own sources, council sessions, and skill hierarchy — fully isolated from other products in your org.
      </p>
      <p className="text-sm text-fg-muted leading-relaxed mt-3 mb-0">
        The Master Skill represents the entire product: its architecture, domain vocabulary, key entities, and team conventions.
      </p>
    </Card>
  )
}

function RailExplainer2() {
  return (
    <Card variant="surface" className="p-5">
      <div className="text-sm font-semibold text-fg mb-3">Best practice</div>
      <p className="text-sm text-fg-muted leading-relaxed m-0">
        Most teams start with their primary GitHub repo plus their ADR space (Confluence).
      </p>
      <p className="text-sm text-fg-muted leading-relaxed mt-3 mb-0">
        Add Jira for tickets that capture decisions and acceptance criteria. You can always add more sources later.
      </p>
    </Card>
  )
}

function RailExplainer3({ sources }: { sources: string[] }) {
  const SAMPLE_ENTITIES = ['Runner trait', 'tokio::spawn', 'SkillFile struct', 'CouncilSession', 'IndexChunk']
  return (
    <Card variant="surface" className="p-5">
      <div className="text-sm font-semibold text-fg mb-3">What we&apos;ve indexed so far</div>
      <div className="flex flex-col gap-2 mb-3">
        {sources.map(src => (
          <div key={src} className="flex items-center gap-2 text-xs font-mono">
            <BrandIcon id={src} size={14} />
            <span className="text-fg">{src}</span>
            <div className="flex-1" />
            <span className="text-success">indexing</span>
          </div>
        ))}
      </div>
      {sources.length > 0 && (
        <>
          <div className="h-px bg-border my-3" />
          <div className="text-xs text-fg-muted mb-2">Top entities seen:</div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_ENTITIES.map(e => (
              <Badge key={e} variant="outline" className="font-mono">{e}</Badge>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

function RailExplainer4() {
  return (
    <Card variant="surface" className="p-5">
      <div className="text-sm font-semibold text-fg mb-3">Why run Council now?</div>
      <p className="text-sm text-fg-muted leading-relaxed m-0">
        The Master Skill anchors every downstream skill. Drafting it during onboarding gives every other skill the product context it needs to compose correctly.
      </p>
    </Card>
  )
}

function FormField({ label, placeholder, value, onChange, mono = false }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-fg-muted tracking-wide">{label}</label>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(mono && 'font-mono')}
      />
    </div>
  )
}
