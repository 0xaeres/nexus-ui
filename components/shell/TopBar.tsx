'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { StatusDot } from '@/components/ui/status-dot'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ProductSwitcher } from './ProductSwitcher'
import { useProduct } from '@/lib/product-context'
import type { UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'

const ROLES: { role: UserRole; label: string; color: string }[] = [
  { role: 'org_admin',     label: 'Org Admin',     color: 'text-accent' },
  { role: 'product_admin', label: 'Product Admin', color: 'text-success' },
  { role: 'sme',           label: 'SME',           color: 'text-warning' },
]

function PersonaSwitch({ debugRole, onChange }: { debugRole: UserRole | null; onChange: (r: UserRole | null) => void }) {
  const current = debugRole ?? 'org_admin'
  const label = ROLES.find(r => r.role === current)?.label ?? 'Persona'
  const color = ROLES.find(r => r.role === current)?.color ?? 'text-fg-muted'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors',
          'bg-surface border-border-strong hover:bg-bg-active',
          color,
        )}>
          <span className="h-1 w-1 rounded-full bg-current" />
          {label}
          {debugRole === null && <span className="text-fg-subtle text-xs">(default)</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Debug persona</DropdownMenuLabel>
        {ROLES.map(r => (
          <DropdownMenuItem key={r.role} onSelect={() => onChange(r.role)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', {
              'bg-accent': r.role === 'org_admin',
              'bg-success': r.role === 'product_admin',
              'bg-warning': r.role === 'sme',
            })} />
            {r.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onChange(null)}>
          <span className="h-1.5 w-1.5 rounded-full bg-fg-subtle" />
          Reset to default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TopBar({
  onOpenPalette, onDebugRoleChange, debugRole, onProductChange,
}: {
  onOpenPalette: () => void
  onDebugRoleChange: (r: UserRole | null) => void
  debugRole: UserRole | null
  onProductChange: (id: string) => void
}) {
  const { loading } = useProduct()
  return (
    <div className="h-14 shrink-0 bg-bg border-b border-border flex items-center px-5 gap-4">
      <Link href="/" className="flex items-center gap-2.5 text-fg no-underline">
        <Image src="/nexus-logo.svg" alt="" width={22} height={22} className="invert-[0.92]" priority />
        <span className="text-base font-semibold tracking-tight">nexus</span>
      </Link>
      <Separator orientation="vertical" className="h-5" />
      <ProductSwitcher onProductChange={onProductChange} />
      <Separator orientation="vertical" className="h-5" />
      <Badge variant="outline" className="gap-1.5 normal-case text-sm">
        <StatusDot status={loading ? 'syncing' : 'running'} size={6} />
        <span className="font-mono text-fg-muted">
          {loading ? 'connecting' : 'online'}
        </span>
      </Badge>
      <div className="flex-1" />
      <PersonaSwitch debugRole={debugRole} onChange={onDebugRoleChange} />
      <button
        onClick={onOpenPalette}
        className="inline-flex items-center gap-2 px-3 py-1.5 min-w-[280px] bg-surface border border-border rounded-md text-fg-subtle text-sm hover:bg-bg-active transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search or run a command…</span>
        <kbd className="text-xs font-mono px-1.5 py-0.5 bg-bg-active rounded border border-border-strong">⌘K</kbd>
      </button>
      <button className="relative h-9 w-9 flex items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors">
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
      </button>
    </div>
  )
}
