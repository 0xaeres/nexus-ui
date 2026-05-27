'use client'

import { useEffect, useRef, useState } from 'react'

export interface SseEvent<T = unknown> {
  event: string
  data: T
  id?: string
  raw: string
}

export interface UseEventStreamOptions {
  /** Cap the in-memory event buffer. Default 1024. */
  bufferSize?: number
  /** If false, the hook will not connect. Useful for conditional sessions. */
  enabled?: boolean
  /** Called once per parsed event. */
  onEvent?: (e: SseEvent) => void
}

export interface UseEventStreamResult {
  events: SseEvent[]
  status: 'idle' | 'connecting' | 'open' | 'closed' | 'error'
  error: Error | null
}

/**
 * Single-purpose SSE consumer. Replaces all setTimeout-based fakes in the UI.
 * Server pushes named events (event: message | cost | proposal | …); we parse
 * `data:` as JSON best-effort and keep the raw string as a fallback.
 */
export function useEventStream(
  url: string | null,
  options: UseEventStreamOptions = {},
): UseEventStreamResult {
  const { bufferSize = 1024, enabled = true, onEvent } = options
  const [events, setEvents] = useState<SseEvent[]>([])
  const [status, setStatus] =
    useState<UseEventStreamResult['status']>('idle')
  const [error, setError] = useState<Error | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled || !url) {
      setStatus('idle')
      return
    }
    setStatus('connecting')
    setEvents([])
    setError(null)

    const source = new EventSource(url)
    let cancelled = false

    source.onopen = () => {
      if (!cancelled) setStatus('open')
    }

    source.onerror = (e) => {
      if (cancelled) return
      // EventSource auto-reconnects on transient errors; surface terminal state
      // only when the connection is permanently closed.
      if (source.readyState === EventSource.CLOSED) {
        setStatus('closed')
        setError(new Error('SSE connection closed'))
      } else {
        setStatus('error')
      }
    }

    const handle = (evt: MessageEvent, name: string) => {
      let parsed: unknown = evt.data
      try {
        parsed = JSON.parse(evt.data)
      } catch {
        /* keep as string */
      }
      const sse: SseEvent = {
        event: name,
        data: parsed,
        id: evt.lastEventId || undefined,
        raw: evt.data,
      }
      setEvents((prev) => {
        const next = [...prev, sse]
        return next.length > bufferSize ? next.slice(-bufferSize) : next
      })
      onEventRef.current?.(sse)
      if (name === 'session_end') {
        source.close()
        setStatus('closed')
      }
    }

    // Named events used by /council/sessions/{sid}/stream and
    // /products/{p}/sources/{s}/log (sync log emits `delta` as its terminal event).
    const KNOWN_EVENTS = [
      'session_start',
      'message',
      'cost',
      'critique',
      'proposal_preview',
      'proposal',
      'notice',
      'error',
      'session_end',
      'delta',
    ]
    KNOWN_EVENTS.forEach((name) => {
      source.addEventListener(name, (e) => handle(e as MessageEvent, name))
    })
    // Default channel (data-only events with no `event:` header)
    source.onmessage = (e) => handle(e, 'message')

    return () => {
      cancelled = true
      source.close()
    }
  }, [url, enabled, bufferSize])

  return { events, status, error }
}
