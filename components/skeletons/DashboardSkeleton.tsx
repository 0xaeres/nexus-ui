import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from './TableSkeleton'

export function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-7 py-4 border-b border-border flex items-center gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex-1 overflow-auto px-9 py-8 flex flex-col gap-7">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <div>
          <Skeleton className="h-3 w-32 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <TableSkeleton rows={6} cols={4} />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
