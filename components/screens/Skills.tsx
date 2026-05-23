'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowUpRight, ChevronDown, ChevronRight, Hexagon, Search, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SkillsSkeleton } from '@/components/skeletons/SkillsSkeleton'
import { PageHeader } from '@/components/ui/page'
import { H1, SectionLabel, Body, Subtle, Code, Small, Muted } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import { ApiError, listProductSkills } from '@/lib/api'
import type { OrgSkill, ProductSkillsResponse, Skill } from '@/lib/types'
import { cn } from '@/lib/utils'

type AnySkill = Skill | OrgSkill

const KIND_COLOR: Record<string, string> = {
  master: '#7C8CFF',
  product_domain: '#E8B86B',
  tech_stack: '#4DD4AC',
  language: '#C58BFF',
  security: '#F26D6D',
}

function confColor(c: number) {
  if (c < 0.5) return 'text-danger'
  if (c < 0.8) return 'text-warning'
  return 'text-success'
}

export function Skills() {
  const { currentProductId } = useProduct()
  const sp = useSearchParams()
  const forceLoading = sp?.get('loading') === '1'

  const [data, setData] = useState<ProductSkillsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AnySkill | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const refresh = useCallback(async () => {
    try {
      const d = await listProductSkills(currentProductId)
      setData(d)
      setError(null)
      // Default selection: master, else first domain, else first adopted
      setSelected(d.master ?? d.domain[0] ?? d.adopted[0] ?? null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [currentProductId])

  useEffect(() => { void refresh() }, [refresh])

  const filter = useCallback(
    (s: AnySkill) => !query || s.name.toLowerCase().includes(query.toLowerCase()),
    [query],
  )

  const sections = useMemo(() => {
    if (!data) return []
    return [
      { id: 'master', label: 'Master', items: data.master ? [data.master] : [] },
      { id: 'domain', label: 'Product domain', items: data.domain },
      { id: 'adopted', label: 'Adopted standards (Org Library)', items: data.adopted },
    ]
  }, [data])

  const totalCount = (data?.master ? 1 : 0) + (data?.domain.length ?? 0) + (data?.adopted.length ?? 0)

  if (forceLoading || (!data && !error)) return <SkillsSkeleton />

  if (error) {
    return (
      <>
        <PageHeader>
          <H1>Skills</H1>
        </PageHeader>
        <div className="p-5">
          <Card variant="surface" className="px-5 py-4 border border-danger/30 bg-danger/10">
            <SectionLabel className="text-danger">Backend unreachable</SectionLabel>
            <Muted className="font-mono">{error}</Muted>
          </Card>
        </div>
      </>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader>
        <H1>Skills</H1>
        <Badge variant="outline" className="font-mono">{totalCount} skills</Badge>
      </PageHeader>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left tree pane */}
        <aside className="w-[340px] shrink-0 border-r border-border flex flex-col bg-bg">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle pointer-events-none" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Filter skills…"
                className="pl-9 h-9 font-mono"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 flex flex-col gap-3">
              {sections.map(section => {
                const items = section.items.filter(filter)
                if (!items.length) return null
                const isCollapsed = collapsed[section.id]
                return (
                  <div key={section.id} className="flex flex-col">
                    <button
                      onClick={() => setCollapsed(p => ({ ...p, [section.id]: !p[section.id] }))}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs uppercase tracking-wider font-mono text-fg-subtle hover:text-fg-muted transition-colors"
                    >
                      {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      <span>{section.label}</span>
                      <span className="ml-auto">{items.length}</span>
                    </button>
                    {!isCollapsed && (
                      <div className="flex flex-col gap-px">
                        {items.map(s => {
                          const active = selected && (selected as AnySkill).id === s.id
                          const color = KIND_COLOR[String(s.kind)] ?? '#7C8CFF'
                          return (
                            <button
                              key={s.id}
                              onClick={() => setSelected(s)}
                              className={cn(
                                'flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors',
                                active ? 'bg-bg-active' : 'hover:bg-surface',
                              )}
                            >
                              <Hexagon
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color }}
                                fill={active ? color : 'transparent'}
                              />
                              <div className="flex-1 min-w-0">
                                <Code className="block truncate">{s.name}</Code>
                                <Small className="block text-fg-subtle truncate">
                                  {String(s.kind)}
                                </Small>
                              </div>
                              <span className={cn('font-mono text-xs', confColor(s.confidence))}>
                                {Math.round(s.confidence * 100)}%
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Right detail pane */}
        <section className="flex-1 min-w-0 overflow-auto">
          {selected ? <SkillDetail skill={selected} productId={currentProductId} /> : (
            <div className="p-8">
              <Muted>Select a skill to view details.</Muted>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}


function SkillDetail({ skill, productId }: { skill: AnySkill; productId: string }) {
  const color = KIND_COLOR[String(skill.kind)] ?? '#7C8CFF'
  const isOrg = (skill as OrgSkill).scope === 'org'
  const externalSources = isOrg ? (skill as OrgSkill).external_sources : []

  return (
    <div className="p-6 flex flex-col gap-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Hexagon className="h-6 w-6 shrink-0 mt-1" style={{ color }} fill={color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Code className="text-xl">{skill.name}</Code>
            <Badge variant="outline" className="font-mono">{String(skill.kind)}</Badge>
            <Badge variant="outline" className="font-mono">{skill.scope}</Badge>
          </div>
          <Subtle className="font-mono">v{skill.version}</Subtle>
        </div>
        <Link
          href={`/p/${productId}/skills/${encodeURIComponent(skill.id)}`}
          className="flex items-center gap-1 text-xs text-accent hover:underline shrink-0"
        >
          Full detail
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Confidence */}
      <Card variant="stat" className="p-4 flex items-center gap-3">
        <SectionLabel className="shrink-0 w-32">Confidence</SectionLabel>
        <Progress
          value={Math.round(skill.confidence * 100)}
          className="flex-1"
          indicatorClassName={skill.confidence >= 0.8 ? 'bg-success' : skill.confidence >= 0.5 ? 'bg-warning' : 'bg-danger'}
        />
        <Code className={cn('shrink-0 font-mono', confColor(skill.confidence))}>
          {Math.round(skill.confidence * 100)}%
        </Code>
      </Card>

      {/* Applies to */}
      {(skill.applies_to.files.length > 0 || skill.applies_to.contexts.length > 0) && (
        <Card variant="surface" className="p-4 flex flex-col gap-2">
          <SectionLabel>Applies to</SectionLabel>
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
        </Card>
      )}

      {/* External sources (Org only) */}
      {externalSources.length > 0 && (
        <Card variant="surface" className="p-4 flex flex-col gap-2">
          <SectionLabel>External sources</SectionLabel>
          <div className="flex flex-col gap-1">
            {externalSources.map(url => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-accent hover:underline truncate"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Body */}
      <Card variant="surface" className="p-5 flex flex-col gap-2">
        <SectionLabel>Body</SectionLabel>
        <Body className="font-mono whitespace-pre-wrap text-sm leading-relaxed">
          {skill.body}
        </Body>
      </Card>
    </div>
  )
}
