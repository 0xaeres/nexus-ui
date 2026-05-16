'use client'
import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H2, H3, Muted, Subtle, Code } from '@/components/ui/typography'
import {
  NEXUS_DEFAULT_MODEL_ASSIGNMENTS,
  NEXUS_LOCAL_MODELS,
  NEXUS_USERS,
  COUNCIL_ROSTERS,
  COUNCIL_AGENT_LABELS,
  COUNCIL_AGENT_HUES,
  COUNCIL_COST_ESTIMATES,
  type SkillKind,
} from '@/lib/data'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

const TABS = ['general', 'members', 'models', 'roster'] as const
type Tab = typeof TABS[number]

const TAB_LABEL: Record<Tab, string> = {
  general: 'General',
  members: 'Members',
  models:  'Model assignments',
  roster:  'Council roster',
}

const ROLE_VARIANT: Record<string, 'accent' | 'success' | 'warning'> = {
  org_admin:     'accent',
  product_admin: 'success',
  sme:           'warning',
}

const ROLE_LABEL: Record<string, string> = {
  org_admin:     'Org admin',
  product_admin: 'Product admin',
  sme:           'SME',
}

export function Settings() {
  const { currentProductId, currentProduct, perms } = useProduct()
  const [tab, setTab] = useState<Tab>('general')

  const readOnly = perms.settingsReadOnly

  return (
    <>
      <PageHeader>
        <H1>Settings</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
        {readOnly && <Badge variant="warning">Read only</Badge>}
      </PageHeader>

      <div className="border-b border-border bg-bg">
        <div className="mx-auto max-w-[1280px] px-8 py-3 flex items-center gap-1.5">
          {TABS.map(t => {
            const active = tab === t
            return (
              <Button
                key={t}
                variant={active ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTab(t)}
                className={cn('h-8 px-3 text-sm', active && 'border-border-strong text-fg')}
              >
                {TAB_LABEL[t]}
              </Button>
            )
          })}
        </div>
      </div>

      <PageBody>
        {tab === 'general' && <GeneralPanel readOnly={readOnly} product={currentProduct} />}
        {tab === 'members' && <MembersPanel productId={currentProductId} />}
        {tab === 'models' && <ModelsPanel readOnly={readOnly} />}
        {tab === 'roster' && <RosterPanel readOnly={readOnly} />}
      </PageBody>
    </>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <H2>{title}</H2>
      {sub && <p className="text-sm font-mono text-fg-subtle m-0 mt-1">{sub}</p>}
    </div>
  )
}

/* ─── General ──────────────────────────────────────────────────────────── */

function GeneralPanel({ readOnly, product }: {
  readOnly: boolean
  product: ReturnType<typeof useProduct>['currentProduct']
}) {
  return (
    <div className="max-w-3xl flex flex-col gap-8">
      <section>
        <SectionHeader title="Product" sub="Identity used across Nexus" />
        <Card variant="surface" className="p-6 flex flex-col gap-4">
          <Field label="Product name" defaultValue={product?.name ?? ''} disabled={readOnly} />
          <Separator />
          <Field label="Tagline" defaultValue={product?.tagline ?? ''} disabled={readOnly} />
          <Separator />
          <Field label="Owning team" defaultValue={product?.owner.team ?? ''} disabled={readOnly} mono />
          <Separator />
          <Field label="Lead" defaultValue={product?.owner.lead ?? ''} disabled={readOnly} mono />
        </Card>
      </section>

      <section>
        <SectionHeader title="Daemon" sub="Local Nexus process configuration" />
        <Card variant="surface" className="p-6 flex flex-col gap-4">
          <Field label="Index path" defaultValue="~/.nexus/index" disabled={readOnly} mono />
          <Separator />
          <Field label="Max chunk size" defaultValue="512 tokens" disabled={readOnly} mono />
          <Separator />
          <Field label="Reranker top-k" defaultValue="20" disabled={readOnly} mono />
          <Separator />
          <Field label="MCP port" defaultValue="7477" disabled={readOnly} mono />
        </Card>
      </section>

      <section>
        <SectionHeader title="About" />
        <Card variant="surface" className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <KV label="Version" value="v0.5.2" />
            <KV label="Build"   value="2024-11-18" />
            <KV label="License" value="BSL 1.1" />
          </div>
        </Card>
      </section>
    </div>
  )
}

/* ─── Members ──────────────────────────────────────────────────────────── */

function MembersPanel({ productId }: { productId: string }) {
  const members = NEXUS_USERS.filter(u => u.products.includes(productId))
  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <SectionHeader title="Members" sub={`${members.length} ${members.length === 1 ? 'person has' : 'people have'} access to ${productId}`} />
      <Card variant="surface" className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead className="w-[140px]">Role</TableHead>
              <TableHead className="w-[140px]">Products</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-sm text-fg">{u.name}</TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANT[u.role] ?? 'secondary'}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    {u.products.map(p => (
                      <span
                        key={p}
                        title={p}
                        className={cn('h-1.5 w-1.5 rounded-full', p === productId ? 'bg-accent' : 'bg-fg-subtle')}
                      />
                    ))}
                    <span className="ml-1 text-sm font-mono text-fg-subtle">{u.products.length}</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

/* ─── Models ───────────────────────────────────────────────────────────── */

function ModelsPanel({ readOnly }: { readOnly: boolean }) {
  return (
    <div className="max-w-3xl flex flex-col gap-7">
      <section>
        <SectionHeader title="Model assignments" sub="Which models power each Nexus role" />
        <Card variant="surface" className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="w-[80px]">Billed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {NEXUS_DEFAULT_MODEL_ASSIGNMENTS.map(a => (
                <TableRow key={a.role}>
                  <TableCell className="text-sm font-medium text-fg">{a.role}</TableCell>
                  <TableCell className="text-sm text-fg-muted">{a.desc}</TableCell>
                  <TableCell className="text-sm font-mono text-fg-subtle">{a.provider}</TableCell>
                  <TableCell>
                    <Badge variant="accent" className="font-mono">{a.model.split('/').slice(-1)[0]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-fg-subtle">{a.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section>
        <SectionHeader title="Local models" sub="Always-on, always local — no API calls" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NEXUS_LOCAL_MODELS.map(m => (
            <Card key={m.id} variant="stat" glowColor="rgba(77,212,172,0.10)" className="p-5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-md bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-success" />
                </div>
                <span className="text-base font-medium text-fg">{m.label}</span>
                <div className="flex-1" />
                <Badge variant="success">local</Badge>
              </div>
              <span className="text-sm font-mono text-fg mt-1">{m.model}</span>
              <span className="text-xs font-mono text-fg-subtle">{m.note}</span>
            </Card>
          ))}
        </div>
      </section>

      {!readOnly && (
        <div className="flex items-center gap-2">
          <Button variant="default" size="md">Save changes</Button>
          <Button variant="ghost" size="md">Reset to defaults</Button>
        </div>
      )}
    </div>
  )
}

/* ─── Council roster ───────────────────────────────────────────────────── */

function RosterPanel({ readOnly }: { readOnly: boolean }) {
  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <SectionHeader
        title="Council roster"
        sub="Agents that run when drafting a skill. Roster depends on the skill kind."
      />
      <div className="flex flex-col gap-3">
        {(['master', 'tech_stack', 'language', 'security'] as SkillKind[]).map(kind => {
          const roles = COUNCIL_ROSTERS[kind]
          const cost = COUNCIL_COST_ESTIMATES[kind]
          return (
            <Card key={kind} variant="surface" className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-base font-medium text-fg">{kind.replace('_', ' ')}</span>
                <Badge variant="outline" className="font-mono">{roles.length} agents</Badge>
                <div className="flex-1" />
                <span className="text-xs font-mono text-fg-subtle">
                  ~{cost.tokens.toLocaleString()} tok · ${cost.usd.toFixed(4)} · {cost.seconds}s
                </span>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <span key={r} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-raised border border-border">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: COUNCIL_AGENT_HUES[r] }} />
                    <span className="text-sm text-fg">{COUNCIL_AGENT_LABELS[r]}</span>
                  </span>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
      {!readOnly && (
        <p className="text-xs font-mono text-fg-subtle">
          Roster overrides are scoped to this product. Defaults follow org policy.
        </p>
      )}
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function Field({ label, defaultValue, disabled, mono = false }: {
  label: string
  defaultValue: string
  disabled?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-fg-muted w-48 shrink-0">{label}</label>
      <Input
        defaultValue={defaultValue}
        disabled={disabled}
        className={cn('h-10 text-base', mono && 'font-mono')}
      />
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider font-medium text-fg-subtle">{label}</span>
      <span className="text-sm font-mono text-fg">{value}</span>
    </div>
  )
}
