'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, GitBranch, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader, PageBody, PageGrid } from '@/components/ui/page'
import { H1, H3, Muted, SectionLabel, Small, Subtle } from '@/components/ui/typography'
import {
  ApiError,
  setupSkillsRepoCreate,
  setupSkillsRepoExisting,
  type SetupSkillsRepoResult,
} from '@/lib/api'

type Mode = 'pick' | 'create' | 'existing' | 'done'

/**
 * First-run wizard: configures the org-wide skills_repo.
 * Two paths — create a new GitHub repo for the org, or attach to an existing one.
 * On success Nexus verifies it can clone the repo, stores the URL, and routes
 * to the product dashboard. Skill files are written later after approval.
 */
export function Setup() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('pick')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SetupSkillsRepoResult | null>(null)

  // create-mode fields
  const [org, setOrg] = useState('')
  const [repoName, setRepoName] = useState('nexus-skills')

  // existing-mode fields
  const [existingUrl, setExistingUrl] = useState('')

  const runCreate = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await setupSkillsRepoCreate({
        github_org: org.trim() || undefined,
        repo_name: repoName.trim() || 'nexus-skills',
      })
      setResult(r)
      setMode('done')
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const runExisting = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await setupSkillsRepoExisting(existingUrl.trim())
      setResult(r)
      setMode('done')
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <H1>Set up your skills repository</H1>
      </PageHeader>

      <PageBody>
        <PageGrid>
          <div className="col-span-12 md:col-span-10 md:col-start-2 lg:col-span-8 lg:col-start-3">
            <Muted>
              One Git repo per org holds approved product skills under their own
              directory. Nexus starts empty and writes skills only after review.
            </Muted>
          </div>

          {error && (
            <div className="col-span-12 md:col-span-10 md:col-start-2 lg:col-span-8 lg:col-start-3 rounded-md border border-danger/40 bg-danger/10 px-4 py-3">
              <Small className="font-mono text-danger">{error}</Small>
            </div>
          )}

          {mode === 'pick' && (
            <>
              <div className="col-span-12 md:col-span-5 md:col-start-2 lg:col-span-4 lg:col-start-3">
                <Card
                  variant="action"
                  className="h-full cursor-pointer"
                  onClick={() => setMode('create')}
                >
                  <CardContent className="flex h-full flex-col gap-3">
                    <Plus className="h-5 w-5 text-accent" />
                    <div className="space-y-1.5">
                      <H3>Create a new repo</H3>
                      <Muted className="block">
                        Nexus creates the org-wide skills repo and verifies clone access.
                        Requires <code>NEXUS_SKILLS_REPO_TOKEN</code> in env.
                      </Muted>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-12 md:col-span-5 lg:col-span-4">
                <Card
                  variant="action"
                  className="h-full cursor-pointer"
                  onClick={() => setMode('existing')}
                >
                  <CardContent className="flex h-full flex-col gap-3">
                    <GitBranch className="h-5 w-5 text-accent" />
                    <div className="space-y-1.5">
                      <H3>Use an existing repo</H3>
                      <Muted className="block">
                        Point Nexus at a repo you already have. Nexus verifies clone access
                        and leaves existing contents untouched.
                      </Muted>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {mode === 'create' && (
            <div className="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4">
              <CreateForm
                org={org}
                setOrg={setOrg}
                repoName={repoName}
                setRepoName={setRepoName}
                busy={busy}
                onBack={() => setMode('pick')}
                onSubmit={runCreate}
              />
            </div>
          )}

          {mode === 'existing' && (
            <div className="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4">
              <ExistingForm
                url={existingUrl}
                setUrl={setExistingUrl}
                busy={busy}
                onBack={() => setMode('pick')}
                onSubmit={runExisting}
              />
            </div>
          )}

          {mode === 'done' && result && (
            <div className="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4">
              <DoneCard result={result} onContinue={() => router.push('/')} />
            </div>
          )}
        </PageGrid>
      </PageBody>
    </div>
  )
}

function CreateForm(props: {
  org: string
  setOrg: (v: string) => void
  repoName: string
  setRepoName: (v: string) => void
  busy: boolean
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <Card variant="surface">
      <CardHeader>
        <H3>Create a skills repository</H3>
        <Muted>Nexus will create a private GitHub repo and verify clone access.</Muted>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Field label="GitHub org (optional)">
          <Input
            value={props.org}
            onChange={(e) => props.setOrg(e.target.value)}
            placeholder="leave blank to create under your user account"
            disabled={props.busy}
          />
          <Small className="block text-fg-subtle">
            Use the skills-repo PAT, not a product source token. It needs{' '}
            <code>repo</code> + (if creating in an org) <code>write:org</code>.
          </Small>
        </Field>
        <Field label="Repo name">
          <Input
            value={props.repoName}
            onChange={(e) => props.setRepoName(e.target.value)}
            placeholder="nexus-skills"
            disabled={props.busy}
          />
        </Field>
      </CardContent>
      <CardFooter className="flex-col items-stretch justify-between gap-3 border-t border-border p-5 sm:flex-row sm:items-center">
        <Button variant="ghost" onClick={props.onBack} disabled={props.busy}>
          Back
        </Button>
        <Button onClick={props.onSubmit} disabled={props.busy || !props.repoName.trim()}>
          {props.busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating + verifying…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Create repo <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

function ExistingForm(props: {
  url: string
  setUrl: (v: string) => void
  busy: boolean
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <Card variant="surface">
      <CardHeader>
        <H3>Attach an existing repository</H3>
        <Muted>Nexus verifies clone access and leaves existing files untouched.</Muted>
      </CardHeader>
      <CardContent>
        <Field label="Repo URL">
          <Input
            value={props.url}
            onChange={(e) => props.setUrl(e.target.value)}
            placeholder="https://github.com/myorg/nexus-skills.git"
            disabled={props.busy}
          />
          <Small className="block text-fg-subtle">
            HTTPS recommended — Nexus uses <code>NEXUS_SKILLS_REPO_TOKEN</code> for
            skills-repo auth. Product source tokens are configured later.
          </Small>
        </Field>
      </CardContent>
      <CardFooter className="flex-col items-stretch justify-between gap-3 border-t border-border p-5 sm:flex-row sm:items-center">
        <Button variant="ghost" onClick={props.onBack} disabled={props.busy}>
          Back
        </Button>
        <Button onClick={props.onSubmit} disabled={props.busy || !props.url.trim()}>
          {props.busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying clone…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Attach repo <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

function DoneCard(props: { result: SetupSkillsRepoResult; onContinue: () => void }) {
  const { result } = props
  return (
    <Card variant="surface">
      <CardHeader>
        <H3>Skills repository configured</H3>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <dt className="text-fg-subtle">Repo URL</dt>
          <dd className="min-w-0 break-all font-mono text-sm text-fg">{result.skills_repo_url}</dd>
          <dt className="text-fg-subtle">Initial files added</dt>
          <dd>{result.files_seeded}</dd>
          {result.commit_sha && (
            <>
              <dt className="text-fg-subtle">Initial commit</dt>
              <dd className="font-mono">{result.commit_sha.slice(0, 12)}</dd>
            </>
          )}
          <dt className="text-fg-subtle">Created repo</dt>
          <dd>{result.created_repo ? 'yes' : 'no — attached to existing'}</dd>
        </dl>
      </CardContent>
      <CardFooter className="justify-end border-t border-border p-5">
        <Button onClick={props.onContinue}>
          <span className="inline-flex items-center gap-2">
            Continue to product setup <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </CardFooter>
    </Card>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>{label}</SectionLabel>
        {hint && <Subtle className="font-mono text-xs">{hint}</Subtle>}
      </div>
      {children}
    </div>
  )
}
