'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { CommandPalette } from './CommandPalette'
import { ShortcutsHelp } from './ShortcutsHelp'
import { ProductContext, getPerms } from '@/lib/product-context'
import { getMe, listProducts } from '@/lib/api'
import type { Product, User, UserRole } from '@/lib/types'

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
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pendingG = useRef(false)
  const pendingGTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [me, prods] = await Promise.all([getMe(), listProducts()])
        if (cancelled) return
        setUser(me.user)
        setProducts(prods)
        if (prods.length && !prods.find(p => p.id === currentProductId)) {
          setCurrentProductId(prods[0].id)
        }
      } catch {
        // Backend unreachable — keep placeholder state so screens can render
        // their own error UIs. The TopBar product switcher shows no options.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const baseUser: User =
    user ?? {
      id: 'unknown',
      name: 'Loading...',
      role: 'sme',
      products: [],
    }
  const effectiveRole = debugRole ?? baseUser.role
  const currentProduct = products.find(p => p.id === currentProductId)

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
        loading,
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
