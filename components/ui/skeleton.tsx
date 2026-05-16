import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md bg-[linear-gradient(90deg,var(--color-bg-active)_0%,var(--color-bg-hover)_50%,var(--color-bg-active)_100%)] bg-[length:200%_100%]',
        className,
      )}
      style={{ animation: 'nexus-skeleton 1.6s linear infinite' }}
      {...props}
    />
  )
}
