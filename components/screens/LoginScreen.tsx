'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { AnvayLogo } from '@/components/icons/AnvayLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { H2, Small } from '@/components/ui/typography'
import { ApiError, login } from '@/lib/api'

function loginErrorMessage(e: unknown) {
  if (e instanceof ApiError) {
    return e.status === 401 ? 'Invalid email or password.' : 'Sign-in failed. Please try again.'
  }
  return 'Sign-in failed. Please try again.'
}

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
      setError(loginErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="anvay-auth-shell grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-[400px] rounded-xl border border-border bg-surface-sunk p-8 shadow-2xl relative overflow-hidden">
        {/* Sleek top border highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="flex h-10 items-center justify-center">
              <AnvayLogo size="sm" priority className="opacity-95" />
            </div>
            <H2 className="mt-3">Sign in to your console</H2>
            <Small>Enter your credentials to manage products</Small>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email">
                <Small className="font-medium">Email Address</Small>
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                disabled={busy}
                required
                className="h-10 px-3.5 bg-bg border-border-strong focus-visible:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="login-password">
                <Small className="font-medium">Password</Small>
              </label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={busy}
                required
                className="h-10 px-3.5 bg-bg border-border-strong focus-visible:ring-accent"
              />
            </div>

            {error && <Small className="text-danger font-medium">{error}</Small>}

            <Button
              type="submit"
              disabled={busy || !email.trim() || !password}
              className="w-full h-10 mt-2 bg-fg text-bg hover:bg-fg/90 transition-all font-medium rounded-md shadow-lg flex items-center justify-center gap-2 border border-transparent"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-bg" />
                  <span className="text-bg">Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 text-bg" />
                  <span className="text-bg">Sign in</span>
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-5 mt-2">
            <Link href="/request-access" className="hover:underline">
              <Small className="hover:text-fg transition-all">Request access</Small>
            </Link>
            <Link href="/docs" className="hover:underline">
              <Small className="hover:text-fg transition-all">Docs</Small>
            </Link>
            <Link href="/landing" className="hover:underline">
              <Small className="hover:text-fg transition-all">Product overview</Small>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
