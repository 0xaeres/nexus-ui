'use client'
import * as React from 'react'
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Small } from '@/components/ui/typography'

type ToastVariant = 'success' | 'info' | 'warning' | 'danger'

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastMessage = ToastInput & {
  id: number
  variant: ToastVariant
  duration: number
}

type ToastContextValue = {
  toast: (message: ToastInput) => number
  dismiss: (id: number) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
}

const TONES: Record<ToastVariant, string> = {
  success: 'border-success/35 bg-success/10 text-success',
  info: 'border-accent/35 bg-accent/10 text-accent',
  warning: 'border-warning/35 bg-warning/10 text-warning',
  danger: 'border-danger/35 bg-danger/10 text-danger',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([])
  const nextId = React.useRef(1)
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = React.useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setMessages((items) => items.filter((item) => item.id !== id))
  }, [])

  const toast = React.useCallback((message: ToastInput) => {
    const id = nextId.current++
    const item: ToastMessage = {
      id,
      variant: message.variant ?? 'info',
      duration: message.duration ?? 4200,
      title: message.title,
      description: message.description,
    }
    setMessages((items) => [...items.slice(-3), item])
    if (item.duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), item.duration))
    }
    return id
  }, [dismiss])

  React.useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastViewport messages={messages} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context.toast
}

function ToastViewport({
  messages,
  onDismiss,
}: {
  messages: ToastMessage[]
  onDismiss: (id: number) => void
}) {
  if (messages.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed right-4 top-16 z-[70] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
    >
      {messages.map((message) => {
        const Icon = ICONS[message.variant]
        return (
          <div
            key={message.id}
            className="animate-msg-in overflow-hidden rounded-lg border border-border-strong bg-surface-raised shadow-card-raised"
          >
            <div className="flex items-start gap-3 p-3">
              <div className={cn('mt-0.5 rounded-md border p-1', TONES[message.variant])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Small className="font-medium text-fg">{message.title}</Small>
                {message.description && (
                  <Small className="mt-0.5 block text-fg-muted">{message.description}</Small>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-fg-subtle hover:bg-bg-hover hover:text-fg"
                onClick={() => onDismiss(message.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
