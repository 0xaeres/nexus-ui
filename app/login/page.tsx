'use client'

import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { NexusLogo } from '@/components/icons/NexusLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { H1, Muted } from '@/components/ui/typography'

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <Card variant="surface" className="w-full max-w-sm">
        <CardHeader className="gap-4">
          <NexusLogo size="md" priority />
          <H1>Sign in</H1>
          <Muted>Nexus deployment console</Muted>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="gap-2">
            <a href="/auth/login">
              <LogIn className="h-4 w-4" />
              Continue with Auth0
            </a>
          </Button>
          <Link href="/request-access" className="text-sm text-fg-muted hover:text-fg">
            Request access
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
