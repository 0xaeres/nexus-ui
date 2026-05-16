'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H3, SectionLabel, Subtle } from '@/components/ui/typography'
import {
  COUNCIL_ROSTERS,
  COUNCIL_COST_ESTIMATES,
  COUNCIL_AGENT_LABELS,
  COUNCIL_AGENT_HUES,
  type SkillKind,
} from '@/lib/data'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

const RECENT_SESSIONS = [
  { id: 'cs-001', skill: 'forge/tech_stack/rust/tokio-spawn-patterns', kind: 'tech_stack' as SkillKind, status: 'approved' as const, conf: 0.91, started: '2h ago' },
  { id: 'cs-002', skill: 'forge/security/secrets/no-hardcoded',        kind: 'security'   as SkillKind, status: 'approved' as const, conf: 0.97, started: '6h ago' },
  { id: 'cs-003', skill: 'forge/master',                                kind: 'master'     as SkillKind, status: 'awaiting' as const, conf: 0.88, started: '14m ago' },
  { id: 'cs-004', skill: 'forge/tech_stack/typescript/route-handlers',  kind: 'tech_stack' as SkillKind, status: 'drafting' as const, conf: 0.72, started: '3d ago' },
  { id: 'cs-005', skill: 'forge/security/auth/session-handling',        kind: 'security'   as SkillKind, status: 'rejected' as const, conf: 0.44, started: '1w ago' },
]

const STATUS_VARIANT: Record<string, 'accent' | 'warning' | 'success' | 'danger'> = {
  drafting: 'accent',
  awaiting: 'warning',
  approved: 'success',
  rejected: 'danger',
}

const KIND_LABELS: Record<SkillKind, string> = {
  master: 'Master', tech_stack: 'Tech Stack', language: 'Language', security: 'Security',
}

export function CouncilLanding() {
  const { currentProductId, perms } = useProduct()
  const base = `/p/${currentProductId}`
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <PageHeader>
        <H1>Council</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
        <div className="flex-1" />
        {perms.canRunCouncil && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Start council session
          </Button>
        )}
      </PageHeader>

      <PageBody>
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <SectionLabel>Recent sessions</SectionLabel>
            <Subtle className="font-mono">{RECENT_SESSIONS.length} sessions</Subtle>
          </div>
          <Card variant="surface" className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Session</TableHead>
                  <TableHead>Target skill</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT_SESSIONS.map(s => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`${base}/council/${s.id}`)}>
                    <TableCell className="font-mono text-sm text-fg-subtle">{s.id}</TableCell>
                    <TableCell className="font-mono text-sm truncate max-w-[320px]">{s.skill}</TableCell>
                    <TableCell><Badge variant="secondary">{KIND_LABELS[s.kind]}</Badge></TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge></TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <Progress
                          value={s.conf * 100}
                          className="w-16"
                          indicatorClassName={s.conf < 0.5 ? 'bg-danger' : s.conf < 0.8 ? 'bg-warning' : 'bg-success'}
                        />
                        <span className="font-mono text-sm">{Math.round(s.conf * 100)}%</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-fg-subtle">{s.started}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </PageBody>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-fg-muted" />
              Start council session
            </DialogTitle>
            <DialogDescription>What kind of skill are you drafting?</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {(['master', 'tech_stack', 'language', 'security'] as SkillKind[]).map(kind => {
              const roster = COUNCIL_ROSTERS[kind]
              const cost = COUNCIL_COST_ESTIMATES[kind]
              return (
                <button
                  key={kind}
                  onClick={() => { setOpen(false); router.push(`${base}/council/new-session-${kind}`) }}
                  className="text-left"
                >
                  <Card
                    variant="action"
                    className={cn(
                      'p-5 flex flex-col gap-3 cursor-pointer h-full',
                      kind === 'master' && 'border-accent/40 hover:border-accent/60',
                      kind === 'security' && 'border-danger/30 hover:border-danger/50',
                    )}
                  >
                    <H3>{KIND_LABELS[kind]}</H3>
                    <div className="flex flex-wrap gap-1.5">
                      {roster.map(role => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded border"
                          style={{
                            color: COUNCIL_AGENT_HUES[role],
                            background: `${COUNCIL_AGENT_HUES[role]}14`,
                            borderColor: `${COUNCIL_AGENT_HUES[role]}30`,
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: COUNCIL_AGENT_HUES[role] }} />
                          {COUNCIL_AGENT_LABELS[role]}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3 text-xs font-mono text-fg-subtle">
                      <span className="text-success">${cost.usd.toFixed(4)}</span>
                      <span>·</span>
                      <span>{cost.tokens.toLocaleString()} tok</span>
                      <span>·</span>
                      <span>{cost.seconds < 60 ? `${cost.seconds}s` : `${Math.round(cost.seconds / 60)}m`}</span>
                    </div>
                  </Card>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
