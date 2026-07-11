'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Small } from '@/components/ui/typography'
import { getSource, sourceLogUrl, syncSource } from '@/lib/api'
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
  phase?: 'read' | 'index'
  repo?: string
  repo_index?: number
  repo_count?: number
}

interface RepoProgress {
  readPct: number
  readDone: number
  readTotal: number
  indexPct: number
  indexDone: number
  indexTotal: number
  phase: 'read' | 'index'
  repo?: string
  repoIndex?: number
  repoCount?: number
}

// Reading is the first half of the bar, indexing (chunk → embed → upsert) the
// second half, so the bar keeps moving through chunking instead of freezing at
// 100% once files are read.
function overallPct(p: RepoProgress): number {
  return Math.round(0.5 * p.readPct + 0.5 * p.indexPct)
}

interface Props {
  productId: string
  source: Source
  forceRunning?: boolean
  idleUntilStarted?: boolean
  onStatusChange?: (status: IngestStatus) => void
}

export function IngestionProgress({
  productId,
  source,
  forceRunning = false,
  idleUntilStarted = false,
  onStatusChange,
}: Props) {
  const initial: IngestStatus = useMemo(() => {
    if (forceRunning || source.status === 'syncing') return 'running'
    if (source.status === 'error') return 'error'
    if (source.lastSync && source.resourceCount > 0) return 'done'
    if (idleUntilStarted) return 'idle'
    return 'running'
  }, [forceRunning, idleUntilStarted, source.lastSync, source.resourceCount, source.status])

  // Detect page-refresh mid-ingestion: backend still running but UI lost all state.
  const isReconnect = initial === 'running' && !forceRunning && source.status === 'syncing'

  const [status, setStatus] = useState<IngestStatus>(initial)
  const [lines, setLines] = useState<LogLine[]>(
    isReconnect ? [{ level: 'info', msg: 'Reconnected – ingestion is running. Waiting for next update…' }] : [],
  )
  const [progress, setProgress] = useState<RepoProgress | null>(null)
  const [retrying, setRetrying] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastStatusRef = useRef<IngestStatus>(initial)

  useEffect(() => {
    if (status !== lastStatusRef.current) {
      lastStatusRef.current = status
      onStatusChange?.(status)
    }
  }, [status, onStatusChange])

  useEffect(() => {
    if (status === 'done' || status === 'error' || status === 'idle') return
    const es = new EventSource(sourceLogUrl(productId, source.id), { withCredentials: true })
    let done = false

    es.onmessage = (e) => {
      let item: LogLine
      try {
        item = JSON.parse(e.data) as LogLine
      } catch {
        item = { level: 'info', msg: e.data }
      }

      if (item.level === 'started') {
        // New repo began — reset the bar and capture its file count.
        setProgress({
          readPct: 0,
          readDone: 0,
          readTotal: item.total ?? 0,
          indexPct: 0,
          indexDone: 0,
          indexTotal: item.total ?? 0,
          phase: 'read',
          repo: item.repo,
          repoIndex: item.repo_index,
          repoCount: item.repo_count,
        })
        setLines((prev) => [...prev, item])
        return
      }

      if (item.level === 'progress') {
        const phase = item.phase ?? 'read'
        setProgress((prev) => {
          const base: RepoProgress = prev ?? {
            readPct: 0,
            readDone: 0,
            readTotal: 0,
            indexPct: 0,
            indexDone: 0,
            indexTotal: 0,
            phase,
          }
          const repo = {
            repo: item.repo ?? base.repo,
            repoIndex: item.repo_index ?? base.repoIndex,
            repoCount: item.repo_count ?? base.repoCount,
          }
          if (phase === 'index') {
            return {
              ...base,
              ...repo,
              phase,
              indexPct: item.pct ?? base.indexPct,
              indexDone: item.done ?? base.indexDone,
              indexTotal: item.total ?? base.indexTotal,
            }
          }
          return {
            ...base,
            ...repo,
            phase,
            readPct: item.pct ?? base.readPct,
            readDone: item.done ?? base.readDone,
            readTotal: item.total ?? base.readTotal,
          }
        })
        return
      }

      if (item.level === 'warn') {
        setLines((prev) => [...prev, item])
        return
      }

      setLines((prev) => [...prev, item])

      if (item.level === 'done' || item.level === 'success') {
        if (!done) {
          done = true
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
        // Race: backend may have finished just before/as we reconnected.
        // Check source status before declaring error.
        getSource(productId, source.id)
          .then((s) => {
            if (done) return
            done = true
            if (s.status !== 'syncing' && s.lastSync && s.resourceCount > 0) {
              setStatus('done')
            } else if (s.status === 'error') {
              setStatus('error')
              setLines((prev) => [...prev, { level: 'error', msg: 'Source reported an error.' }])
            } else {
              setStatus('error')
              setLines((prev) => [...prev, { level: 'error', msg: 'Stream closed unexpectedly.' }])
            }
          })
          .catch(() => {
            if (done) return
            done = true
            setStatus('error')
            setLines((prev) => [...prev, { level: 'error', msg: 'Stream closed unexpectedly.' }])
          })
      }
    }
    return () => {
      es.close()
    }
  }, [productId, source.id, status])

  // Fallback poll: catches completion if SSE drops the terminal event or is
  // silent after a refresh. Stops as soon as status leaves 'running'.
  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(async () => {
      try {
        const s = await getSource(productId, source.id)
        if (s.status !== 'syncing') {
          if (s.lastSync && s.resourceCount > 0) {
            setStatus('done')
          } else if (s.status === 'error') {
            setStatus('error')
            setLines((prev) => [...prev, { level: 'error', msg: 'Source reported an error.' }])
          }
        }
      } catch { /* ignore transient poll errors */ }
    }, 5000)
    return () => clearInterval(id)
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
          <Progress value={overallPct(progress)} className="h-1.5" />
          <span className="font-mono text-xs text-fg-subtle">
            {progress.repoCount && progress.repoCount > 1 && (
              <span className="text-accent">[{progress.repoIndex}/{progress.repoCount}] </span>
            )}
            {progress.phase === 'index'
              ? `Indexing ${progress.indexDone} / ${progress.indexTotal} files`
              : `Reading ${progress.readDone} / ${progress.readTotal} files`}
          </span>
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
