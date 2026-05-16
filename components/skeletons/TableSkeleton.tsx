import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      <div className="flex border-b border-border bg-surface px-3 py-2 gap-3">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex border-b border-border last:border-b-0 px-3 py-2.5 gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" style={{ opacity: 0.7 - r * 0.08 }} />
          ))}
        </div>
      ))}
    </div>
  )
}
