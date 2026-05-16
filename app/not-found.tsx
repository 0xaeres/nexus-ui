import Link from 'next/link'
import { Compass, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { H1, Muted } from '@/components/ui/typography'

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center flex flex-col items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-bg-active text-fg-muted flex items-center justify-center">
          <Compass className="h-8 w-8" />
        </div>
        <Badge variant="outline" className="font-mono">404 · not found</Badge>
        <div className="flex flex-col gap-2">
          <H1>This page doesn&apos;t exist</H1>
          <Muted>
            The page you&apos;re looking for may have moved or never existed. Head back to your product dashboard to get oriented.
          </Muted>
        </div>
        <Button asChild>
          <Link href="/p/forge/dashboard">
            Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
