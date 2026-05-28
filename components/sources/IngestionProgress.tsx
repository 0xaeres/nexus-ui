'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Small } from '@/components/ui/typography'
import { sourceLogUrl, syncSource } from '@/lib/api'
import type { Source } from '@/lib/types'
import { cn } from '@/lib/utils'

export type IngestStatus = 'idle' | 'running' | 'done' | 'error'

interface LogLine {
  level: string
  msg: string
  ts?: string
  done?: number
  total?: number
  pct?: number
}

interface Props {
  productId: string
  source: Source
  forceRunning?: boolean
  onStatusChange?: (status: IngestStatus) => void
}

export function IngestionProgress({ productId, source, forceRunning = false, onStatusChange }: Props) {
  const initial: IngestStatus = useMemo(() => {
    if (forceRunning) return 'running'
    if (source.lastSync && source.resourceCount > 0) return 'done'
    if (source.status === 'error') return 'error'
    return 'running'
  }, [forceRunning, source.lastSync, source.resourceCount, source.status])

  const [status, setStatus] = useState<IngestStatus>(initial)
  const [lines, setLines] = useState<LogLine[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number; pct: number } | null>(null)
  const [retrying, setRetrying] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastStatusRef = useRef<IngestStatus>(initial)
  const hasEmbedWarnRef = useRef(false)
  const autoRetriedRef = useRef(false)

  useEffect(() => {
    if (status !== lastStatusRef.current) {
      lastStatusRef.current = status
      onStatusChange?.(status)
    }
  }, [status, onStatusChange])

  useEffect(() => {
    if (status === 'done' || status === 'error') return
    const es = new EventSource(sourceLogUrl(productId, source.id))
    let done = false

    es.onmessage = (e) => {
      let item: LogLine
      try {
        item = JSON.parse(e.data) as LogLine
      } catch {
        item = { level: 'info', msg: e.data }
      }

      if (item.level === 'progress') {
        setProgress({ done: item.done!, total: item.total!, pct: item.pct! })
        return
      }

      if (item.level === 'warn') {
        const isEmbedWarn = /embed|EMBEDDER|token limit/i.test(item.msg ?? '')
        if (isEmbedWarn) hasEmbedWarnRef.current = true
        setLines((prev) => [...prev, item])
        return
      }

      setLines((prev) => [...prev, item])

      if (item.level === 'done' || item.level === 'success') {
        if (!done) {
          done = true
          if (hasEmbedWarnRef.current && !autoRetriedRef.current) {
            autoRetriedRef.current = true
            hasEmbedWarnRef.current = false
            setLines((prev) => [...prev, { level: 'info', msg: 'Embed errors detected — auto-retrying sync…' }])
            syncSource(productId, source.id)
              .then(() => {
                setProgress(null)
                setLines([{ level: 'info', msg: 'Auto-retrying ingestion…' }])
                setStatus('running')
              })
              .catch(() => setStatus('done'))
            return
          }
          setStatus('done')
        }
      } else if (item.level === 'error') {
        if (!done) {
          done = true
          setStatus('error')
        }
      }
    }
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED && !done) {
        done = true
        setStatus('error')
        setLines((prev) => [...prev, { level: 'error', msg: 'Stream closed unexpectedly.' }])
      }
    }
    return () => {
      es.close()
    }
  }, [productId, source.id, status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const retry = async () => {
    setRetrying(true)
    try {
      await syncSource(productId, source.id)
      setLines([])
      setStatus('running')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <StatusRow source={source} status={status} onRetry={status === 'error' ? retry : undefined} retrying={retrying} />
      {status === 'running' && progress && (
        <div className="flex flex-col gap-1">
          <Progress value={progress.pct} className="h-1.5" />
          <span className="font-mono text-xs text-fg-subtle">{progress.done} / {progress.total} files</span>
        </div>
      )}
      <ScrollArea className="h-44 rounded-md border border-border bg-bg font-mono text-xs">
        <div className="p-3 flex flex-col gap-1">
          {lines.length === 0 && status === 'running' && (
            <span className="text-fg-subtle">Connecting…</span>
          )}
          {lines.length === 0 && status === 'done' && (
            <span className="text-success">
              {source.resourceCount} resources already indexed.
            </span>
          )}
          {lines.map((line, i) => (
            <LogRow key={i} line={line} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}

function StatusRow({
  source,
  status,
  onRetry,
  retrying,
}: {
  source: Source
  status: IngestStatus
  onRetry?: () => void
  retrying?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-fg">{source.name}</span>
      <span className="font-mono text-xs text-fg-subtle">· {source.type}</span>
      <div className="flex-1" />
      {status === 'running' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          <Small className="text-accent font-mono">Ingesting…</Small>
        </>
      )}
      {status === 'done' && (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <Small className="text-success font-mono">Complete</Small>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-3.5 w-3.5 text-danger" />
          <Small className="text-danger font-mono">Failed</Small>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying} className="h-6 px-2 text-xs gap-1">
              {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Retry
            </Button>
          )}
        </>
      )}
      {status === 'idle' && (
        <>
          <Clock className="h-3.5 w-3.5 text-fg-subtle" />
          <Small className="text-fg-subtle font-mono">Waiting</Small>
        </>
      )}
    </div>
  )
}

function LogRow({ line }: { line: LogLine }) {
  const isSuccess = line.level === 'success' || line.level === 'done'
  const isError = line.level === 'error'
  const isWarn = line.level === 'warn'
  return (
    <div className="flex items-start gap-2">
      <span
        className={cn(
          'shrink-0 w-4 text-center',
          isSuccess && 'text-success',
          isError && 'text-danger',
          isWarn && 'text-warning',
          !isSuccess && !isError && !isWarn && 'text-fg-subtle',
        )}
      >
        {isSuccess ? '✓' : isError ? '✗' : isWarn ? '⚠' : '›'}
      </span>
      <span
        className={cn(
          'flex-1 break-all',
          isSuccess && 'text-success',
          isError && 'text-danger',
          isWarn && 'text-warning',
          !isSuccess && !isError && !isWarn && 'text-fg',
        )}
      >
        {line.msg}
      </span>
    </div>
  )
}
