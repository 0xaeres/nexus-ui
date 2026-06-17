import { Badge } from '@/components/ui/badge'
import { Code, Small } from '@/components/ui/typography'
import { coverageSummary, evalStatusVariant, tierLabel } from '@/lib/skills'
import type { SkillProposal } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProposalQueueRow({
  item,
  active,
  metric,
  onSelect,
}: {
  item: SkillProposal
  active: boolean
  metric: 'confidence' | 'tier'
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-md px-3 py-2 text-left transition-colors',
        active ? 'bg-bg-active' : 'hover:bg-surface',
      )}
    >
      <div className="flex items-center gap-2">
        <Code className="truncate text-xs">{item.name}</Code>
        <div className="flex-1" />
        <Badge variant="outline" className="font-mono text-xs">
          {metric === 'confidence' ? `${Math.round(item.confidence * 100)}%` : tierLabel(item.tier)}
        </Badge>
        <Badge variant={evalStatusVariant(item.eval_status)} className="font-mono text-xs">
          {item.quality_score == null ? 'N/A' : `${Math.round(item.quality_score * 100)}%`}
        </Badge>
      </div>
      <Small className="mt-1 block text-fg-subtle">{coverageSummary(item.coverage)}</Small>
    </button>
  )
}
