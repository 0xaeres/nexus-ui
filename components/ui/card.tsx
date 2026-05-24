import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-lg text-fg overflow-hidden', {
  variants: {
    variant: {
      // Default flat surface — used for tables, panels, content groupings
      surface: 'bg-surface border border-border shadow-card',
      // Subtle inner-glow stat card — ONLY for metrics
      stat: 'bg-surface border border-border relative before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_top_left,var(--tw-card-glow,rgba(124,140,255,0.12)),transparent_60%)] shadow-card',
      // Slightly raised, solid bg — used for connector cards & clickable action tiles
      action: 'bg-surface-raised border border-border-strong hover:border-accent/40 hover:bg-bg-active transition-colors shadow-card-raised',
      // Glassmorphism — frosted translucent with subtle glow
      glass: 'bg-surface-glass backdrop-blur-xl border border-white/[0.08] shadow-card-raised relative before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_top_left,var(--tw-card-glow,rgba(124,140,255,0.10)),transparent_55%)]',
      // Hover lift glass — premium interactive cards
      glassAction: 'bg-surface-glass backdrop-blur-xl border border-white/[0.08] shadow-card hover:shadow-card-raised hover:-translate-y-0.5 hover:bg-surface-glass-raised transition-all duration-200 relative before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_top_left,var(--tw-card-glow,rgba(124,140,255,0.10)),transparent_55%)]',
      // No bg/border — pure grouping
      ghost: '',
    },
  },
  defaultVariants: { variant: 'surface' },
})

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  glowColor?: string
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, glowColor, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      style={glowColor ? ({ ['--tw-card-glow' as never]: glowColor, ...style } as React.CSSProperties) : style}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold leading-snug text-fg tracking-tight', className)} {...props} />
  ),
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-fg-muted leading-relaxed', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 p-5 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'
