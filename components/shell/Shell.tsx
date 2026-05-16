'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { CommandPalette } from './CommandPalette'
import { ShortcutsHelp } from './ShortcutsHelp'
import { ProductContext, getPerms } from '@/lib/product-context'
import { NEXUS_PRODUCTS, NEXUS_USERS, NEXUS_CURRENT_USER_ID, type UserRole } from '@/lib/data'

const NAV_KEYS: Record<string, string> = {
  d: 'dashboard',
  c: 'council',
  s: 'skills',
  a: 'activity',
  n: 'sources',
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [debugRole, setDebugRole] = useState<UserRole | null>(null)
  const [currentProductId, setCurrentProductId] = useState('forge')
  const router = useRouter()
  const pendingG = useRef(false)
  const pendingGTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const baseUser = NEXUS_USERS.find(u => u.id === NEXUS_CURRENT_USER_ID)!
  const effectiveRole = debugRole ?? baseUser.role
  const currentProduct = NEXUS_PRODUCTS.find(p => p.id === currentProductId)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const inField =
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t?.isContentEditable ?? false)

      // ⌘K / Ctrl+K — toggle palette (allowed even from a field)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setHelpOpen(false)
        setPaletteOpen(o => !o)
        return
      }

      if (inField) return

      // Escape — close overlays
      if (e.key === 'Escape') {
        if (paletteOpen) setPaletteOpen(false)
        if (helpOpen) setHelpOpen(false)
        return
      }

      // Don't run nav sequences while an overlay owns the keyboard
      if (paletteOpen) return

      // ? — toggle shortcuts help
      if (e.key === '?') {
        e.preventDefault()
        setHelpOpen(o => !o)
        return
      }

      if (helpOpen) return

      // Vim-style "g then x" navigation
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        pendingG.current = true
        if (pendingGTimer.current) clearTimeout(pendingGTimer.current)
        pendingGTimer.current = setTimeout(() => { pendingG.current = false }, 800)
        return
      }

      if (pendingG.current) {
        const dest = NAV_KEYS[e.key.toLowerCase()]
        pendingG.current = false
        if (pendingGTimer.current) clearTimeout(pendingGTimer.current)
        if (dest) {
          e.preventDefault()
          router.push(`/p/${currentProductId}/${dest}`)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      if (pendingGTimer.current) clearTimeout(pendingGTimer.current)
    }
  }, [paletteOpen, helpOpen, currentProductId, router])

  return (
    <TooltipProvider delayDuration={250}>
      <ProductContext.Provider value={{
        currentProductId,
        currentProduct,
        currentUser: { ...baseUser, role: effectiveRole },
        perms: getPerms(effectiveRole),
        debugRole,
      }}>
        <div className="flex flex-col h-screen overflow-hidden">
          <TopBar
            onOpenPalette={() => setPaletteOpen(true)}
            onDebugRoleChange={setDebugRole}
            debugRole={debugRole}
            onProductChange={setCurrentProductId}
          />
          <div className="flex flex-1 min-h-0">
            <SideNav />
            <main className="flex-1 min-w-0 overflow-auto bg-bg flex flex-col">
              {children}
            </main>
          </div>
          {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
          <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
        </div>
      </ProductContext.Provider>
    </TooltipProvider>
  )
}
