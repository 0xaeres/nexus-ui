'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, Activity, Plug,
  Terminal, Settings as SettingsIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

export function SideNav() {
  const pathname = usePathname()
  const { currentProductId, currentUser, perms } = useProduct()
  const base = `/p/${currentProductId}`

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: `${base}/dashboard`, chord: 'D' },
    { id: 'council',   label: 'Council',   icon: Users,           href: `${base}/council`,   chord: 'C', badge: 3 },
    { id: 'skills',    label: 'Skills',    icon: BookOpen,        href: `${base}/skills`,    chord: 'S' },
    { id: 'activity',  label: 'Activity',  icon: Activity,        href: `${base}/activity`,  chord: 'A' },
    { id: 'sources',   label: 'Sources',   icon: Plug,            href: `${base}/sources`,   chord: 'N', badge: perms.canManageSources ? 1 : undefined },
  ]

  const settingsHref = `${base}/settings`

  return (
    <nav className="w-[260px] shrink-0 bg-bg border-r border-border px-3 py-4 flex flex-col gap-1 overflow-y-auto">
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
        workspace
      </div>
      {NAV.map(item => {
        const active = pathname?.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link key={item.id} href={item.href} className="no-underline">
            <div
              className={cn(
                'relative flex items-center gap-3 px-3 py-2 rounded-md text-base transition-colors',
                active ? 'bg-accent/10 text-fg' : 'text-fg-muted hover:bg-bg-hover hover:text-fg',
              )}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-r" />}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && <Badge variant="accent">{item.badge}</Badge>}
              <span className="font-mono text-xs text-fg-faint">g{item.chord.toLowerCase()}</span>
            </div>
          </Link>
        )
      })}
      <div className="flex-1" />
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
        system
      </div>
      <div className="flex items-center gap-3 px-3 py-2 rounded-md text-base text-fg-muted hover:bg-bg-hover transition-colors cursor-pointer">
        <Terminal className="h-[18px] w-[18px]" />
        <span className="flex-1">Logs</span>
      </div>
      <Link href={settingsHref} className="no-underline">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-base transition-colors',
            pathname?.startsWith(settingsHref) ? 'bg-accent/10 text-fg' : 'text-fg-muted hover:bg-bg-hover hover:text-fg',
          )}
        >
          <SettingsIcon className="h-[18px] w-[18px]" />
          <span className="flex-1">Settings</span>
        </div>
      </Link>
      <Separator className="my-3" />
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="h-9 w-9 rounded-full bg-gradient-to-b from-fg-faint to-bg-active flex items-center justify-center text-sm font-medium text-fg">
          {currentUser.name.slice(0, 2)}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm text-fg truncate">{currentUser.name}</span>
          <span className="text-xs font-mono text-fg-subtle truncate">{currentUser.role}</span>
        </div>
      </div>
    </nav>
  )
}
