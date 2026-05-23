import Link from 'next/link'
import { ArrowLeft, PackageX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { H1, Muted } from '@/components/ui/typography'

export default function ProductNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center flex flex-col items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-bg-active text-fg-muted flex items-center justify-center">
          <PackageX className="h-8 w-8" />
        </div>
        <Badge variant="outline" className="font-mono">product not found</Badge>
        <div className="flex flex-col gap-2">
          <H1>This product doesn&apos;t exist</H1>
          <Muted>
            It may have been deleted, or the URL is wrong. Head back to your product list to pick one
            or create a new one.
          </Muted>
        </div>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to products
          </Link>
        </Button>
      </div>
    </div>
  )
}
