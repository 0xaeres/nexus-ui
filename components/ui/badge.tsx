import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium font-mono leading-none transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-bg-active border-border-strong text-fg',
        secondary: 'bg-surface border-border text-fg-muted',
        outline: 'border-border-strong text-fg-muted',
        success: 'bg-success/10 border-success/25 text-success',
        warning: 'bg-warning/15 border-warning/30 text-warning',
        danger: 'bg-danger/15 border-danger/30 text-danger',
        accent: 'bg-accent/10 border-accent/25 text-accent',
        violet: 'bg-violet/15 border-violet/30 text-violet',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
