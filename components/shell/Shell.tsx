'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { CommandPalette } from './CommandPalette'
import { ShortcutsHelp } from './ShortcutsHelp'
import { ToastProvider } from '@/components/ui/toast'
import { H1, Muted } from '@/components/ui/typography'
import { AnvayLogo } from '@/components/icons/AnvayLogo'
import { ProductContext, getPerms } from '@/lib/product-context'
import { ApiError, getMe, getSetupStatus, listProducts } from '@/lib/api'
import type { Product, ProductRole, User } from '@/lib/types'

// Vim-style "g then x" chords. `h` = home (org dashboard); the rest are
// product-scoped and only fire when a current product is set.
const PRODUCT_CHORDS: Record<string, string> = {
  o: '',           // overview (stage page)
  a: 'ask',
  i: 'ingest',
  c: 'council',
  r: 'review',
  k: 'skills',
  s: 'sources',
  m: 'setup-client',
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [currentProductId, setCurrentProductId] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [memberships, setMemberships] = useState<Record<string, ProductRole>>({})
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [bootAttempt, setBootAttempt] = useState(0)
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const pendingG = useRef(false)
  const pendingGTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryBootstrap = () => {
    setLoading(true)
    setBackendError(null)
    setRedirecting(false)
    setBootAttempt((n) => n + 1)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setBackendError(null)
      setRedirecting(false)
      try {
        const [me, prods, setup] = await Promise.all([
          getMe(),
          listProducts(),
          getSetupStatus(),
        ])
        if (cancelled) return
        setBackendError(null)
        if (me.user.id === 'dev-admin') {
          setRedirecting(true)
          router.replace('/landing')
          return
        }
        setUser(me.user)
        setMemberships(me.memberships ?? {})
        setProducts(prods)
        if (me.user.status && me.user.status !== 'approved') {
          setRedirecting(true)
          router.replace('/request-access')
          return
        }
        if (!setup.configured && pathname !== '/setup') {
          setRedirecting(true)
          router.replace('/setup')
          return
        }
        const productFromPath = pathname.match(/^\/p\/([^/]+)/)?.[1]
        setCurrentProductId((prev) => {
          if (productFromPath) return productFromPath
          if (prev && prods.some((p) => p.id === prev)) return prev
          return prods[0]?.id ?? ''
        })
      } catch (e) {
        if (cancelled) return
        if (e instanceof ApiError && e.status === 401) {
          setRedirecting(true)
          router.replace('/landing')
          return
        }
        setUser(null)
        setProducts([])
        setMemberships({})
        setBackendError(e instanceof Error ? e.message : 'Anvay backend is unavailable')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootAttempt])

  useEffect(() => {
    if (!backendError) return
    const retry = setTimeout(retryBootstrap, 5000)
    return () => clearTimeout(retry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendError])

  useEffect(() => {
    const match = pathname.match(/^\/p\/([^/]+)/)
    const productFromPath = match?.[1]
    if (productFromPath && productFromPath !== currentProductId) {
      setCurrentProductId(productFromPath)
    }
  }, [currentProductId, pathname])

  const baseUser: User =
    user ?? {
      id: 'unknown',
      name: 'Loading...',
      role: 'viewer',
      products: [],
    }
  const currentProduct = products.find(p => p.id === currentProductId)
  const currentProductRole = memberships[currentProductId] ?? null
  const perms = getPerms(baseUser.role, currentProductRole)

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
        const key = e.key.toLowerCase()
        pendingG.current = false
        if (pendingGTimer.current) clearTimeout(pendingGTimer.current)
        if (key === 'h') {
          e.preventDefault()
          router.push('/')
          return
        }
        if (key === 'n') {
          e.preventDefault()
          router.push('/new')
          return
        }
        const dest = PRODUCT_CHORDS[key]
        if (dest !== undefined && currentProductId) {
          e.preventDefault()
          router.push(dest ? `/p/${currentProductId}/${dest}` : `/p/${currentProductId}`)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      if (pendingGTimer.current) clearTimeout(pendingGTimer.current)
    }
  }, [paletteOpen, helpOpen, currentProductId, router])

  if (loading || redirecting) {
    return (
      <div className="grid h-screen place-items-center bg-bg text-fg">
        <div className="flex flex-col items-center gap-4">
          <AnvayLogo markOnly priority size="md" className="animate-pulse-slow" />
          <span className="font-mono text-sm text-fg-subtle">{redirecting ? 'redirecting' : 'connecting'}</span>
        </div>
      </div>
    )
  }

  if (backendError || (!user && !redirecting)) {
    return (
      <div className="grid h-screen place-items-center bg-bg px-6 text-fg">
        <div className="flex max-w-md flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/15 text-danger">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <Badge variant="danger" className="font-mono">backend unavailable</Badge>
          <div className="flex flex-col gap-2">
            <H1>Cannot reach Anvay</H1>
            <Muted>
              The UI is running, but the backend API is not reachable. This screen retries automatically.
            </Muted>
            {backendError && (
              <code className="mt-1 rounded-md border border-border bg-surface-sunk px-2 py-1 font-mono text-xs text-fg-subtle">
                {backendError}
              </code>
            )}
          </div>
          <Button type="button" variant="secondary" onClick={retryBootstrap}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry now
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={250}>
      <ProductContext.Provider value={{
        currentProductId,
        currentProduct,
        products,
        currentUser: baseUser,
        perms,
        memberships,
        loading,
      }}>
      <ToastProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <TopBar
            onOpenPalette={() => setPaletteOpen(true)}
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
      </ToastProvider>
      </ProductContext.Provider>
    </TooltipProvider>
  )
}
