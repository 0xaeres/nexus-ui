'use client'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

export function ProductSwitcher({ onProductChange }: { onProductChange: (id: string) => void }) {
  const { currentProductId, currentProduct, perms, products } = useProduct()
  const router = useRouter()

  const handleSelect = (id: string) => {
    onProductChange(id)
    router.push(`/p/${id}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-raised border border-border-strong text-fg text-base font-medium font-mono shadow-card hover:border-accent/35 hover:bg-bg-active transition-all data-[state=open]:border-accent/35 data-[state=open]:bg-bg-active">
          {currentProduct?.name ?? currentProductId}
          <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[280px]">
        <DropdownMenuLabel>Products</DropdownMenuLabel>
        {products.map(p => {
          const active = p.id === currentProductId
          return (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => handleSelect(p.id)}
              className={cn('flex items-start gap-2.5 py-2.5', active && 'bg-bg-active')}
            >
              <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full border border-border-strong', active ? 'bg-accent shadow-[0_0_12px_var(--color-accent)]' : 'bg-fg-faint')} />
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium font-mono text-fg">{p.name}</div>
                <div className="text-xs text-fg-subtle truncate">
                  {p.tagline || p.owner?.team || p.id}
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
        {perms.canOnboard && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/new')}>
              <Plus className="h-4 w-4" />
              New product
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
