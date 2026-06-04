'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Loader2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageBody, PageHeader, PageGrid } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import { ApiError, addSource, createProduct, syncSource } from '@/lib/api'

const GITHUB_REPO_RE = /^(https?:\/\/github\.com\/[^\s/]+\/[^\s/]+?|git@github\.com:[^\s/]+\/[^\s/]+?)(?:\.git)?\/?$/

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
  const [team, setTeam] = useState('')
  const [repoUrls, setRepoUrls] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const id = slugify(name)
  const repos = parseRepoUrls(repoUrls)
  const badRepos = repos.filter((repo) => !GITHUB_REPO_RE.test(repo))
  const repoOk = repos.length > 0 && badRepos.length === 0
  const canSubmit =
    !!name.trim() && !!token.trim() && repoOk && !!id

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      try {
        await createProduct({
          id,
          name: name.trim(),
          owner: team.trim() ? { team: team.trim() } : undefined,
        })
      } catch (e: unknown) {
        if (!(e instanceof ApiError && e.status === 409)) throw e
      }

      const ghSource = await addSource(id, {
        name: 'github',
        type: 'github',
        config: { token: token.trim(), repos },
      })
      // Fire-and-forget; the ingest page picks up the SSE stream.
      syncSource(id, ghSource.id).catch(() => {
        /* surfaced on /ingest */
      })

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
        <PageGrid>
          <div className="col-span-12 md:col-span-8 lg:col-span-6 md:col-start-3 lg:col-start-4">
            <Card variant="surface">
              <CardHeader className="gap-2">
                <H3>Tell Nexus what to ingest</H3>
                <Muted>
                  Point us at the product repositories. We&rsquo;ll clone, chunk,
                  and embed them, then the LLM Council drafts your first skill for review.
                </Muted>
              </CardHeader>

              <CardContent className="flex flex-col gap-5">
                {error && (
                  <div className="rounded-md border border-danger/30 bg-danger/5 px-4 py-2.5">
                    <Small className="font-mono text-danger">{error}</Small>
                  </div>
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

                <Field label="Business unit / team" hint="optional display label">
                  <Input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Payments Platform"
                    disabled={busy}
                  />
                </Field>

                <Field
                  label="GitHub repositories"
                  hint="one per line or comma-separated"
                  icon={GitBranch}
                >
                  <Textarea
                    value={repoUrls}
                    onChange={(e) => setRepoUrls(e.target.value)}
                    placeholder={'https://github.com/acme/api\nhttps://github.com/acme/web'}
                    disabled={busy}
                    rows={4}
                    className="min-h-[104px]"
                  />
                  {repos.length > 0 && badRepos.length > 0 && (
                    <Small className="font-mono text-danger">
                      Invalid repo URL: {badRepos[0]}
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
              </CardContent>

              <CardFooter className="flex items-center justify-between pt-0">
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
              </CardFooter>
            </Card>
          </div>
        </PageGrid>
      </PageBody>
    </>
  )
}

function parseRepoUrls(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((repo) => repo.trim())
    .filter(Boolean)
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
