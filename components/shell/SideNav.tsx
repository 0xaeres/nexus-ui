'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass, Plug, Settings as SettingsIcon, Terminal,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

export function SideNav() {
  const pathname = usePathname() ?? '/'
  const { currentUser } = useProduct()

  const productMatch = pathname.match(/^\/p\/([^/]+)/)
  const inProduct = productMatch !== null
  const productSlug = productMatch?.[1]
  const base = productSlug ? `/p/${productSlug}` : ''

  return (
    <nav className="w-[260px] shrink-0 bg-bg border-r border-border px-3 py-4 flex flex-col gap-1 overflow-y-auto">
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
        workspace
      </div>

      <NavLink href="/" icon={Compass} label="Products" active={!inProduct && pathname === '/'} />

      {inProduct && (
        <>
          <NavLink
            href={`${base}/sources`}
            icon={Plug}
            label="Sources"
            active={pathname.startsWith(`${base}/sources`)}
          />
        </>
      )}

      <div className="flex-1" />
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
        system
      </div>

      <div className="flex items-center gap-3 px-3 py-2 rounded-md text-base text-fg-muted hover:bg-bg-hover transition-colors cursor-pointer">
        <Terminal className="h-[18px] w-[18px]" />
        <span className="flex-1">Logs</span>
      </div>

      {inProduct ? (
        <NavLink
          href={`${base}/settings`}
          icon={SettingsIcon}
          label="Settings"
          active={pathname.startsWith(`${base}/settings`)}
        />
      ) : (
        <NavLink
          href="/settings/org"
          icon={SettingsIcon}
          label="Org settings"
          active={pathname.startsWith('/settings/org')}
        />
      )}

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

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: typeof Compass
  label: string
  active: boolean
}) {
  return (
    <Link href={href} className="no-underline">
      <div
        className={cn(
          'relative flex items-center gap-3 px-3 py-2 rounded-md text-base transition-colors',
          active ? 'bg-accent/10 text-fg' : 'text-fg-muted hover:bg-bg-hover hover:text-fg',
        )}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-r" />}
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1">{label}</span>
      </div>
    </Link>
  )
}
