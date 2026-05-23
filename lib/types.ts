// Canonical shared types. Spec aligned per ENGINEERING.md §12.
// Cutover complete: lib/data.ts deleted; all screens consume the live FastAPI backend.

export type ProductId = string
export type UserId = string
export type UserRole = 'org_admin' | 'product_admin' | 'sme'

// Spec split (ADR-004): product skills are master + product_domain;
// tech_stack/language/security live in the org library.
export type SkillKind = 'master' | 'product_domain'
export type OrgSkillKind = 'tech_stack' | 'language' | 'security'
export type SkillScope = 'product' | 'org'

export type AgentRole =
  | 'archaeologist'
  | 'domain_expert'
  | 'synthesizer'
  | 'adversary'
  | 'security_sentinel'
  | 'curator'

export type SessionStatus = 'drafting' | 'awaiting_approval' | 'completed' | 'failed'
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'edited'
export type RejectCategory = 'factual' | 'out-of-scope' | 'duplicate' | 'other'

export interface RejectReason {
  reason: string
  category?: RejectCategory
}

export interface Correction {
  id: string
  skill_id: string
  from_revision: number
  edited_by: UserId
  edited_at: string
  diff: string
  applied_as_rule?: string | null
}

// Backend keeps the council's prompt bounded by compacting older corrections
// into a single distilled summary. Recent corrections stay raw for SME audit.
export interface DistilledRules {
  rules: string             // the condensed house-rules text injected into prompts
  from_count: number        // how many raw corrections were folded in
  last_compacted_at: string
}

export interface CorrectionsResponse {
  corrections: Correction[]            // recent, raw; capped (default ~10)
  distilled: DistilledRules | null     // older corrections, compacted; null when none yet
  total: number                        // total raw corrections ever recorded
}
export type SourceStatus = 'connected' | 'watching' | 'syncing' | 'error'
export type ActivityType = 'ingest' | 'council' | 'pr-review' | 'changelog' | 'index'

export interface Owner {
  team: string
  lead: UserId
}

export interface Product {
  id: ProductId
  name: string
  tagline: string
  owner: Owner
  onboardedAt: string
  masterSkillId: string
  sources: number
  skills: number
  lastCouncil: string | null
}

export interface User {
  id: UserId
  name: string
  role: UserRole
  products: ProductId[]
}

export interface Permissions {
  canManageSources: boolean
  canRunCouncil: boolean
  canOnboard: boolean
  isOrgAdmin: boolean
  settingsReadOnly: boolean
}

export interface AppliesTo {
  files: string[]
  contexts: string[]
}

export interface Provenance {
  council_session: string | null
  validated_by: string
  validated_at: string
  evidence_chunks: string[]
  adversary_critique: string | null
  // Per-session adversary loop cap. The orchestrator runs at most one
  // synth → adversary → re-synth pass per session, so this is 0 or 1.
  // The confidence formula relies on this being binary
  // (adversary_passes = 1.0 if 0 | 0.7 if 1).
  revision_count: 0 | 1
  // Cumulative approved revisions across all council sessions for this skill.
  // Monotonically increases on each approval; used by the priors badge.
  cumulative_revisions: number
}

export interface Skill {
  id: string
  name: string
  kind: SkillKind | OrgSkillKind
  scope: SkillScope
  product?: ProductId
  version: number
  confidence: number
  applies_to: AppliesTo
  composes_with: string[]
  provenance: Provenance
  body: string
}

export interface OrgSkill extends Omit<Skill, 'kind' | 'scope' | 'provenance'> {
  kind: OrgSkillKind
  scope: 'org'
  quality_score: number
  external_sources: string[]
  ratified_by: UserId
  ratified_at: string
}

export interface ProductSkillsResponse {
  master: Skill | null
  domain: Skill[]
  adopted: OrgSkill[]
}

export interface Citation {
  id: string | null
  file: string
  line: number
  excerpt: string
}

export interface Critique {
  severity: 'blocking' | 'major' | 'minor'
  issues: Array<{ description: string; counter_example?: string | null }>
  recommendation: string
}

export interface ProposalSection {
  heading: string
  body: string
  inherited?: boolean
}

export interface SkillProposal {
  id: string
  session_id: string | null
  product_id: ProductId
  skill_kind: string
  name: string
  body: string
  sections?: ProposalSection[]
  confidence: number
  status: ProposalStatus
  citations: Citation[]
  adversary_critique: Critique | null
  created_at: string
  approved_by: string | null
  approved_at: string | null
  reject_reason?: RejectReason | null
  deliberation: DeliberationMessage[]
  costs: AgentCost[]
}

export interface DeliberationMessage {
  agent: AgentRole | string
  timestamp: string
  body: string
  cite_ids?: string[]
}

export interface AgentCost {
  agent: AgentRole | string
  prompt_tokens: number
  completion_tokens: number
  model: string
}

export interface CouncilPriors {
  revision: number
  corrections: number
  rejections: number
}

export type CouncilTrigger = 'manual' | 'gated' | 'override'

export interface CouncilSession {
  id: string
  product_id: ProductId
  skill_kind: string
  topic: string
  proposal_id: string | null
  status: SessionStatus | string
  deliberation: DeliberationMessage[]
  costs: AgentCost[]
  priors?: CouncilPriors
  trigger?: CouncilTrigger
  started_at: string
  completed_at: string | null
}

export interface CouncilSessionSummary {
  id: string
  product_id: ProductId
  skill_kind: string
  topic: string
  proposal_id: string | null
  status: string
  started_at: string
  completed_at: string | null
}

export interface SyncDelta {
  added: number
  updated: number
  removed: number
  unchanged?: number
}

export interface Source {
  id: string
  product: ProductId
  name: string
  type: string
  status: SourceStatus | string
  lastSync: string | null
  nextSync: string | null
  lastDelta: SyncDelta | null
  resourceCount: number
  config: Record<string, unknown>
}

export interface Activity {
  id: string
  product: ProductId
  type: ActivityType | string
  title: string
  status: string
  startedAt: string
  completedAt: string | null
}

// Drives project-card state on the dashboard. Stage precedence (highest wins):
// skill > review > council > ingesting > none. `councilInProgress` is independent
// so the UI can show "Run Council" vs "Council in progress" at the council stage.
export type ProductStage = 'none' | 'ingesting' | 'council' | 'review' | 'skill'

export interface ProductStatus {
  hasEmbeddings: boolean
  hasSkill: boolean
  councilInProgress: boolean
  currentSessionId: string | null
  currentStage: ProductStage
}

export interface DashboardData {
  daemon: { state: string; lastEvent: string | null }
  pipeline: Array<{ id: string; label: string; count: number }>
  pending: Array<{
    id: string
    kind: string
    label: string
    confidence: number
  }>
  recentActivity: Activity[]
  cadence?: {
    nextSyncAt: string | null
    nextCouncilAt: string | null
    nextCouncilSkill: string | null
  }
}

// Per-session cap on evidence chunks fed to the synthesizer's prompt.
// Above this, the reranker's top-K decides which survive; the rest are
// dropped to keep the prompt bounded. Enforced backend-side; the UI
// surfaces this number on the provenance row so SMEs can see the budget.
export const EVIDENCE_CHUNKS_PER_SESSION_CAP = 20

// Static rosters per spec §6 (master = 4 agents, product_domain = 3 agents).
export const COUNCIL_ROSTERS: Record<SkillKind, AgentRole[]> = {
  master: ['archaeologist', 'domain_expert', 'synthesizer', 'adversary'],
  product_domain: ['archaeologist', 'domain_expert', 'adversary'],
}

export const COUNCIL_AGENT_LABELS: Record<AgentRole, string> = {
  archaeologist: 'Archaeologist',
  domain_expert: 'Domain Expert',
  synthesizer: 'Synthesizer',
  adversary: 'Adversary',
  security_sentinel: 'Security Sentinel',
  curator: 'Curator',
}

export const COUNCIL_AGENT_HUES: Record<AgentRole, string> = {
  archaeologist: '#E8B86B',
  domain_expert: '#7C8CFF',
  synthesizer: '#C58BFF',
  adversary: '#FF9159',
  security_sentinel: '#F26D6D',
  curator: '#4DD4AC',
}

// ---- Assistant layer (docs/ASSISTANT-LAYER.md) ---------------------------

export type ActionSystem = 'jira' | 'confluence'
export type ActionProposalStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'executed'
  | 'failed'

export interface ActionStep {
  op: string
  args: Record<string, unknown>
  summary: string
}

export interface ActionTarget {
  system: ActionSystem
  key: string
}

export interface ActionProposal {
  id: string
  conversation_id: string
  product_id: ProductId
  requested_by: string
  target: ActionTarget
  instruction: string
  plan: ActionStep[]
  preview: string
  status: ActionProposalStatus
  created_at: string
  confirmed_by: string | null
  executed_at: string | null
  result: Record<string, unknown> | null
  error: string | null
}

// A streamed assistant turn ends with this `session_end` payload.
export interface AssistantStreamFinal {
  conversation_id: string
  reply: string
  iterations: number
  action_proposal: ActionProposal | null
}

export interface AssistantIdentity {
  connected: boolean
  available: boolean
  reason?: string
  scope?: string
  expires_at?: string
  expired?: boolean
}
