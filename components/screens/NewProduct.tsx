'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Loader2, GitBranch, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageBody, PageHeader } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { ApiError, addSource, createProduct, syncSource } from '@/lib/api'

const GITHUB_REPO_RE = /^https?:\/\/github\.com\/[^\s/]+\/[^\s/]+?(?:\.git)?\/?$/

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function NewProduct() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [token, setToken] = useState('')
  const [confluenceSpace, setConfluenceSpace] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const id = slugify(name)
  const repoOk = !repoUrl || GITHUB_REPO_RE.test(repoUrl.trim())
  const canSubmit =
    !!name.trim() && !!repoUrl.trim() && !!token.trim() && repoOk && !!id

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      try {
        await createProduct({ id, name: name.trim() })
      } catch (e: unknown) {
        if (!(e instanceof ApiError && e.status === 409)) throw e
      }

      const ghSource = await addSource(id, {
        name: 'github',
        type: 'github',
        config: { token: token.trim(), repos: [repoUrl.trim()] },
      })
      // Fire-and-forget; the ingest page picks up the SSE stream.
      syncSource(id, ghSource.id).catch(() => {
        /* surfaced on /ingest */
      })

      const space = confluenceSpace.trim()
      if (space) {
        const confSource = await addSource(id, {
          name: 'confluence',
          type: 'confluence',
          config: { space },
        }).catch(() => null)
        if (confSource) {
          syncSource(id, confSource.id).catch(() => {
            /* surfaced on /ingest */
          })
        }
      }

      router.push(`/p/${id}/ingest`)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Products
          </Link>
        </Button>
        <H1>New product</H1>
        <div className="flex-1" />
      </PageHeader>

      <PageBody>
        <Card variant="surface" className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <H3>Tell Nexus what to ingest</H3>
            <Muted>
              Point us at a repository. We&rsquo;ll clone, chunk, enrich, and embed it,
              then the LLM Council drafts your first skill for review.
            </Muted>
          </div>

          {error && (
            <Card variant="surface" className="border-danger/30 bg-danger/5 px-4 py-2.5">
              <Small className="font-mono text-danger">{error}</Small>
            </Card>
          )}

          <Field label="Product name" hint={id ? `id · ${id}` : 'used as the URL slug'}>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Forge"
              disabled={busy}
            />
          </Field>

          <Field
            label="GitHub repository"
            hint="The main repo for this product"
            icon={GitBranch}
          >
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/acme/forge"
              disabled={busy}
            />
            {!repoOk && (
              <Small className="font-mono text-danger">
                Must look like https://github.com/&lt;org&gt;/&lt;repo&gt;
              </Small>
            )}
          </Field>

          <Field label="GitHub token" hint="One-time setup per product. Stored encrypted.">
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              disabled={busy}
            />
          </Field>

          <Field
            label="Confluence space"
            hint="Optional. Add Jira and others later from Sources."
            icon={FileText}
          >
            <Input
              value={confluenceSpace}
              onChange={(e) => setConfluenceSpace(e.target.value)}
              placeholder="ENG"
              disabled={busy}
            />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <Subtle className="font-mono">
              Next: live ingest progress, then council kickoff.
            </Subtle>
            <Button onClick={submit} disabled={!canSubmit || busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Create product
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </PageBody>
    </>
  )
}

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string
  hint?: string
  icon?: typeof GitBranch
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </SectionLabel>
        {hint && <Subtle className="font-mono text-xs">{hint}</Subtle>}
      </div>
      {children}
    </div>
  )
}
