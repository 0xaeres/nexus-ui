'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Settings as SettingsIcon } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useProduct } from '@/lib/product-context'
import { listProducts } from '@/lib/api'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProductSwitcher({ onProductChange }: { onProductChange: (id: string) => void }) {
  const { currentProductId, currentProduct, perms } = useProduct()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    let cancelled = false
    listProducts()
      .then(p => { if (!cancelled) setProducts(p) })
      .catch(() => { if (!cancelled) setProducts([]) })
    return () => { cancelled = true }
  }, [])

  const handleSelect = (id: string) => {
    onProductChange(id)
    router.push(`/p/${id}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border-strong text-fg text-base font-medium font-mono hover:bg-bg-active transition-colors data-[state=open]:bg-bg-active">
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
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium font-mono text-fg">{p.name}</div>
                <div className="text-xs text-fg-subtle truncate">{p.tagline}</div>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0 mt-1.5" />
            </DropdownMenuItem>
          )
        })}
        {(perms.canOnboard || perms.isOrgAdmin) && (
          <>
            <DropdownMenuSeparator />
            {perms.canOnboard && (
              <DropdownMenuItem onSelect={() => router.push('/new')}>
                <Plus className="h-4 w-4" />
                New product
              </DropdownMenuItem>
            )}
            {perms.isOrgAdmin && (
              <DropdownMenuItem onSelect={() => router.push('/settings/org')}>
                <SettingsIcon className="h-4 w-4" />
                Org overview
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
