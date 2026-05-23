'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, GitBranch, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page'
import { H1, H2, Muted, SectionLabel, Small } from '@/components/ui/typography'
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
 * On success Nexus seeds `shared/` with the bundled starter pack (13 skills)
 * so the org boots with sensible defaults, then routes to /onboarding.
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
    <div className="flex flex-col h-full overflow-y-auto">
      <PageHeader>
        <H1>Set up your skills repository</H1>
        <Muted>
          One Git repo per org holds all product skills under their own directory and
          shared standards under <code>shared/</code>. This is a one-time setup.
        </Muted>
      </PageHeader>

      <div className="px-8 pb-12 max-w-2xl">
        {error && (
          <div className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {mode === 'pick' && <PickPath onSelect={setMode} />}

        {mode === 'create' && (
          <CreateForm
            org={org}
            setOrg={setOrg}
            repoName={repoName}
            setRepoName={setRepoName}
            busy={busy}
            onBack={() => setMode('pick')}
            onSubmit={runCreate}
          />
        )}

        {mode === 'existing' && (
          <ExistingForm
            url={existingUrl}
            setUrl={setExistingUrl}
            busy={busy}
            onBack={() => setMode('pick')}
            onSubmit={runExisting}
          />
        )}

        {mode === 'done' && result && (
          <DoneCard result={result} onContinue={() => router.push('/')} />
        )}
      </div>
    </div>
  )
}

function PickPath({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card
        variant="action"
        className="p-5 cursor-pointer"
        onClick={() => onSelect('create')}
      >
        <Plus className="h-5 w-5 mb-3 text-accent" />
        <H2>Create a new repo</H2>
        <Muted className="mt-1">
          Nexus creates a private GitHub repo and seeds it with the starter pack
          (13 curated shared skills). Requires <code>GITHUB_TOKEN</code> in env.
        </Muted>
      </Card>
      <Card
        variant="action"
        className="p-5 cursor-pointer"
        onClick={() => onSelect('existing')}
      >
        <GitBranch className="h-5 w-5 mb-3 text-accent" />
        <H2>Use an existing repo</H2>
        <Muted className="mt-1">
          Point Nexus at a repo you already have. Starter pack will be added to
          <code>shared/</code> only if it&apos;s missing.
        </Muted>
      </Card>
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
    <Card variant="surface" className="p-6 space-y-4">
      <div>
        <SectionLabel>GitHub org (optional)</SectionLabel>
        <Input
          value={props.org}
          onChange={(e) => props.setOrg(e.target.value)}
          placeholder="leave blank to create under your user account"
          disabled={props.busy}
        />
        <Small className="text-fg-subtle mt-1 block">
          The PAT must have <code>repo</code> + (if creating in an org) <code>write:org</code>.
        </Small>
      </div>
      <div>
        <SectionLabel>Repo name</SectionLabel>
        <Input
          value={props.repoName}
          onChange={(e) => props.setRepoName(e.target.value)}
          placeholder="nexus-skills"
          disabled={props.busy}
        />
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={props.onBack} disabled={props.busy}>
          Back
        </Button>
        <Button onClick={props.onSubmit} disabled={props.busy || !props.repoName.trim()}>
          {props.busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Creating + seeding…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Create repo <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
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
    <Card variant="surface" className="p-6 space-y-4">
      <div>
        <SectionLabel>Repo URL</SectionLabel>
        <Input
          value={props.url}
          onChange={(e) => props.setUrl(e.target.value)}
          placeholder="https://github.com/myorg/nexus-skills.git"
          disabled={props.busy}
        />
        <Small className="text-fg-subtle mt-1 block">
          HTTPS recommended — Nexus uses <code>GITHUB_TOKEN</code> for auth. SSH URLs
          work too if the host has matching keys.
        </Small>
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={props.onBack} disabled={props.busy}>
          Back
        </Button>
        <Button onClick={props.onSubmit} disabled={props.busy || !props.url.trim()}>
          {props.busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cloning + seeding…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Attach repo <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </Card>
  )
}

function DoneCard(props: { result: SetupSkillsRepoResult; onContinue: () => void }) {
  const { result } = props
  return (
    <Card variant="surface" className="p-6 space-y-4">
      <H2>Skills repository configured</H2>
      <dl className="text-sm grid grid-cols-[10rem_1fr] gap-y-2">
        <dt className="text-fg-subtle">Repo URL</dt>
        <dd className="font-mono break-all">{result.skills_repo_url}</dd>
        <dt className="text-fg-subtle">Starter skills seeded</dt>
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
      <div className="flex justify-end pt-2">
        <Button onClick={props.onContinue}>
          <span className="inline-flex items-center gap-2">
            Continue to product setup <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </div>
    </Card>
  )
}

