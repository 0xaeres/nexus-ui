import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H3, Small } from '@/components/ui/typography'

export default function OrgSettingsPage() {
  return (
    <>
      <PageHeader>
        <H1>Org settings</H1>
        <Badge variant="outline" className="font-mono">organization-wide</Badge>
      </PageHeader>
      <PageBody className="max-w-3xl">
        <Card variant="surface" className="p-8 flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-bg-active flex items-center justify-center">
            <Lock className="h-5 w-5 text-fg-subtle" />
          </div>
          <H3>Org settings — coming soon</H3>
          <Small className="max-w-md">
            Billing, org-wide model defaults, and admin management will appear here.
          </Small>
        </Card>
      </PageBody>
    </>
  )
}
