import { cn } from '@/lib/utils'

const PAGE_MAX_WIDTH = 'max-w-[1280px]'
const PAGE_PADDING_X = 'px-8'

export function PageHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="border-b border-border bg-surface-glass/60 backdrop-blur-sm">
      <div
        className={cn(
          'flex h-14 w-full items-center gap-3 px-8 [&_a]:text-xs [&_button]:text-xs [&_h1]:text-xl [&_h1]:font-medium [&_h1]:leading-none',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className={cn('mx-auto py-8 space-y-8', PAGE_MAX_WIDTH, PAGE_PADDING_X, className)}>
        {children}
      </div>
    </div>
  )
}

export function PageGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-12 gap-6', className)}>{children}</div>
}
