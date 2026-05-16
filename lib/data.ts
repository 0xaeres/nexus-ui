// ─── Product-first types ────────────────────────────────────────────────────
export type ProductId = string
export type UserRole = 'org_admin' | 'product_admin' | 'sme'
export type SkillKind = 'master' | 'tech_stack' | 'language' | 'security'
export type AgentRole = 'archaeologist' | 'domain_expert' | 'stack_specialist' | 'code_semantics' | 'security' | 'synthesizer' | 'adversary'

export const NEXUS_USERS = [
  { id: 'jl', name: 'j.lambert', role: 'org_admin'     as UserRole, products: ['forge', 'atlas', 'shipd'] },
  { id: 'sv', name: 's.varma',   role: 'product_admin' as UserRole, products: ['forge'] },
  { id: 'pr', name: 'p.rao',     role: 'sme'           as UserRole, products: ['forge'] },
]
export const NEXUS_CURRENT_USER_ID = 'jl'

export const NEXUS_PRODUCTS = [
  { id: 'forge', name: 'forge', tagline: 'Sovereign agentic harness for developer workflows',  owner: { team: 'platform-infra', lead: 'j.lambert' }, onboardedAt: '2024-09-04', masterSkillId: 'm0', sources: 5, skills: 14, lastCouncil: '14m ago' },
  { id: 'atlas', name: 'atlas', tagline: 'Distributed tracing + observability platform',       owner: { team: 'observability',  lead: 's.varma'   }, onboardedAt: '2024-11-20', masterSkillId: 'm_atlas', sources: 3, skills: 6,  lastCouncil: '2d ago' },
  { id: 'shipd', name: 'shipd', tagline: 'Continuous delivery automation layer',               owner: { team: 'platform-infra', lead: 'p.rao'     }, onboardedAt: '2025-01-15', masterSkillId: 'm_shipd', sources: 4, skills: 9,  lastCouncil: '6h ago' },
]

export const COUNCIL_ROSTERS: Record<SkillKind, AgentRole[]> = {
  master:     ['archaeologist', 'domain_expert', 'synthesizer', 'adversary'],
  tech_stack: ['archaeologist', 'stack_specialist', 'adversary'],
  language:   ['archaeologist', 'code_semantics', 'adversary'],
  security:   ['archaeologist', 'security', 'adversary'],
}

export const COUNCIL_COST_ESTIMATES: Record<SkillKind, { tokens: number; usd: number; seconds: number }> = {
  master:     { tokens: 3200, usd: 0.006,  seconds: 240 },
  tech_stack: { tokens: 1400, usd: 0.002,  seconds: 90 },
  language:   { tokens: 1200, usd: 0.0015, seconds: 75 },
  security:   { tokens: 1500, usd: 0.0025, seconds: 90 },
}

export const COUNCIL_AGENT_LABELS: Record<AgentRole, string> = {
  archaeologist:    'Archaeologist',
  domain_expert:    'Domain Expert',
  stack_specialist: 'Stack Specialist',
  code_semantics:   'Code Semantics',
  security:         'Security Sentinel',
  synthesizer:      'Synthesizer',
  adversary:        'Adversary',
}

export const COUNCIL_AGENT_HUES: Record<AgentRole, string> = {
  archaeologist:    '#E8B86B',
  domain_expert:    '#7C8CFF',
  stack_specialist: '#4DD4AC',
  code_semantics:   '#C58BFF',
  security:         '#F26D6D',
  synthesizer:      '#C58BFF',
  adversary:        '#FF9159',
}

// ─── Existing data ────────────────────────────────────────────────────────────
export const NEXUS_PROJECTS = [
  { id: 'forge',  name: 'forge',  path: '~/code/forge',    files: 8421,  lastIndex: '2m ago' },
  { id: 'atlas',  name: 'atlas',  path: '~/code/atlas',    files: 2104,  lastIndex: '14m ago' },
  { id: 'shipd',  name: 'shipd',  path: '~/work/shipd',    files: 11924, lastIndex: '1h ago' },
]

export const NEXUS_DAEMON_STATUS = {
  state: 'running' as const,
  uptime: '3h 12m',
  cpu: '4.2%',
  mem: '218 MB',
  lastEvent: '8s ago',
}

export const NEXUS_PIPELINE = [
  { id: 'sources', label: 'Sources', icon: 'plug',    count: 3,      sub: 'connected',      now: 'GitHub · Jira · Confluence',                              glow: 'success' as const, screen: 'connectors' },
  { id: 'ingest',  label: 'Ingest',  icon: 'pulse',   count: '9.2k', sub: 'chunks indexed', now: 'confluence:ENG · syncing 142 pages',                      glow: 'warning' as const, active: true, screen: 'activity' },
  { id: 'council', label: 'Council', icon: 'council', count: 1,      sub: 'active session', now: 'drafting forge/tech_stack/rust/tokio-spawn-patterns',      glow: 'violet'  as const, active: true, screen: 'council' },
  { id: 'review',  label: 'Review',  icon: 'user',    count: 3,      sub: 'awaiting you',   now: 'oldest 14m · keyboard a/e/r',                              glow: 'accent'  as const, screen: 'council' },
  { id: 'skills',  label: 'Skills',  icon: 'skills',  count: 14,     sub: 'curated',        now: 'forge master · 4 capabilities',                            glow: 'success' as const, screen: 'skills' },
]

export const NEXUS_PENDING = [
  { id: 'p1', kind: 'skill',     label: 'Skills awaiting approval',     count: 3, accent: 'accent'  as const, screen: 'council' },
  { id: 'p2', kind: 'pr',        label: 'PR reviews pending',           count: 2, accent: 'warning' as const, screen: 'activity' },
  { id: 'p3', kind: 'connector', label: 'Connectors needing attention', count: 1, accent: 'high'    as const, screen: 'connectors' },
]

export const NEXUS_ACTIVITY = [
  { id: 'a1',  productId: 'forge', time: '14:22', runner: 'pr-review', trigger: 'webhook', dur: '8.2s',  status: 'done'  as const, summary: 'approved 7 / 12 hunks · 5 nits surfaced' },
  { id: 'a2',  productId: 'forge', time: '14:08', runner: 'index',     trigger: 'cron',    dur: '6.1s',  status: 'done'  as const, summary: 'jira:NEX · 18 tickets ingested · 22 chunks' },
  { id: 'a3',  productId: 'forge', time: '13:51', runner: 'index',     trigger: 'manual',  dur: '—',     status: 'error' as const, summary: 'github auth expired — re-authorize in connectors' },
  { id: 'a4',  productId: 'forge', time: '13:44', runner: 'changelog', trigger: 'cron',    dur: '2.1s',  status: 'done'  as const, summary: 'CHANGELOG.md updated · 6 entries since v0.4.1' },
  { id: 'a5',  productId: 'forge', time: '13:20', runner: 'ingest',    trigger: 'webhook', dur: '3.0s',  status: 'done'  as const, summary: 'confluence:ENG · 4 pages re-indexed' },
  { id: 'a6',  productId: 'forge', time: '12:58', runner: 'ingest',    trigger: 'cron',    dur: '14.4s', status: 'done'  as const, summary: 'incremental · 142 chunks updated' },
  { id: 'a7',  productId: 'forge', time: '12:31', runner: 'pr-review', trigger: 'webhook', dur: '6.4s',  status: 'done'  as const, summary: 'requested changes · 2 critical security flags' },
  { id: 'a8',  productId: 'forge', time: '11:50', runner: 'council',   trigger: 'manual',  dur: '4m 2s', status: 'done'  as const, summary: 'master skill drafted · confidence 0.91 · awaiting approval' },
  { id: 'a9',  productId: 'forge', time: '11:22', runner: 'changelog', trigger: 'manual',  dur: '900ms', status: 'done'  as const, summary: 'preview generated · not committed' },
  { id: 'a10', productId: 'forge', time: '10:45', runner: 'ingest',    trigger: 'cron',    dur: '380ms', status: 'done'  as const, summary: 'confluence:ENG · no new pages' },
]

export const NEXUS_AGENTS_LIVE = [
  { id: 'archaeologist', status: 'done'     as const, elapsed: '6.4s', tokens: '0.9k', note: '38 commits · 4 RFCs scanned' },
  { id: 'security',      status: 'thinking' as const, elapsed: '5.1s', tokens: '0.6k', note: 'reviewing 3 assertions' },
  { id: 'synthesizer',   status: 'thinking' as const, elapsed: '3.2s', tokens: '0.4k', note: 'drafting…' },
  { id: 'adversary',     status: 'idle'     as const, elapsed: '—',    tokens: '—',    note: 'queued · cycle 1 of 1' },
]

export const NEXUS_DELIBERATION = [
  { agent: 'archaeologist', t: '14:22:01', body: 'Scanning git history for tokio::spawn usage. 14 call-sites across 8 commits. Convention introduced in c8f1a2e (12 weeks ago).', cites: [{path:'src/runners/indexer.ts',line:142},{path:'src/runners/pr-review.ts',line:88}] },
  { agent: 'archaeologist', t: '14:22:05', body: 'PR #214 reverted an earlier std::thread::spawn approach citing back-pressure issues — see commit message + RFC. 11 of 14 sites store the JoinHandle on the owning struct; 3 are fire-and-forget inside trace-only paths.', cites: [{path:'docs/rfcs/0014-async-runner.md',line:'§2'},{path:'CHANGELOG.md',line:74},{path:'src/daemon.rs',line:201}] },
  { agent: 'security',      t: '14:22:11', body: 'No unbounded spawn loops. All fire-and-forget paths are gated by a rate limiter. One mild concern: pr-review.ts:88 does not propagate cancellation tokens — flagged as low-severity.', cites: [{path:'src/runners/pr-review.ts',line:88}], severity: 'low' as const },
  { agent: 'synthesizer',   t: '14:22:14', body: 'Drafting skill: tech_stack/rust/tokio-spawn-patterns — three rules, four citations, confidence 0.87. Materializing draft now.', isDraft: true as const },
  { agent: 'adversary',     t: '14:22:18', body: 'Pushback on rule #2 ("always store JoinHandle"). Rule is too strong — there are legitimate fire-and-forget cases. Suggest weakening to "store handle unless caller is a trace-only path".', cycle: '1 of 1', severity: 'medium' as const },
  { agent: 'synthesizer',   t: '14:22:21', body: 'Accepted Adversary cycle 1. Rule #2 weakened. Re-emitting draft. Confidence raised to 0.91.', isDraft: true as const, revision: 2 },
]

export const NEXUS_DRAFT_SKILL = {
  name: 'forge/tech_stack/rust/tokio-spawn-patterns',
  confidence: 0.91,
  appliesTo: 'src/**/*.rs',
  prerequisites: ['tech_stack/rust/error-handling'],
  rules: [
    { n: 1, text: 'Use tokio::spawn for I/O-bound work; never std::thread::spawn for runner tasks.' },
    { n: 2, text: 'Store the returned JoinHandle on the owning struct, unless the call site is a trace-only path. Trace-only paths must be gated by the central rate limiter.' },
    { n: 3, text: 'Propagate CancellationToken into any spawned task that performs I/O. Bare spawns without cancellation are forbidden in runner code.' },
  ],
  citations: [
    { id: 1, agent: 'archaeologist', path: 'src/runners/indexer.ts',           line: 142 },
    { id: 2, agent: 'archaeologist', path: 'src/runners/pr-review.ts',         line: 88  },
    { id: 3, agent: 'archaeologist', path: 'docs/rfcs/0014-async-runner.md',   line: '§2' },
    { id: 4, agent: 'security',      path: 'docs/architecture.md',             line: '§3.2' },
  ],
}

export const NEXUS_CONNECTORS = [
  { id: 'github',     name: 'GitHub',     auth: 'oauth' as const, desc: 'Code, PRs, issues, discussions' },
  { id: 'jira',       name: 'Jira',       auth: 'token' as const, desc: 'Tickets, epics, acceptance criteria' },
  { id: 'confluence', name: 'Confluence', auth: 'token' as const, desc: 'ADRs, runbooks, architecture docs' },
]

export const NEXUS_CONNECTIONS = [
  { id: 'c1', productId: 'forge', type: 'github',     name: 'myorg/forge',  state: 'connected' as const, lastSync: '2m ago',  resources: 8421, scope: 'main + 5 feature branches', progress: 100 },
  { id: 'c2', productId: 'forge', type: 'jira',       name: 'NEX project',  state: 'watching'  as const, lastSync: '14m ago', resources: 412,  scope: 'NEX-* active sprint',       progress: 100 },
  { id: 'c3', productId: 'forge', type: 'confluence', name: 'ENG space',    state: 'syncing'   as const, lastSync: 'now',     resources: 142,  scope: 'space:ENG · 218 pages',     progress: 67 },
]

export const NEXUS_CONNECTOR_RESOURCES = [
  { src: 'github.com/myorg/forge/blob/main/src/runners/indexer.ts', mime: 'text/typescript', indexed: '2m ago',  chunks: 14 },
  { src: 'github.com/myorg/forge/blob/main/src/daemon.rs',           mime: 'text/rust',       indexed: '2m ago',  chunks: 38 },
  { src: 'github.com/myorg/forge/blob/main/docs/architecture.md',    mime: 'text/markdown',   indexed: '12m ago', chunks: 9 },
  { src: 'github.com/myorg/forge/issues/214',                         mime: 'app/github-issue',indexed: '14m ago', chunks: 4 },
  { src: 'github.com/myorg/forge/pull/417',                           mime: 'app/github-pr',   indexed: '22m ago', chunks: 6 },
  { src: 'github.com/myorg/atlas/blob/main/src/lib.rs',               mime: 'text/rust',       indexed: '38m ago', chunks: 22 },
  { src: 'github.com/myorg/atlas/blob/main/CHANGELOG.md',             mime: 'text/markdown',   indexed: '38m ago', chunks: 3 },
]

export const NEXUS_SYNC_LOG = [
  { t: '14:32:01', kind: 'ok'   as const, text: 'sync start · trigger=webhook · ref=push:main' },
  { t: '14:32:02', kind: 'ok'   as const, text: 'fetched 3 changed paths from github.com/myorg/forge' },
  { t: '14:32:03', kind: 'ok'   as const, text: 'indexed github.com/myorg/forge/blob/main/src/runners/indexer.ts (14 chunks)' },
  { t: '14:32:04', kind: 'ok'   as const, text: 'indexed github.com/myorg/forge/blob/main/src/daemon.rs (38 chunks)' },
  { t: '14:32:05', kind: 'warn' as const, text: 'skipped github.com/myorg/forge/blob/main/.env.local (excluded glob)' },
  { t: '14:32:06', kind: 'ok'   as const, text: 'indexed github.com/myorg/forge/blob/main/docs/architecture.md (9 chunks)' },
  { t: '14:32:07', kind: 'ok'   as const, text: 'reranked 61 candidate chunks · jina-reranker-v2' },
  { t: '14:32:08', kind: 'ok'   as const, text: 'sync done · 61 chunks · 7.1s' },
]

export const NEXUS_MASTER_SKILL = {
  id: 'm0',
  path: 'forge',
  master: true,
  cap: 'product',
  conf: 0.96,
  glob: 'org-wide',
  prereq: 0,
  used: '12m ago',
  tagline: 'Sovereign agentic harness for developer workflows',
  about: 'Forge is a local daemon + MCP server that indexes 8 GitHub repos plus Jira, Confluence, Slack, Linear, and GitBook. It runs a 4-agent Council to draft formal Skill files capturing codebase knowledge, then exposes those skills to any MCP-compatible AI client.',
  stack: ['Rust (daemon)', 'TypeScript (runners, UI)', 'tokio (async)', 'Postgres (skills)', 'jina-embeddings-v3', 'jina-reranker-v2'],
  ownership: { team: 'platform-infra', lead: 'j.lambert', repos: 8 },
}

export const NEXUS_SKILLS = [
  { ...NEXUS_MASTER_SKILL, kind: 'master' as SkillKind, composesWith: [] as string[] },
  { id: 's1',  path: 'forge/tech_stack/rust/tokio-spawn-patterns', cap: 'tech_stack', kind: 'tech_stack' as SkillKind, conf: 0.91, glob: 'src/**/*.rs', prereq: 1, used: '2h ago',  composesWith: ['m0'] },
  { id: 's2',  path: 'forge/tech_stack/rust/error-handling',       cap: 'tech_stack', kind: 'tech_stack' as SkillKind, conf: 0.88, glob: 'src/**/*.rs', prereq: 0, used: '3h ago',  composesWith: ['m0'] },
  { id: 's3',  path: 'forge/tech_stack/rust/serde-conventions',    cap: 'tech_stack', kind: 'tech_stack' as SkillKind, conf: 0.74, glob: 'src/**/*.rs', prereq: 1, used: '2d ago',  composesWith: ['m0'] },
  { id: 's4',  path: 'forge/tech_stack/typescript/route-handlers', cap: 'tech_stack', kind: 'tech_stack' as SkillKind, conf: 0.83, glob: 'app/**/*.ts', prereq: 0, used: '1d ago',  composesWith: ['m0'] },
  { id: 's5',  path: 'forge/tech_stack/typescript/server-only',    cap: 'tech_stack', kind: 'tech_stack' as SkillKind, conf: 0.69, glob: 'app/**/*.ts', prereq: 0, used: '5h ago',  composesWith: ['m0'] },
  { id: 's6',  path: 'forge/sdlc/release/changelog-rules',         cap: 'sdlc',       kind: 'tech_stack' as SkillKind, conf: 0.95, glob: 'CHANGELOG.md',prereq: 0, used: '1h ago',  composesWith: ['m0'] },
  { id: 's7',  path: 'forge/sdlc/release/semver-policy',           cap: 'sdlc',       kind: 'tech_stack' as SkillKind, conf: 0.81, glob: 'package.json',prereq: 0, used: '4d ago',  composesWith: ['m0'] },
  { id: 's8',  path: 'forge/sdlc/ci/lint-required',                cap: 'sdlc',       kind: 'tech_stack' as SkillKind, conf: 0.92, glob: '.github/**',  prereq: 0, used: '14m ago', composesWith: ['m0'] },
  { id: 's9',  path: 'forge/security/secrets/no-hardcoded',        cap: 'security',   kind: 'security'  as SkillKind, conf: 0.97, glob: '**/*',         prereq: 0, used: '6h ago',  composesWith: ['m0'] },
  { id: 's10', path: 'forge/security/auth/session-handling',       cap: 'security',   kind: 'security'  as SkillKind, conf: 0.48, glob: 'app/auth/**',  prereq: 2, used: '1w ago',  composesWith: ['m0'] },
  { id: 's11', path: 'forge/security/sandbox/skill-runtime',       cap: 'security',   kind: 'security'  as SkillKind, conf: 0.79, glob: 'src/skill/**', prereq: 1, used: '3h ago',  composesWith: ['m0'] },
  { id: 's12', path: 'forge/docs/anchor-stability',                cap: 'docs',       kind: 'tech_stack' as SkillKind, conf: 0.86, glob: 'docs/**/*.md', prereq: 0, used: '8h ago',  composesWith: ['m0'] },
  { id: 's13', path: 'forge/docs/code-block-anchors',              cap: 'docs',       kind: 'tech_stack' as SkillKind, conf: 0.71, glob: 'docs/**/*.md', prereq: 1, used: '3d ago',  composesWith: ['m0'] },
  { id: 's14', path: 'forge/docs/example-currency',                cap: 'docs',       kind: 'tech_stack' as SkillKind, conf: 0.55, glob: 'docs/**/*.md', prereq: 0, used: '1w ago',  composesWith: ['m0'] },
]

export const NEXUS_DEFAULT_MODEL_ASSIGNMENTS = [
  { role: 'Council Agents', desc: 'Archaeologist, Security Sentinel', provider: 'deepinfra', model: 'deepseek-ai/DeepSeek-V3',      unit: 'session' },
  { role: 'Synthesizer',    desc: 'Draft writer',                     provider: 'deepinfra', model: 'deepseek-ai/DeepSeek-V3',      unit: 'session' },
  { role: 'Adversary',      desc: 'Critic',                           provider: 'deepinfra', model: 'Qwen/Qwen2.5-72B-Instruct',    unit: 'session' },
  { role: 'Task Runners',   desc: 'PR review, changelog, index',      provider: 'deepinfra', model: 'Qwen/Qwen2.5-Coder-32B',       unit: 'run' },
  { role: 'Light Tasks',    desc: 'Title, summary, tag',              provider: 'deepinfra', model: 'meta-llama/Meta-Llama-3.1-8B', unit: 'call' },
]

export const NEXUS_LOCAL_MODELS = [
  { id: 'embed',    label: 'Embeddings', model: 'jina-embeddings-v3', note: 'always local · 1024d' },
  { id: 'reranker', label: 'Reranker',   model: 'jina-reranker-v2',   note: 'always local · cross-encoder' },
]
