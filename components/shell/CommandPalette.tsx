'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  LayoutDashboard,
  Plug,
  Hexagon,
  Activity as ActivityIcon,
  Users,
  Settings,
  Plus,
  PlayCircle,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

type Cmd = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  group: 'Navigate' | 'Quick actions'
  shortcut?: string
  /** single key that runs this command when the search box is empty */
  chord?: string
}

function buildCommands(base: string): Cmd[] {
  return [
    { id: 'nav-dashboard', group: 'Navigate', label: 'Dashboard', href: `${base}/dashboard`, icon: LayoutDashboard, shortcut: 'g d', chord: 'd' },
    { id: 'nav-council',   group: 'Navigate', label: 'Council',   href: `${base}/council`,   icon: Users,           shortcut: 'g c', chord: 'c' },
    { id: 'nav-skills',    group: 'Navigate', label: 'Skills',    href: `${base}/skills`,    icon: Hexagon,         shortcut: 'g s', chord: 's' },
    { id: 'nav-activity',  group: 'Navigate', label: 'Activity',  href: `${base}/activity`,  icon: ActivityIcon,    shortcut: 'g a', chord: 'a' },
    { id: 'nav-sources',   group: 'Navigate', label: 'Sources',   href: `${base}/sources`,   icon: Plug,            shortcut: 'g n', chord: 'n' },
    { id: 'nav-settings',  group: 'Navigate', label: 'Settings',  href: `${base}/settings`,  icon: Settings },
    { id: 'act-source',    group: 'Quick actions', label: 'Add source',          href: `${base}/sources/new`, icon: Plus },
    { id: 'act-council',   group: 'Quick actions', label: 'New council session', href: `${base}/council`,     icon: PlayCircle },
  ]
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { currentProductId } = useProduct()
  const base = `/p/${currentProductId}`
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo(() => buildCommands(base), [base])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return commands
    return commands.filter(c => c.label.toLowerCase().includes(needle))
  }, [q, commands])

  const groups = useMemo(() => {
    const map = new Map<Cmd['group'], Cmd[]>()
    for (const c of filtered) {
      const arr = map.get(c.group) ?? []
      arr.push(c)
      map.set(c.group, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  const run = (cmd: Cmd | undefined) => {
    if (!cmd) return
    router.push(cmd.href)
    onClose()
  }

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setSel(0) }, [q])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); return }
      if (e.key === 'Enter') { e.preventDefault(); run(filtered[sel]); return }

      // When the search box is empty, single keys act as shortcuts
      if (q === '') {
        // 1–9 jump straight to the Nth visible result
        if (/^[1-9]$/.test(e.key)) {
          const idx = Number(e.key) - 1
          if (idx < filtered.length) { e.preventDefault(); run(filtered[idx]) }
          return
        }
        // letter chord (d/c/s/a/n) runs the matching Navigate command
        const byChord = commands.find(c => c.chord === e.key.toLowerCase())
        if (byChord) { e.preventDefault(); run(byChord) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [filtered, sel, q, commands, onClose, router])

  // Track running index across groups so sel matches filtered[] order
  let cursor = -1

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-2xl bg-surface-raised border border-border-strong rounded-lg shadow-2xl shadow-black/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border">
          <Search className="h-5 w-5 text-fg-muted shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search or run a command…"
            className="flex-1 bg-transparent border-0 outline-none text-base text-fg placeholder:text-fg-subtle"
          />
          <Badge variant="outline" className="font-mono">esc</Badge>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm font-mono text-fg-subtle">
              No commands match
            </div>
          )}

          {groups.map(([group, cmds]) => (
            <div key={group} className="mb-1.5 last:mb-0">
              <div className="px-3 py-1.5 text-xs uppercase tracking-wider font-semibold text-fg-subtle">
                {group}
              </div>
              {cmds.map(c => {
                cursor++
                const idx = cursor
                const active = idx === sel
                const Icon = c.icon
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setSel(idx)}
                    onClick={() => run(c)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors',
                      active ? 'bg-bg-selected text-fg' : 'text-fg-muted hover:bg-bg-hover hover:text-fg',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-fg-subtle')} />
                    <span className="flex-1 text-base">{c.label}</span>
                    {q === '' && idx < 9 && (
                      <Badge variant="outline" className="font-mono text-fg-subtle">{idx + 1}</Badge>
                    )}
                    {c.shortcut && (
                      <Badge variant="outline" className="font-mono text-fg-subtle">{c.shortcut}</Badge>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-4 py-2.5 flex items-center gap-3 text-xs font-mono text-fg-subtle">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-border-strong bg-surface text-xs">↑↓</kbd>
            navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-border-strong bg-surface text-xs">↵</kbd>
            select
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-border-strong bg-surface text-xs">1–9</kbd>
            jump
          </span>
          <div className="flex-1" />
          <span>{filtered.length} {filtered.length === 1 ? 'command' : 'commands'}</span>
        </div>
      </div>
    </div>
  )
}
