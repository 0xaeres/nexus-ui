import { cn } from '@/lib/utils'

export function H1({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cn('text-2xl font-semibold tracking-tight text-fg leading-tight m-0', className)}>{children}</h1>
}

export function H2({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-xl font-semibold tracking-tight text-fg m-0', className)}>{children}</h2>
}

export function H3({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-semibold text-fg m-0', className)}>{children}</h3>
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-xs font-medium uppercase tracking-wider text-fg-muted', className)}>{children}</div>
}

export function Body({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <p className={cn('text-base text-fg leading-relaxed m-0', className)}>{children}</p>
}

export function Muted({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <span className={cn('text-sm text-fg-muted', className)}>{children}</span>
}

export function Subtle({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <span className={cn('text-sm text-fg-subtle', className)}>{children}</span>
}

export function Code({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <code className={cn('font-mono text-sm text-fg', className)}>{children}</code>
}

export function Small({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <span className={cn('text-xs text-fg-muted', className)}>{children}</span>
}
