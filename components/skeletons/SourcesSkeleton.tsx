import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from './TableSkeleton'

export function SourcesSkeleton() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-7 py-4 border-b border-border flex items-center gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex-1 overflow-auto px-9 py-8 flex flex-col gap-8">
        <section>
          <Skeleton className="h-3 w-20 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-lg border border-border-strong bg-surface-raised p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <Skeleton className="h-3 w-20 mb-4" />
          <TableSkeleton rows={4} cols={6} />
        </section>
      </div>
    </div>
  )
}
