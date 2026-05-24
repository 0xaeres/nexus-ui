'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowUpRight, Hexagon, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SkillsSkeleton } from '@/components/skeletons/SkillsSkeleton'
import { PageHeader } from '@/components/ui/page'
import { H1, SectionLabel, Body, Subtle, Code, Small, Muted } from '@/components/ui/typography'
import { useProduct } from '@/lib/product-context'
import { ApiError, listProductSkills } from '@/lib/api'
import type { ProductSkillsResponse, Skill } from '@/lib/types'
import { cn } from '@/lib/utils'

const SKILL_COLOR = '#7C8CFF'

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
  const [selected, setSelected] = useState<Skill | null>(null)

  const refresh = useCallback(async () => {
    try {
      const d = await listProductSkills(currentProductId)
      setData(d)
      setError(null)
      setSelected(d.skills[0] ?? null)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [currentProductId])

  useEffect(() => { void refresh() }, [refresh])

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.toLowerCase()
    return q ? data.skills.filter(s => s.name.toLowerCase().includes(q)) : data.skills
  }, [data, query])

  const totalCount = data?.skills.length ?? 0

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
            <div className="p-2 flex flex-col gap-px">
              {filtered.map(s => {
                const active = selected && selected.id === s.id
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
                      style={{ color: SKILL_COLOR }}
                      fill={active ? SKILL_COLOR : 'transparent'}
                    />
                    <div className="flex-1 min-w-0">
                      <Code className="block truncate">{s.name}</Code>
                      <Small className="block text-fg-subtle truncate">v{s.version}</Small>
                    </div>
                    <span className={cn('font-mono text-xs', confColor(s.confidence))}>
                      {Math.round(s.confidence * 100)}%
                    </span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </aside>

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

function SkillDetail({ skill, productId }: { skill: Skill; productId: string }) {
  return (
    <div className="p-6 flex flex-col gap-5 max-w-4xl">
      <div className="flex items-start gap-3">
        <Hexagon className="h-6 w-6 shrink-0 mt-1" style={{ color: SKILL_COLOR }} fill={SKILL_COLOR} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Code className="text-xl">{skill.name}</Code>
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

      <Card variant="glass" className="p-4 flex items-center gap-3">
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

      {(skill.applies_to.files.length > 0 || skill.applies_to.contexts.length > 0) && (
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
      )}

      <Card variant="surface">
        <CardHeader>
          <SectionLabel>Body</SectionLabel>
        </CardHeader>
        <CardContent>
          <Body className="font-mono whitespace-pre-wrap text-sm leading-relaxed">
            {skill.body}
          </Body>
        </CardContent>
      </Card>
    </div>
  )
}
