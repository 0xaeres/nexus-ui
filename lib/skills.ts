import type { EvalStatus, Skill, SkillCoverage, SkillTier } from './types'

export const SKILL_TIER_ORDER: SkillTier[] = [
  'product_master',
  'application',
  'domain',
  'interface',
  'tech_stack',
  'quality_security',
]

export const SKILL_TIER_LABELS: Record<SkillTier, string> = {
  product_master: 'Product master',
  application: 'Application',
  domain: 'Domain',
  interface: 'Interface',
  tech_stack: 'Tech stack',
  quality_security: 'Quality/Security',
}

export function tierLabel(tier?: SkillTier | null): string {
  return tier ? SKILL_TIER_LABELS[tier] ?? tier : 'Domain'
}

export function tierRank(tier?: SkillTier | null): number {
  const index = SKILL_TIER_ORDER.indexOf((tier ?? 'domain') as SkillTier)
  return index === -1 ? SKILL_TIER_ORDER.length : index
}

export function sortByTier<T extends { tier?: SkillTier | null; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || a.name.localeCompare(b.name))
}

export function groupByTier<T extends { tier?: SkillTier | null }>(items: T[]): Partial<Record<SkillTier, T[]>> {
  return items.reduce<Partial<Record<SkillTier, T[]>>>((acc, item) => {
    const tier = (item.tier ?? 'domain') as SkillTier
    acc[tier] = (acc[tier] ?? []).concat(item)
    return acc
  }, {})
}

export function coverageSummary(coverage?: Partial<SkillCoverage> | null): string {
  const repos = coverage?.repos?.length ?? 0
  const apps = coverage?.applications?.length ?? 0
  const topics = coverage?.topics?.length ?? 0
  if (!repos && !apps && !topics) return 'no scoped coverage'
  return `${repos} repos · ${apps} apps · ${topics} topics`
}

export function masterSkill(skills: Skill[]): Skill | null {
  return skills.find((skill) => skill.name === 'product-skill') ?? skills.find((skill) => skill.tier === 'product_master') ?? null
}

export function evalStatusLabel(status?: EvalStatus | null): string {
  if (!status || status === 'not_run') return 'eval not run'
  if (status === 'passed') return 'eval passed'
  if (status === 'repaired') return 'eval repaired'
  return 'eval failed'
}

export function evalStatusVariant(status?: EvalStatus | null): 'outline' | 'success' | 'warning' | 'danger' {
  if (status === 'passed') return 'success'
  if (status === 'repaired') return 'warning'
  if (status === 'failed') return 'danger'
  return 'outline'
}
