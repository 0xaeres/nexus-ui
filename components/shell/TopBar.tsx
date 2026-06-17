'use client'
import Link from 'next/link'
import { Bell, LogOut, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { NexusLogo } from '@/components/icons/NexusLogo'
import { Separator } from '@/components/ui/separator'
import { StatusDot } from '@/components/ui/status-dot'
import { ProductSwitcher } from './ProductSwitcher'
import { useProduct } from '@/lib/product-context'
import { logout } from '@/lib/api'

export function TopBar({
  onOpenPalette, onProductChange,
}: {
  onOpenPalette: () => void
  onProductChange: (id: string) => void
}) {
  const { loading } = useProduct()
  const doLogout = async () => {
    try {
      await logout()
    } finally {
      window.location.href = '/login'
    }
  }
  return (
    <div className="h-14 shrink-0 bg-surface-glass/80 backdrop-blur-md border-b border-border flex items-center px-5 gap-4">
      <Link href="/" className="flex items-center text-fg no-underline">
        <NexusLogo priority />
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
      <button
        onClick={onOpenPalette}
        className="inline-flex items-center gap-2 px-3 py-1.5 min-w-[280px] bg-surface-glass/60 border border-white/[0.08] rounded-md text-fg-subtle text-sm hover:bg-surface-glass-raised/60 transition-colors backdrop-blur-sm"
        aria-label="Search or run a command"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search or run a command…</span>
        <kbd className="text-xs font-mono px-1.5 py-0.5 bg-bg-active rounded border border-border-strong">⌘K</kbd>
      </button>
      <button
        className="relative h-9 w-9 flex items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
      </button>
      <button
        onClick={doLogout}
        className="h-9 w-9 flex items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors"
        title="Log out"
        aria-label="Log out"
      >
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}
