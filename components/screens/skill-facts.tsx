import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Code, SectionLabel } from '@/components/ui/typography'
import { coverageSummary, evalStatusLabel, evalStatusVariant, tierLabel } from '@/lib/skills'
import type { Skill } from '@/lib/types'
import { cn } from '@/lib/utils'

export function confColor(confidence: number) {
  if (confidence < 0.5) return 'text-danger'
  if (confidence < 0.8) return 'text-warning'
  return 'text-success'
}

export function SkillConfidenceCard({ skill }: { skill: Pick<Skill, 'confidence'> }) {
  return (
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
  )
}

export function SkillAppliesToCard({
  skill,
  className,
}: {
  skill: Pick<Skill, 'applies_to'>
  className?: string
}) {
  if (skill.applies_to.files.length === 0 && skill.applies_to.contexts.length === 0) return null

  return (
    <Card variant="surface" className={className}>
      <CardHeader>
        <SectionLabel>Applies to</SectionLabel>
      </CardHeader>
      <CardContent>
        {skill.applies_to.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skill.applies_to.files.map((file) => (
              <Badge key={file} variant="outline" className="font-mono text-xs">{file}</Badge>
            ))}
          </div>
        )}
        {skill.applies_to.contexts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skill.applies_to.contexts.map((context) => (
              <Badge key={context} variant="accent" className="font-mono text-xs">{context}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SkillPackMetadataCard({
  skill,
  compact = false,
}: {
  skill: Pick<Skill, 'tier' | 'eval_status' | 'coverage' | 'parent' | 'related'>
  compact?: boolean
}) {
  return (
    <Card variant="surface">
      <CardHeader>
        <SectionLabel>Pack metadata</SectionLabel>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!compact && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{tierLabel(skill.tier)}</Badge>
            <Badge variant={evalStatusVariant(skill.eval_status)} className="font-mono">
              {evalStatusLabel(skill.eval_status)}
            </Badge>
            <Badge variant="outline" className="font-mono">{coverageSummary(skill.coverage)}</Badge>
            {skill.parent && <Badge variant="outline" className="font-mono">parent {skill.parent}</Badge>}
          </div>
        )}
        {compact && skill.parent && <span className="text-xs font-mono text-fg">parent {skill.parent}</span>}
        {(skill.related?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(skill.related ?? []).map((id) => (
              <Badge key={id} variant="outline" className="font-mono text-xs">rel {id}</Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {(skill.coverage?.repos ?? []).map((item) => <Badge key={`repo-${item}`} variant="outline" className="font-mono text-xs">{item}</Badge>)}
          {(skill.coverage?.applications ?? []).map((item) => <Badge key={`app-${item}`} variant="accent" className="font-mono text-xs">{item}</Badge>)}
          {(skill.coverage?.topics ?? []).map((item) => <Badge key={`topic-${item}`} variant="secondary" className="font-mono text-xs">{item}</Badge>)}
        </div>
      </CardContent>
    </Card>
  )
}
