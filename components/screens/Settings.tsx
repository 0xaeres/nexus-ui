'use client'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Subtle, Code } from '@/components/ui/typography'
import { ApiError, type ProductSettings, getProductSettings } from '@/lib/api'
import { COUNCIL_AGENT_HUES, COUNCIL_AGENT_LABELS, COUNCIL_ROSTERS } from '@/lib/types'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

const TABS = ['general', 'members', 'models', 'roster'] as const
type Tab = typeof TABS[number]

const TAB_LABEL: Record<Tab, string> = {
  general: 'General',
  members: 'Members',
  models:  'Models',
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
  const { currentProductId } = useProduct()
  const [tab, setTab] = useState<Tab>('general')
  const [data, setData] = useState<ProductSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const d = await getProductSettings(currentProductId)
      setData(d)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [currentProductId])

  useEffect(() => { void refresh() }, [refresh])

  return (
    <>
      <PageHeader>
        <H1>Settings</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
      </PageHeader>

      <div className="border-b border-border bg-bg">
        <div className="mx-auto max-w-[1280px] px-8 py-3 flex items-center gap-1.5">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'h-8 px-3 rounded-md font-mono text-sm transition-colors',
                tab === t
                  ? 'bg-bg-active border border-border-strong text-fg'
                  : 'text-fg-muted hover:bg-bg-active',
              )}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <PageBody>
        {error && (
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        )}

        {!data && !error ? (
          <Card variant="surface" className="px-5 py-6"><Muted>Loading…</Muted></Card>
        ) : data ? (
          <>
            {tab === 'general' && <GeneralTab data={data} />}
            {tab === 'members' && <MembersTab data={data} />}
            {tab === 'models' && <ModelsTab data={data} />}
            {tab === 'roster' && <RosterTab />}
          </>
        ) : null}
      </PageBody>
    </>
  )
}


function GeneralTab({ data }: { data: ProductSettings }) {
  const p = data.product
  return (
    <Card variant="surface" className="p-5 flex flex-col gap-3 max-w-2xl">
      <H3>Product</H3>
      <KV k="id" v={p.id} />
      <KV k="name" v={p.name} />
      <KV k="tagline" v={p.tagline} />
      <KV k="onboarded" v={p.onboardedAt} />
      <KV k="owner" v={`${p.owner.team} · ${p.owner.lead}`} />
      <KV k="master skill" v={p.masterSkillId} />
      <KV k="sources" v={String(p.sources)} />
      <KV k="skills" v={String(p.skills)} />
    </Card>
  )
}


function MembersTab({ data }: { data: ProductSettings }) {
  if (!data.members.length) {
    return (
      <Card variant="surface" className="p-5">
        <Muted>No members assigned to this product yet.</Muted>
      </Card>
    )
  }
  return (
    <Card variant="surface" className="overflow-hidden p-0 max-w-2xl">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Products</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.members.map(m => (
            <TableRow key={m.id}>
              <TableCell className="font-mono">{m.name}</TableCell>
              <TableCell>
                <Badge variant={ROLE_VARIANT[m.role] ?? 'accent'} className="font-mono">
                  {ROLE_LABEL[m.role] ?? m.role}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm text-fg-subtle">
                {m.products.join(', ')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}


function ModelsTab({ data }: { data: ProductSettings }) {
  const roles = Object.keys(data.models)
  return (
    <Card variant="surface" className="overflow-hidden p-0 max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Role</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Model</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map(role => {
            const m = data.models[role]
            return (
              <TableRow key={role}>
                <TableCell className="font-mono">{role}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">{m.provider}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{m.model}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}


function RosterTab() {
  const kinds: Array<keyof typeof COUNCIL_ROSTERS> = ['master', 'product_domain']
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
      {kinds.map(kind => (
        <Card key={kind} variant="surface" className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <H3>{kind === 'master' ? 'Master skill council' : 'Product domain council'}</H3>
            <Badge variant="outline" className="font-mono">
              {COUNCIL_ROSTERS[kind].length} agents
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            {COUNCIL_ROSTERS[kind].map(role => (
              <div key={role} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: COUNCIL_AGENT_HUES[role] }} />
                <span className="text-sm font-medium text-fg">{COUNCIL_AGENT_LABELS[role]}</span>
                <div className="flex-1" />
                <Code className="text-xs text-fg-subtle">{role}</Code>
              </div>
            ))}
          </div>
          <Subtle className="font-mono text-xs">
            max-1 redraft cycle · adversary always runs
          </Subtle>
        </Card>
      ))}
    </div>
  )
}


function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <Subtle className="font-mono uppercase tracking-wider text-xs w-32 shrink-0">{k}</Subtle>
      <Code className="text-sm">{v || '—'}</Code>
    </div>
  )
}
