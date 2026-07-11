'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { H1, Muted, Small } from '@/components/ui/typography'
import { ApiError, requestAccess } from '@/lib/api'
import { QUICKSTART_URL } from '@/lib/links'

function requestAccessErrorMessage(e: unknown) {
  if (e instanceof ApiError) {
    return e.status === 429 ? 'Too many requests. Please wait and try again.' : 'Request failed. Please try again.'
  }
  return 'Request failed. Please try again.'
}

export function RequestAccessScreen() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
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
      setError(requestAccessErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <Card variant="surface" className="w-full max-w-md">
        <CardHeader>
          <H1>Request access</H1>
          <Muted>
            Ask the administrator of your team&apos;s self-hosted Anvay instance to approve you.
            This is not a hosted signup — access is granted on the instance you&apos;re pointed at.
          </Muted>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <Small className="font-medium text-fg">Email address required</Small>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <Small className="font-medium text-fg">Name</Small>
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <Small className="font-medium text-fg">Reason for access</Small>
              <Textarea
                placeholder="Why do you need access?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {message && <Small className="text-success">{message}</Small>}
            {error && <Small className="text-danger">{error}</Small>}
            <Button type="submit" disabled={busy} className="gap-2">
              <Send className="h-4 w-4" />
              {busy ? 'Sending...' : 'Send request'}
            </Button>
            <Link href="/login" className="hover:text-fg">
              <Small>Back to sign in</Small>
            </Link>
            <Link href={QUICKSTART_URL} className="hover:text-fg">
              <Small>No instance yet? Deploy your own</Small>
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
