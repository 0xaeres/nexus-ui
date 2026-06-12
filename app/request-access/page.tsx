'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { H1, Muted } from '@/components/ui/typography'
import { ApiError, requestAccess } from '@/lib/api'

export default function RequestAccessPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await requestAccess({ email, name, reason })
      setMessage('Access request sent.')
      setEmail('')
      setName('')
      setReason('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <Card variant="surface" className="w-full max-w-md">
        <CardHeader>
          <H1>Request access</H1>
          <Muted>Owner approval required</Muted>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Why do you need access?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {message && <p className="text-sm text-success">{message}</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={busy} className="gap-2">
              <Send className="h-4 w-4" />
              {busy ? 'Sending...' : 'Send request'}
            </Button>
            <Link href="/login" className="text-sm text-fg-muted hover:text-fg">
              Back to sign in
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
