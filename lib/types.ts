// Canonical shared types. Spec aligned per ENGINEERING.md §12.
// Mock-only types (NEXUS_*) still live in data.ts during the screen-by-screen cutover.

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
  revision_count: 0 | 1
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

export interface SkillProposal {
  id: string
  session_id: string | null
  product_id: ProductId
  skill_kind: string
  name: string
  body: string
  confidence: number
  status: ProposalStatus
  citations: Citation[]
  adversary_critique: Critique | null
  created_at: string
  approved_by: string | null
  approved_at: string | null
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

export interface CouncilSession {
  id: string
  product_id: ProductId
  skill_kind: string
  topic: string
  proposal_id: string | null
  status: SessionStatus | string
  deliberation: DeliberationMessage[]
  costs: AgentCost[]
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

export interface Source {
  id: string
  product: ProductId
  name: string
  type: string
  status: SourceStatus | string
  lastSync: string | null
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
}

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
