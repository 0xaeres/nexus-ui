'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { H1, Muted } from '@/components/ui/typography'

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[nexus] route error', error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center flex flex-col items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-danger/15 text-danger flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <Badge variant="danger" className="font-mono">runtime error</Badge>
        <div className="flex flex-col gap-2">
          <H1>Something went wrong</H1>
          <Muted>
            An unexpected error happened while rendering this page. You can try again, or head back to a known-good screen.
          </Muted>
          {error.digest && (
            <code className="text-xs text-fg-subtle font-mono mt-1">digest: {error.digest}</code>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={reset} variant="secondary">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
          <Button asChild>
            <Link href="/">Back to products</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
