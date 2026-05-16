import { Skeleton } from '@/components/ui/skeleton'

export function SkillsSkeleton() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-7 py-4 border-b border-border flex items-center gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex-1 flex min-h-0">
        <aside className="w-[300px] border-r border-border p-3 flex flex-col gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-9 w-full rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 mt-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </aside>
        <main className="flex-1 p-7 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
          <Skeleton className="h-24 w-full" />
        </main>
      </div>
    </div>
  )
}
