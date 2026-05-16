'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { BrandIcon } from '@/components/icons/BrandIcon'
import { PageHeader, PageBody } from '@/components/ui/page'
import { H1, H2, H3, Muted, Subtle } from '@/components/ui/typography'
import { NEXUS_CONNECTORS } from '@/lib/data'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

type Connector = typeof NEXUS_CONNECTORS[number]

const PLACEHOLDER_URL: Record<string, string> = {
  jira: 'https://myorg.atlassian.net',
  confluence: 'https://myorg.atlassian.net/wiki',
}

const PLACEHOLDER_SCOPE: Record<string, string> = {
  jira: 'NEX, PLAT (project keys, comma-separated)',
  confluence: 'ENG, ARCH (space keys, comma-separated)',
}

export function ConnectorNew() {
  const router = useRouter()
  const sp = useSearchParams()
  const { currentProductId, perms } = useProduct()
  const base = `/p/${currentProductId}`
  const typeParam = sp?.get('type') ?? null
  const selected = typeParam ? NEXUS_CONNECTORS.find(c => c.id === typeParam) ?? null : null

  if (!perms.canManageSources) {
    return (
      <div className="flex-1 flex items-center justify-center px-10 py-8">
        <Card variant="surface" className="p-10 max-w-md text-center flex flex-col gap-3">
          <H3>Read-only access</H3>
          <Muted>Your role does not allow adding new sources to this product.</Muted>
          <Button asChild variant="outline" size="md" className="mx-auto">
            <Link href={`${base}/sources`}>Back to sources</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <PageHeader>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <H1>Add source</H1>
        <Badge variant="outline" className="font-mono">{currentProductId}</Badge>
      </PageHeader>

      <PageBody>
        {selected ? (
          <ConnectorForm connector={selected} base={base} onCancel={() => router.push(`${base}/sources/new`)} onDone={() => router.push(`${base}/sources`)} />
        ) : (
          <PickerGrid base={base} />
        )}
      </PageBody>
    </>
  )
}

function PickerGrid({ base }: { base: string }) {
  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div>
        <H2>Choose a source</H2>
        <Subtle className="font-mono block mt-1">
          Pick a connector. You will paste credentials on the next step — nothing leaves your machine.
        </Subtle>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {NEXUS_CONNECTORS.map(c => (
          <Link key={c.id} href={`${base}/sources/new?type=${c.id}`} className="group">
            <Card variant="action" className="p-5 flex flex-col gap-2.5 cursor-pointer h-full">
              <div className="flex items-center gap-2.5">
                <BrandIcon id={c.id} size={24} />
                <span className="text-base font-medium text-fg">{c.name}</span>
                <div className="flex-1" />
                <Badge variant="outline">{c.auth}</Badge>
              </div>
              <p className="text-sm text-fg-muted m-0">{c.desc}</p>
              <div className="flex items-center text-xs font-mono text-accent mt-1">
                Configure
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ConnectorForm({ connector, base, onCancel, onDone }: {
  connector: Connector
  base: string
  onCancel: () => void
  onDone: () => void
}) {
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)
  const [saving, setSaving] = useState(false)

  const isOAuth = connector.auth === 'oauth'

  const handleTest = () => {
    setTesting(true)
    setTested(false)
    setTimeout(() => {
      setTesting(false)
      setTested(true)
    }, 1100)
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(onDone, 800)
  }

  const handleOAuth = () => {
    setSaving(true)
    setTimeout(onDone, 1400)
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <Card variant="surface" className="p-5 flex items-center gap-3">
        <BrandIcon id={connector.id} size={32} />
        <div className="flex-1 min-w-0">
          <div className="text-base font-medium text-fg">{connector.name}</div>
          <div className="text-sm font-mono text-fg-subtle">{connector.desc}</div>
        </div>
        <Badge variant="outline">{connector.auth}</Badge>
      </Card>

      {isOAuth ? (
        <Card variant="surface" className="p-6 flex flex-col gap-4">
          <div className="rounded-md bg-accent/[0.06] border border-accent/25 p-4 text-sm text-fg-muted leading-relaxed">
            Nexus will open a browser window to authorize with {connector.name}. The token is stored locally and never
            leaves your machine. Required scopes: <span className="font-mono text-fg">repo</span>,{' '}
            <span className="font-mono text-fg">read:org</span>,{' '}
            <span className="font-mono text-fg">read:discussion</span>.
          </div>
          <FormRow label="Organization">
            <Input placeholder="myorg" className="h-10 text-base font-mono" />
          </FormRow>
          <FormRow label="Scope filter (optional)">
            <Input placeholder="repo:myorg/* — leave blank for all" className="h-10 text-base font-mono" />
          </FormRow>
          <Separator />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="md" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button variant="default" size="md" onClick={handleOAuth} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authorizing…
                </>
              ) : (
                <>Connect with {connector.name}</>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="surface" className="p-6 flex flex-col gap-4">
          <FormRow label="Base URL">
            <Input
              placeholder={PLACEHOLDER_URL[connector.id] ?? 'https://…'}
              className="h-10 text-base font-mono"
            />
          </FormRow>
          <FormRow label="API token">
            <Input
              type="password"
              placeholder="Paste your API token"
              className="h-10 text-base font-mono"
            />
          </FormRow>
          <FormRow label="Scope">
            <Input
              placeholder={PLACEHOLDER_SCOPE[connector.id] ?? 'ENG'}
              className="h-10 text-base font-mono"
            />
          </FormRow>
          <Separator />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={handleTest} disabled={testing || saving}>
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing…
                </>
              ) : tested ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Connected
                </>
              ) : (
                <>Test connection</>
              )}
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="md" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button variant="default" size="md" onClick={handleSave} disabled={!tested || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>Save source</>
              )}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs font-mono text-fg-subtle">
        <span>Wrong source?</span>
        <Link href={`${base}/sources/new`} className={cn('text-accent hover:text-accent-hover hover:underline')}>
          Pick a different connector
        </Link>
      </div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-wider font-medium text-fg-muted">{label}</label>
      {children}
    </div>
  )
}
