'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { NexusLogo } from '@/components/icons/NexusLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { H1, Muted, Small } from '@/components/ui/typography'
import { ApiError, login } from '@/lib/api'

export function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await login({ email, password })
      router.replace('/')
      router.refresh()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <Card variant="surface" className="w-full max-w-sm">
        <CardHeader className="gap-4">
          <NexusLogo size="md" priority />
          <H1>Sign in</H1>
          <Muted>Nexus deployment console</Muted>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email"
              disabled={busy}
              required
            />
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password"
              disabled={busy}
              required
            />
            {error && <Small className="text-danger">{error}</Small>}
            <Button type="submit" disabled={busy || !email.trim() || !password}>
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </span>
              )}
            </Button>
          </form>
          <Link href="/request-access" className="text-sm text-fg-muted hover:text-fg">
            Request access
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
