'use client'
import Link from 'next/link'
import { ArrowLeft, Check, Database, Users, ClipboardCheck, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import { H1, Muted, Small, Subtle } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import type { ProductStage } from '@/lib/types'

const ORDER: { key: ProductStage; label: string; icon: typeof Database; path: string }[] = [
  { key: 'ingesting', label: 'Ingest', icon: Database, path: 'ingest' },
  { key: 'council', label: 'Council', icon: Users, path: 'council' },
  { key: 'review', label: 'Review', icon: ClipboardCheck, path: 'review' },
  { key: 'skill', label: 'Skill', icon: BookOpen, path: 'skill' },
]

export function StageShell({
  productId,
  productName,
  stage,
  reached,
  children,
  headerExtra,
}: {
  productId: string
  productName?: string
  stage: ProductStage
  reached: ProductStage
  children: React.ReactNode
  headerExtra?: React.ReactNode
}) {
  const stageIndex = ORDER.findIndex((s) => s.key === stage)
  const reachedIndex = reached === 'none' ? -1 : ORDER.findIndex((s) => s.key === reached)
  const currentLabel = ORDER[stageIndex]?.label ?? 'Stage'

  return (
    <>
      <PageHeader>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Products
          </Link>
        </Button>
        <H1>{currentLabel}</H1>
        {productName && <Subtle className="font-mono truncate">{productName}</Subtle>}
        <Badge variant="outline" className="font-mono shrink-0">
          {stageIndex + 1} of {ORDER.length}
        </Badge>
        <div className="flex-1" />
        {headerExtra}
      </PageHeader>

      <PageBody>
        <PageGrid>
          <div className="col-span-12 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
            <div className="flex flex-col gap-6">
              <Stepper productId={productId} stageIndex={stageIndex} reachedIndex={reachedIndex} />
              {children}
            </div>
          </div>
        </PageGrid>
      </PageBody>
    </>
  )
}

function Stepper({
  productId,
  stageIndex,
  reachedIndex,
}: {
  productId: string
  stageIndex: number
  reachedIndex: number
}) {
  return (
    <div className="grid grid-cols-4 items-center gap-2">
      {ORDER.map((s, i) => {
        const Icon = s.icon
        const isCurrent = i === stageIndex
        const isDone = i < reachedIndex || (i === reachedIndex && i < stageIndex)
        const isReachable = i <= reachedIndex
        const inner = (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
              isCurrent && 'bg-accent/15 border border-accent/40 text-fg',
              !isCurrent && isDone && 'text-success',
              !isCurrent && !isDone && isReachable && 'text-fg-muted hover:text-fg hover:bg-bg-active',
              !isCurrent && !isReachable && 'text-fg-subtle/60',
            )}
          >
            {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            <span className="text-xs font-mono uppercase tracking-wider">{s.label}</span>
          </div>
        )
        return (
          <div key={s.key} className="flex min-w-0 items-center gap-2">
            {isReachable && !isCurrent ? (
              <Link href={`/p/${productId}/${s.path}`} className="min-w-0 flex-1 no-underline">
                {inner}
              </Link>
            ) : (
              <div className="min-w-0 flex-1">{inner}</div>
            )}
            {i < ORDER.length - 1 && (
              <div className={cn('hidden h-px w-4 shrink-0 sm:block', i < reachedIndex ? 'bg-success/60' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function StageHint({ children }: { children: React.ReactNode }) {
  return <Muted className="text-center max-w-xl">{children}</Muted>
}

export function StageError({ message }: { message: string }) {
  return <Small className="font-mono text-danger block">{message}</Small>
}
