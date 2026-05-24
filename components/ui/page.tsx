import { cn } from '@/lib/utils'

const PAGE_MAX_WIDTH = 'max-w-[1280px]'
const PAGE_PADDING_X = 'px-8'

export function PageHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="border-b border-border bg-surface-glass/60 backdrop-blur-sm">
      <div className={cn('mx-auto flex items-center gap-4 h-16', PAGE_MAX_WIDTH, PAGE_PADDING_X, className)}>
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
