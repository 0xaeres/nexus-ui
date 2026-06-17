'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { useToast } from '@/components/ui/toast'
import { BrandIcon } from '@/components/icons/BrandIcon'
import { ApiError, addSource } from '@/lib/api'
import { useProduct } from '@/lib/product-context'
import { cn } from '@/lib/utils'

// Known MCP-style connector types we support out of the box. Custom is the
// escape hatch for any other MCP server (command + args go in config).
const CONNECTOR_OPTIONS: Array<{
  id: string
  name: string
  auth: 'oauth' | 'token' | 'command'
  desc: string
  fields: Array<{ key: string; placeholder: string; secret?: boolean }>
}> = [
  {
    id: 'github',
    name: 'GitHub',
    auth: 'token',
    desc: 'Product code repositories',
    fields: [
      { key: 'token', placeholder: 'ghp_...', secret: true },
      { key: 'repos', placeholder: 'https://github.com/myorg/repo, https://github.com/myorg/other' },
    ],
  },
]


export function ConnectorNew({ productId }: { productId?: string }) {
  const router = useRouter()
  const toast = useToast()
  const sp = useSearchParams()
  const { currentProductId, perms } = useProduct()
  const activeProductId = productId || currentProductId
  const base = `/p/${activeProductId}`
  const typeParam = sp?.get('type') ?? null

  const [selected, setSelected] = useState(
    () => CONNECTOR_OPTIONS.find(c => c.id === typeParam) ?? null,
  )
  const [name, setName] = useState('')
  const [config, setConfig] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !name.trim()) return
    setSubmitting(true)
    setError(null)

    // Parse comma-separated string fields into arrays for the backend.
    const parsedConfig: Record<string, unknown> = {}
    for (const field of selected.fields) {
      const raw = (config[field.key] ?? '').trim()
      if (!raw) continue
      if (raw.includes(',') || raw.includes('\n')) {
        parsedConfig[field.key] = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      } else {
        parsedConfig[field.key] = raw
      }
    }

    try {
      await addSource(activeProductId, {
        name: name.trim(),
        type: selected.id,
        config: parsedConfig,
      })
      setDone(true)
      toast({
        title: 'Source added',
        description: `${name.trim()} is ready to ingest.`,
        variant: 'success',
      })
      setTimeout(() => router.push(`${base}/sources`), 600)
    } catch (e: unknown) {
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e)
      setError(message)
      toast({ title: 'Source setup failed', description: message, variant: 'danger', duration: 7000 })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader>
        <Button asChild variant="ghost" size="sm">
          <Link href={`${base}/sources`}>
            <ChevronLeft className="h-4 w-4" />
            Sources
          </Link>
        </Button>
        <H1>Add source</H1>
      </PageHeader>

      <PageBody>
        <PageGrid>
          {/* Step 1: pick connector type */}
          <div className="col-span-12">
            <SectionLabel className="mb-3">1. Connector type</SectionLabel>
          </div>
          {CONNECTOR_OPTIONS.map(c => {
            const active = selected?.id === c.id
            return (
              <div key={c.id} className="col-span-12 md:col-span-6 lg:col-span-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(c)
                    setName(prev => prev || c.id)
                    setConfig({})
                  }}
                  className={cn(
                    'text-left transition-colors w-full h-full',
                    'rounded-lg border p-4 flex flex-col gap-2',
                    active
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-border bg-surface hover:bg-bg-active',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <BrandIcon id={c.id} className="h-4 w-4" />
                    <span className="font-mono text-base font-medium text-fg">{c.name}</span>
                    <div className="flex-1" />
                    <Badge variant="outline" className="font-mono text-xs">{c.auth}</Badge>
                  </div>
                  <Small className="text-fg-subtle">{c.desc}</Small>
                </button>
              </div>
            )
          })}

          {/* Step 2: config */}
          {selected && (
            <>
              <div className="col-span-12">
                <SectionLabel className="mb-3">2. {selected.name} configuration</SectionLabel>
              </div>
              <div className="col-span-12 md:col-span-8 lg:col-span-6">
                <form onSubmit={handleSubmit}>
                  <Card variant="surface">
                    <CardContent className="p-5 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Subtle className="font-mono uppercase tracking-wider text-xs">
                          name
                        </Subtle>
                        <Input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. github"
                          required
                        />
                      </div>
                      {selected.fields.map(field => (
                        <div key={field.key} className="flex flex-col gap-1.5">
                          <Subtle className="font-mono uppercase tracking-wider text-xs">
                            {field.key}
                          </Subtle>
                          <Input
                            type={field.secret ? 'password' : 'text'}
                            value={config[field.key] ?? ''}
                            onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            autoComplete={field.secret ? 'new-password' : 'off'}
                          />
                        </div>
                      ))}
                      {error && <Small className="text-danger font-mono">{error}</Small>}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button asChild type="button" variant="ghost" size="sm">
                        <Link href={`${base}/sources`}>Cancel</Link>
                      </Button>
                      <Button type="submit" size="sm" disabled={submitting || done}>
                        {done ? <Check className="h-4 w-4" /> : submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {done ? 'Added' : submitting ? 'Adding…' : 'Add source'}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </div>
            </>
          )}
        </PageGrid>
      </PageBody>
    </>
  )
}
