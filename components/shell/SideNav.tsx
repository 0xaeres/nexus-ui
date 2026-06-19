'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, ClipboardCheck, Compass, Database, LayoutDashboard, MessageSquareText, Plug, Settings, Shield, Sparkles } from 'lucide-react'
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
    <nav className="w-[260px] shrink-0 bg-surface-glass/80 backdrop-blur-xl border-r border-border px-3 py-4 flex flex-col gap-1 overflow-y-auto">
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
        workspace
      </div>

      <NavLink href="/" icon={Compass} label="Products" active={!inProduct && pathname === '/'} />

      {inProduct && (
        <>
          <NavLink
            href={base}
            icon={LayoutDashboard}
            label="Dashboard"
            active={pathname === base || pathname === `${base}/dashboard`}
          />
          <NavLink
            href={`${base}/sources`}
            icon={Plug}
            label="Sources"
            active={pathname.startsWith(`${base}/sources`)}
          />
          <NavLink
            href={`${base}/ask`}
            icon={MessageSquareText}
            label="Ask"
            active={pathname === `${base}/ask`}
          />
          <NavLink
            href={`${base}/ingest`}
            icon={Database}
            label="Ingest"
            active={pathname === `${base}/ingest`}
          />
          <NavLink
            href={`${base}/council`}
            icon={Sparkles}
            label="Council"
            active={pathname.startsWith(`${base}/council`)}
          />
          <NavLink
            href={`${base}/review`}
            icon={ClipboardCheck}
            label="Review"
            active={pathname === `${base}/review`}
          />
          <NavLink
            href={`${base}/skill`}
            icon={BookOpen}
            label="Skill"
            active={pathname === `${base}/skill` || pathname.startsWith(`${base}/skills`)}
          />
        </>
      )}

      <div className="flex-1" />
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
        system
      </div>

      <NavLink
        href="/setup"
        icon={Settings}
        label="Setup"
        active={pathname === '/setup'}
      />
      {currentUser.role === 'admin' && (
        <NavLink
          href="/admin/access"
          icon={Shield}
          label="Access"
          active={pathname === '/admin/access'}
        />
      )}

      <Separator className="my-3" />
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="h-9 w-9 rounded-md border border-border-strong bg-surface-raised flex items-center justify-center text-sm font-medium text-fg shadow-card">
          {(currentUser.name || currentUser.email || 'NA').slice(0, 2)}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm text-fg truncate">{currentUser.name || currentUser.email}</span>
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
          'relative flex items-center gap-3 px-3 py-2 rounded-md text-base transition-all',
          active
            ? 'bg-bg-selected text-fg border border-accent/25'
            : 'text-fg-muted hover:bg-bg-hover hover:text-fg',
        )}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-r shadow-[0_0_14px_var(--color-accent)]" />}
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1">{label}</span>
      </div>
    </Link>
  )
}
