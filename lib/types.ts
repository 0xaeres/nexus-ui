// Canonical shared types. All screens consume the live FastAPI backend.

export type ProductId = string
export type UserId = string
export type UserRole = 'admin' | 'editor' | 'viewer'
export type ProductRole = 'owner' | 'editor' | 'viewer'

export type AgentRole =
  | 'planner'
  | 'architect'
  | 'domain_expert'
  | 'quality_expert'
  | 'synthesizer'
  | 'repair'
  | 'skill-eval'
  | 'finalizer'

export type SessionStatus = 'drafting' | 'awaiting_approval' | 'completed' | 'failed' | 'stopped'
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'edited' | 'revision_requested'
export type EvalStatus = 'not_run' | 'passed' | 'failed' | 'repaired'
export type RejectCategory = 'factual' | 'out-of-scope' | 'duplicate' | 'other'
export type SkillTier =
  | 'product_master'
  | 'application'
  | 'domain'
  | 'interface'
  | 'tech_stack'
  | 'quality_security'

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

export interface DeleteProductReport {
  product_id: ProductId
  registry: Record<string, number>
  queue: Record<string, number | string[]>
  skills: number
  index: Record<string, number>
  graph_deleted: boolean
  repomap_deleted: boolean
  checkpoints: number
}

export interface User {
  id: UserId
  name?: string
  email?: string
  role: UserRole
  status?: string
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

export interface SkillCoverage {
  repos: string[]
  applications: string[]
  topics: string[]
}

export interface Provenance {
  council_session: string | null
  validated_by: string
  validated_at: string
  evidence_chunks: string[]
  adversary_critique: string | null
  // Kept for older approved skills that recorded repair/revision state.
  revision_count: 0 | 1
}

export interface Skill {
  id: string
  name: string
  description: string
  product: ProductId
  version: number
  tier: SkillTier
  parent: string | null
  related: string[]
  coverage: SkillCoverage
  confidence: number
  eval_status: EvalStatus
  eval_summary: string
  eval_failures: string[]
  quality_score: number
  signals_used: string[]
  applies_to: AppliesTo
  provenance: Provenance
  body: string
}

export interface ProductSkillsResponse {
  skills: Skill[]
  grouped: Partial<Record<SkillTier, Skill[]>>
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
  description: string
  tier: SkillTier
  parent: string | null
  related: string[]
  coverage: SkillCoverage
  body: string
  sections?: ProposalSection[]
  confidence: number
  status: ProposalStatus
  citations: Citation[]
  eval_status: EvalStatus
  eval_summary: string
  eval_failures: string[]
  quality_score: number
  signals_used: string[]
  adversary_critique: Critique | null
  created_at: string
  approved_by: string | null
  approved_at: string | null
  reject_reason?: RejectReason | null
  deliberation: DeliberationMessage[]
  costs: AgentCost[]
}

export interface SkillSignal {
  id: string
  product_id: ProductId
  source_type: string
  skill_name: string | null
  proposal_id: string | null
  session_id: string | null
  text: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface SkillEvalResult {
  id?: string
  run_id?: string
  session_id?: string
  product_id?: ProductId
  proposal_id?: string | null
  skill_name: string
  status: EvalStatus
  summary: string
  failures: string[]
  quality_score: number
  attempts: number
  signals_used: string[]
  created_at?: string
}

export interface SkillQualityResponse {
  skill_id: string
  latest_eval: SkillEvalResult | null
  eval_results: SkillEvalResult[]
  signals: SkillSignal[]
  regeneration_recommended: boolean
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
  proposal_ids: string[]
  status: SessionStatus | string
  deliberation: DeliberationMessage[]
  eval_results?: SkillEvalResult[]
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
  proposal_ids: string[]
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

export interface GraphRAGMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface GraphContextEntity {
  stable_id: string
  labels: string[]
  name: string
  resource_uri: string | null
  start_line: number | null
  end_line: number | null
  confidence: number
}

export interface GraphRAGCitation {
  id: string
  anchor: string
  source: string
  context_path: string | null
  graph_node_ids: string[]
  excerpt: string
}

export interface GraphRAGPath {
  seed_id: string
  seed_name: string
  node_ids: string[]
  edge_ids: string[]
  relationship_types: string[]
  source_anchors: string[]
  node_count: number
  edge_count: number
  summary: string
  confidence: number
}

export interface GraphRAGAnswer {
  product_id: ProductId
  query: string
  answer: string
  citations: GraphRAGCitation[]
  graph_paths: GraphRAGPath[]
  resolved_entities: GraphContextEntity[]
  confidence: number
  graph_available: boolean
  graph_used: boolean
  graph_relationships_used: boolean
  graph_entity_count: number
  graph_relationship_count: number
  graph_diagnostics: string[]
  reranked: boolean
  needs_clarification: boolean
  clarification_options: GraphContextEntity[]
  unknowns: string[]
}

// Per-session cap on evidence chunks fed to the council's prompt.
export const EVIDENCE_CHUNKS_PER_SESSION_CAP = 20

// Fallback display roster for council events that still use legacy role names.
export const COUNCIL_ROSTER: AgentRole[] = [
  'planner',
  'architect',
  'domain_expert',
  'quality_expert',
  'synthesizer',
  'repair',
  'skill-eval',
  'finalizer',
]

export const COUNCIL_AGENT_LABELS: Record<AgentRole, string> = {
  planner: 'Planner',
  architect: 'Architect',
  domain_expert: 'Domain expert',
  quality_expert: 'Quality expert',
  synthesizer: 'Synthesizer',
  repair: 'Repair',
  'skill-eval': 'Skill eval',
  finalizer: 'Finalizer',
}

export const COUNCIL_AGENT_HUES: Record<AgentRole, string> = {
  planner: '#40D389',
  architect: '#E8B86B',
  domain_expert: '#FF9159',
  quality_expert: '#F26D6D',
  synthesizer: '#3FB6A8',
  repair: '#8AB4FF',
  'skill-eval': '#D7A72F',
  finalizer: '#4EBA6F',
}
