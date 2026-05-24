// Canonical shared types. All screens consume the live FastAPI backend.

export type ProductId = string
export type UserId = string
export type UserRole = 'org_admin' | 'product_admin' | 'sme'

export type AgentRole = 'drafter' | 'critic' | 'reviser'

export type SessionStatus = 'drafting' | 'awaiting_approval' | 'completed' | 'failed'
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'edited' | 'revision_requested'
export type RejectCategory = 'factual' | 'out-of-scope' | 'duplicate' | 'other'

export interface RejectReason {
  reason: string
  category?: RejectCategory
}

export interface Correction {
  proposal_id: string
  created_at: string | null
  adversary_critique: Critique
}

export interface CorrectionsResponse {
  corrections: Correction[]
  adversary_critique: string | null
}

export type SourceStatus = 'connected' | 'watching' | 'syncing' | 'error'

export interface Owner {
  team?: string
  lead?: UserId
}

export interface Product {
  id: ProductId
  name: string
  tagline: string
  owner: Owner
  onboardedAt: string
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
  // Per-session critic loop cap. The 3-node graph runs at most one
  // critic → reviser pass per session, so this is 0 or 1.
  // The confidence formula relies on this being binary
  // (critic_passes = 1.0 if 0 | 0.7 if 1).
  revision_count: 0 | 1
}

export interface Skill {
  id: string
  name: string
  product: ProductId
  version: number
  confidence: number
  applies_to: AppliesTo
  provenance: Provenance
  body: string
}

export interface ProductSkillsResponse {
  skills: Skill[]
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
  type: string
  title: string
  status: string
  startedAt: string
  completedAt: string | null
}

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
    label: string
    confidence: number
  }>
  recentActivity: Activity[]
}

// Per-session cap on evidence chunks fed to the council's prompt.
export const EVIDENCE_CHUNKS_PER_SESSION_CAP = 20

// 3-node Reflexion council (drafter -> critic -> reviser).
export const COUNCIL_ROSTER: AgentRole[] = ['drafter', 'critic', 'reviser']

export const COUNCIL_AGENT_LABELS: Record<AgentRole, string> = {
  drafter: 'Drafter',
  critic: 'Critic',
  reviser: 'Reviser',
}

export const COUNCIL_AGENT_HUES: Record<AgentRole, string> = {
  drafter: '#7C8CFF',
  critic: '#FF9159',
  reviser: '#C58BFF',
}
