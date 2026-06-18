'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SectionLabel } from '@/components/ui/typography'

const GROUPS: { label: string; items: { keys: string[]; desc: string }[] }[] = [
  {
    label: 'General',
    items: [
      { keys: ['⌘', 'K'], desc: 'Open command palette' },
      { keys: ['?'], desc: 'Show this help' },
      { keys: ['Esc'], desc: 'Close dialog / palette' },
    ],
  },
  {
    label: 'Navigate',
    items: [
      { keys: ['g', 'h'], desc: 'Products (home)' },
      { keys: ['g', 'n'], desc: 'New product' },
      { keys: ['g', 'a'], desc: 'Ask' },
      { keys: ['g', 'i'], desc: 'Ingest' },
      { keys: ['g', 'c'], desc: 'Council' },
      { keys: ['g', 'r'], desc: 'Review' },
      { keys: ['g', 'k'], desc: 'Skill' },
      { keys: ['g', 's'], desc: 'Sources' },
    ],
  },
  {
    label: 'In command palette',
    items: [
      { keys: ['↑', '↓'], desc: 'Move selection' },
      { keys: ['1', '–', '9'], desc: 'Jump to result' },
      { keys: ['↵'], desc: 'Run selected' },
    ],
  },
]

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="min-w-[24px] px-1.5 py-0.5 rounded border border-border-strong bg-surface text-center text-xs font-mono text-fg">
      {children}
    </kbd>
  )
}

export function ShortcutsHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {GROUPS.map(g => (
            <div key={g.label} className="flex flex-col gap-2">
              <SectionLabel>{g.label}</SectionLabel>
              <div className="flex flex-col gap-1.5">
                {g.items.map(item => (
                  <div key={item.desc} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-fg-muted">{item.desc}</span>
                    <span className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <Key key={i}>{k}</Key>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
