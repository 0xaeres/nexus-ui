'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Hexagon, GitBranch, RefreshCw, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  H1, H3, Body, Muted, SectionLabel, Code, Small, Subtle,
} from '@/components/ui/typography'
import {
  ApiError,
  createSession,
  getSkill,
  listSkillCorrections,
  listSkillCouncilHistory,
  listSkillRejections,
} from '@/lib/api'
import { useProduct } from '@/lib/product-context'
import {
  COUNCIL_ROSTER,
  EVIDENCE_CHUNKS_PER_SESSION_CAP,
  type CorrectionsResponse,
  type CouncilSessionSummary,
  type Skill,
  type SkillProposal,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const SKILL_COLOR = '#7C8CFF'

function confColor(c: number) {
  if (c < 0.5) return 'text-danger'
  if (c < 0.8) return 'text-warning'
  return 'text-success'
}

export function SkillDetailPage({ skillId }: { skillId: string }) {
  const { currentProductId, perms } = useProduct()
  const router = useRouter()
  const base = `/p/${currentProductId}`
  const [skill, setSkill] = useState<Skill | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<CouncilSessionSummary[]>([])
  const [corrections, setCorrections] = useState<CorrectionsResponse | null>(null)
  const [rejections, setRejections] = useState<SkillProposal[]>([])
  const [confirmRerun, setConfirmRerun] = useState(false)
  const [rerunBusy, setRerunBusy] = useState(false)
  const [rerunError, setRerunError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const s = await getSkill(skillId)
      setSkill(s)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [skillId])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    let cancelled = false
    const safe = <T,>(p: Promise<T>) => p.catch(() => null as unknown as T | null)
    Promise.all([
      safe(listSkillCouncilHistory(skillId)),
      safe(listSkillCorrections(skillId)),
      safe(listSkillRejections(skillId)),
    ]).then(([h, c, r]) => {
      if (cancelled) return
      if (h) setHistory(h)
      if (c) setCorrections(c)
      if (r) setRejections(r)
    })
    return () => { cancelled = true }
  }, [skillId])

  const rerunCouncil = async () => {
    if (!skill) return
    setRerunBusy(true); setRerunError(null)
    try {
      const { session_id } = await createSession(currentProductId, {
        topic: `${skill.name} — manual re-run`,
        skill_id: skill.id,
      })
      router.push(`${base}/council/${session_id}`)
    } catch (e: unknown) {
      setRerunError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
      setRerunBusy(false)
    }
  }

  if (error) {
    return (
      <>
        <PageHeader>
          <Button asChild variant="ghost" size="sm">
            <Link href={`${base}/skills`}><ChevronLeft className="h-4 w-4" />Skills</Link>
          </Button>
          <H1>Skill</H1>
        </PageHeader>
        <PageBody>
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Not found</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        </PageBody>
      </>
    )
  }

  if (!skill) {
    return (
      <>
        <PageHeader>
          <Button asChild variant="ghost" size="sm">
            <Link href={`${base}/skills`}><ChevronLeft className="h-4 w-4" />Skills</Link>
          </Button>
          <H1>Loading…</H1>
        </PageHeader>
        <PageBody>
          <Card variant="surface" className="px-5 py-6"><Muted>Loading skill…</Muted></Card>
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <Button asChild variant="ghost" size="sm">
          <Link href={`${base}/skills`}><ChevronLeft className="h-4 w-4" />Skills</Link>
        </Button>
        <Hexagon className="h-5 w-5 shrink-0" style={{ color: SKILL_COLOR }} fill={SKILL_COLOR} />
        <H1>{skill.name}</H1>
        <Subtle className="font-mono ml-1">v{skill.version}</Subtle>
        <div className="flex-1" />
        {perms.canRunCouncil && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmRerun(true)}
            disabled={rerunBusy}
          >
            <RefreshCw className="h-4 w-4" />
            Re-run council
          </Button>
        )}
      </PageHeader>

      <PageBody>
        <PageGrid>
          {/* Confidence */}
          <div className="col-span-12">
            <Card variant="glass" className="p-4 flex items-center gap-3">
              <SectionLabel className="shrink-0 w-32">Confidence</SectionLabel>
              <Progress
                value={Math.round(skill.confidence * 100)}
                className="flex-1"
                indicatorClassName={
                  skill.confidence >= 0.8 ? 'bg-success' :
                  skill.confidence >= 0.5 ? 'bg-warning' : 'bg-danger'
                }
              />
              <Code className={cn('shrink-0 font-mono', confColor(skill.confidence))}>
                {Math.round(skill.confidence * 100)}%
              </Code>
            </Card>
          </div>

          {/* Applies to */}
          {(skill.applies_to.files.length > 0 || skill.applies_to.contexts.length > 0) && (
            <div className="col-span-12 md:col-span-6">
              <Card variant="surface">
                <CardHeader>
                  <SectionLabel>Applies to</SectionLabel>
                </CardHeader>
                <CardContent>
                  {skill.applies_to.files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skill.applies_to.files.map(f => (
                        <Badge key={f} variant="outline" className="font-mono text-xs">{f}</Badge>
                      ))}
                    </div>
                  )}
                  {skill.applies_to.contexts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skill.applies_to.contexts.map(c => (
                        <Badge key={c} variant="accent" className="font-mono text-xs">{c}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Provenance */}
          {skill.provenance && (
            <div className="col-span-12 md:col-span-6">
              <Card variant="surface">
                <CardHeader>
                  <SectionLabel>Provenance</SectionLabel>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ProvenanceRow label="Validated by" value={skill.provenance.validated_by} />
                    <ProvenanceRow label="Validated at" value={skill.provenance.validated_at?.slice(0, 19)} />
                    {skill.provenance.council_session && (
                      <ProvenanceRow label="Council session" value={skill.provenance.council_session ?? ''} mono />
                    )}
                    <ProvenanceRow
                      label="Revision"
                      value={String(skill.provenance.revision_count)}
                    />
                    <ProvenanceRow
                      label="Evidence chunks"
                      value={`${skill.provenance.evidence_chunks?.length ?? 0} / ${EVIDENCE_CHUNKS_PER_SESSION_CAP} cap`}
                    />
                  </div>
                  {skill.provenance.adversary_critique && (
                    <div className="mt-3 rounded-md bg-warning/10 border border-warning/30 px-3 py-2">
                      <Small className="text-warning font-mono">Critic note</Small>
                      <Body className="text-sm mt-1">{skill.provenance.adversary_critique}</Body>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="col-span-12">
            <Separator />
          </div>

          {/* Body */}
          <div className="col-span-12">
            <Card variant="surface">
              <CardHeader>
                <SectionLabel>Body</SectionLabel>
              </CardHeader>
              <CardContent>
                <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed text-fg-muted overflow-x-auto">
                  {skill.body}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Council history */}
          {history.length > 0 && (
            <div className="col-span-12">
              <Card variant="surface">
                <CardHeader>
                  <SectionLabel>Council history</SectionLabel>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1.5">
                    {history.map(s => (
                      <Link
                        key={s.id}
                        href={`${base}/council/${s.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-active transition-colors"
                      >
                        <Code className="text-xs shrink-0 w-44 truncate">{s.id}</Code>
                        <Subtle className="font-mono text-xs">{s.started_at?.slice(0, 19)}</Subtle>
                        <div className="flex-1" />
                        <Badge variant="outline" className="font-mono text-xs">{s.status}</Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Critic notes */}
          {corrections && (corrections.corrections.length > 0 || corrections.adversary_critique) && (
            <div className="col-span-12">
              <Card variant="surface">
                <CardHeader>
                  <SectionLabel>Critic notes ({corrections.corrections.length})</SectionLabel>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Muted className="text-xs">
                    Critiques captured from approved proposals and stored in skill provenance.
                  </Muted>

                  {corrections.adversary_critique && (
                    <div className="rounded-md border border-accent/30 bg-accent/[0.06] px-3 py-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <SectionLabel className="text-accent">Approved provenance</SectionLabel>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap text-fg-muted leading-relaxed">
                        {corrections.adversary_critique}
                      </pre>
                    </div>
                  )}

                  {corrections.corrections.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <SectionLabel>Approved proposal critiques</SectionLabel>
                      </div>
                      {corrections.corrections.map(c => (
                        <div key={c.proposal_id} className="rounded-md bg-bg-active px-3 py-2 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Code>{c.proposal_id}</Code>
                            <Badge variant="outline" className="font-mono text-xs py-0">
                              {c.adversary_critique.severity}
                            </Badge>
                            <div className="flex-1" />
                            <Subtle className="font-mono">{c.created_at?.slice(0, 19)}</Subtle>
                          </div>
                          <pre className="text-xs font-mono whitespace-pre-wrap text-fg-muted">
                            {c.adversary_critique.recommendation}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rejection log */}
          {rejections.length > 0 && (
            <div className="col-span-12">
              <Card variant="surface">
                <CardHeader>
                  <SectionLabel>Rejected proposals ({rejections.length})</SectionLabel>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Muted className="text-xs">
                    Past council drafts SMEs rejected. Future runs use these as anti-priors.
                  </Muted>
                  <div className="flex flex-col gap-2">
                    {rejections.map(r => (
                      <div key={r.id} className="rounded-md bg-bg-active px-3 py-2 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs">
                          <Code className="truncate max-w-[200px]">{r.id}</Code>
                          {r.reject_reason?.category && (
                            <Badge variant="outline" className="font-mono text-xs py-0">
                              {r.reject_reason.category}
                            </Badge>
                          )}
                          <div className="flex-1" />
                          <Subtle className="font-mono">{r.created_at?.slice(0, 19)}</Subtle>
                        </div>
                        {r.reject_reason?.reason && (
                          <Body className="text-sm">{r.reject_reason.reason}</Body>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </PageGrid>
      </PageBody>

      <Dialog open={confirmRerun} onOpenChange={open => { if (!rerunBusy) setConfirmRerun(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-run council for {skill.name}?</DialogTitle>
            <DialogDescription>
              Manually triggers a new council session for this skill.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Subtle className="font-mono uppercase tracking-wider text-xs w-32">Nodes</Subtle>
              <Code className="text-xs">{COUNCIL_ROSTER.join(' → ')}</Code>
            </div>
            {rerunError && <Small className="text-danger font-mono">{rerunError}</Small>}
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setConfirmRerun(false)} disabled={rerunBusy}>
              Cancel
            </Button>
            <Button size="sm" onClick={rerunCouncil} disabled={rerunBusy}>
              {rerunBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              {rerunBusy ? 'Starting…' : 'Start council'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProvenanceRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <Subtle>{label}</Subtle>
      <span className={cn('text-fg', mono ? 'font-mono text-xs' : '')}>{value}</span>
    </>
  )
}
