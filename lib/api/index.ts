/**
 * Typed accessors mapped to FastAPI routes (ENGINEERING.md §11).
 * One function per endpoint; no business logic.
 */

import type {
  ActionProposal,
  Activity,
  AssistantIdentity,
  AssistantStreamFinal,
  CorrectionsResponse,
  CouncilSession,
  CouncilSessionSummary,
  DashboardData,
  OrgSkill,
  Permissions,
  Product,
  ProductSkillsResponse,
  ProductStatus,
  RejectCategory,
  Skill,
  SkillProposal,
  Source,
  SyncDelta,
  User,
} from '../types'
import { api, ApiError } from './client'

export { ApiError }

// ---- /me + /products -----------------------------------------------------

export interface MeResponse {
  user: User
  permissions: Permissions
}

export const getMe = () => api.get<MeResponse>('/me')
export const listProducts = () =>
  api.get<{ products: Product[] }>('/products').then((r) => r.products)
export const getProduct = (id: string) => api.get<Product>(`/products/${id}`)

export const getProductStatus = (id: string) =>
  api.get<ProductStatus>(`/products/${id}/status`)

export const createProduct = (body: {
  id: string
  name: string
  tagline?: string
  owner?: { team: string; lead: string }
}) => api.post<Product>('/products', body)

export interface ProductSettings {
  product: Product
  members: User[]
  models: Record<string, { provider: string; model: string; url?: string | null; base_url?: string | null }>
}

export const getProductSettings = (productId: string) =>
  api.get<ProductSettings>(`/products/${productId}/settings`)

export interface OrgSettings {
  admins: User[]
  members: User[]
  billing: { placeholder: boolean }
}

export const getOrgSettings = () => api.get<OrgSettings>('/settings/org')

// ---- dashboard -----------------------------------------------------------

export const getDashboard = (productId: string) =>
  api.get<DashboardData>(`/products/${productId}/dashboard`)

// ---- skills --------------------------------------------------------------

export const listProductSkills = (productId: string) =>
  api.get<ProductSkillsResponse>(`/products/${productId}/skills`)

export const getSkill = (skillId: string) =>
  api.get<Skill | OrgSkill>(`/skills/${encodeURIComponent(skillId)}`)

export const listSkillCorrections = (skillId: string) =>
  api.get<CorrectionsResponse>(`/skills/${encodeURIComponent(skillId)}/corrections`)

export const listSkillRejections = (skillId: string) =>
  api
    .get<{ rejections: SkillProposal[] }>(
      `/skills/${encodeURIComponent(skillId)}/rejections`,
    )
    .then((r) => r.rejections)

export const listSkillCouncilHistory = (skillId: string) =>
  api
    .get<{ sessions: CouncilSessionSummary[] }>(
      `/skills/${encodeURIComponent(skillId)}/council-history`,
    )
    .then((r) => r.sessions)

// ---- sources -------------------------------------------------------------

export const listSources = (productId: string) =>
  api.get<{ sources: Source[] }>(`/products/${productId}/sources`).then((r) => r.sources)

export const getSource = (productId: string, sourceId: string) =>
  api.get<Source>(`/products/${productId}/sources/${sourceId}`)

export const addSource = (
  productId: string,
  body: { name: string; type: string; config?: Record<string, unknown> },
) => api.post<Source>(`/products/${productId}/sources`, body)

export const deleteSource = (productId: string, sourceId: string) =>
  api.del<{ ok: boolean }>(`/products/${productId}/sources/${sourceId}`)

export const syncSource = (productId: string, sourceId: string) =>
  api.post<{ ok: boolean; delta?: SyncDelta }>(
    `/products/${productId}/sources/${sourceId}/sync`,
    {},
  )

export const sourceLogUrl = (productId: string, sourceId: string) =>
  `${api.baseUrl}/products/${productId}/sources/${encodeURIComponent(sourceId)}/log`

// ---- council -------------------------------------------------------------

export const listSessions = (productId: string) =>
  api
    .get<{ sessions: CouncilSessionSummary[] }>(
      `/products/${productId}/council/sessions`,
    )
    .then((r) => r.sessions)

export const createSession = (
  productId: string,
  body: { topic: string; skill_kind?: string; force?: boolean; skill_id?: string },
) =>
  api.post<{
    session_id: string
    status: string
    priors?: { revision: number; corrections: number; rejections: number }
  }>(`/products/${productId}/council/sessions`, body)

export const getSession = (sessionId: string) =>
  api.get<CouncilSession>(`/council/sessions/${sessionId}`)

export const sessionStreamUrl = (sessionId: string) =>
  `${api.baseUrl}/council/sessions/${sessionId}/stream`

// ---- proposals -----------------------------------------------------------

export interface ListProposalsOptions {
  status?: string | null
  productId?: string | null
}

export const listProposals = ({
  status = 'pending',
  productId,
}: ListProposalsOptions = {}) => {
  const qs = new URLSearchParams()
  if (status) qs.set('status_filter', status)
  if (productId) qs.set('product_id', productId)
  return api
    .get<{ proposals: SkillProposal[] }>(`/proposals?${qs.toString()}`)
    .then((r) => r.proposals)
}

export const getProposal = (id: string) => api.get<SkillProposal>(`/proposals/${id}`)

export const approveProposal = (id: string, actor: string) =>
  api.post<{ ok: boolean; skill_id?: string; chunks_indexed?: number }>(
    `/proposals/${id}/approve`,
    { actor },
  )

export const rejectProposal = (
  id: string,
  body: { reason: string; category?: RejectCategory; actor?: string },
) => api.post<{ ok: boolean }>(`/proposals/${id}/reject`, body)

export const editProposal = (id: string, body: string, actor: string) =>
  api.post<{ ok: boolean }>(`/proposals/${id}/edit`, { body, actor })

// ---- activity ------------------------------------------------------------

export const listActivity = (productId: string) =>
  api
    .get<{ activity: Activity[] }>(`/products/${productId}/activity`)
    .then((r) => r.activity)

// ---- assistant -----------------------------------------------------------

export interface AssistantStreamCallbacks {
  onConversationId?: (id: string) => void
  onToolCall?: (tool: string) => void
  onToolResult?: (tool: string, ok: boolean) => void
  onFinal?: (final: AssistantStreamFinal) => void
  onError?: (message: string) => void
}

/**
 * Runs one assistant turn and streams it back over Server-Sent Events:
 * `tool_call` / `tool_result` progress, then a terminal `session_end`.
 * Uses fetch (not EventSource) so the message can travel in the POST body.
 */
export async function streamAssistantMessage(
  productId: string,
  body: { text: string; conversation_id?: string; actor?: string },
  cb: AssistantStreamCallbacks,
): Promise<void> {
  const resp = await fetch(
    `${api.baseUrl}/products/${productId}/assistant/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )
  if (!resp.ok || !resp.body) {
    throw new ApiError(resp.status, `assistant stream failed: ${resp.status}`)
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n')
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      if (!frame.trim()) continue
      let event = 'message'
      let data = ''
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (!data) continue
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(data)
      } catch {
        continue
      }
      if (event === 'start') {
        cb.onConversationId?.(String(parsed.conversation_id))
      } else if (event === 'error') {
        cb.onError?.(String(parsed.message ?? 'assistant stream error'))
      } else if (event === 'session_end') {
        cb.onFinal?.(parsed as unknown as AssistantStreamFinal)
      } else if (parsed.type === 'tool_call') {
        cb.onToolCall?.(String(parsed.tool))
      } else if (parsed.type === 'tool_result') {
        cb.onToolResult?.(String(parsed.tool), Boolean(parsed.ok))
      }
    }
  }
}

export const getAssistantIdentity = (productId: string, actor: string) =>
  api.get<AssistantIdentity>(
    `/products/${productId}/assistant/identity?actor=${encodeURIComponent(actor)}`,
  )

export const confirmAction = (actionId: string, actor: string) =>
  api.post<ActionProposal>(`/assistant/actions/${actionId}/confirm`, { actor })

export const rejectAction = (actionId: string, actor: string) =>
  api.post<ActionProposal>(`/assistant/actions/${actionId}/reject`, { actor })

export const startAtlassianAuth = (actor: string) =>
  api.get<{ authorize_url: string }>(
    `/auth/atlassian/start?actor=${encodeURIComponent(actor)}`,
  )

// ---- setup (first-run skills_repo bootstrap) -----------------------------

export interface SetupStatus {
  configured: boolean
  skills_repo_url: string | null
  source: 'config' | 'runtime' | null
}

export const getSetupStatus = () => api.get<SetupStatus>('/setup/status')

export interface SetupSkillsRepoResult {
  skills_repo_url: string
  files_seeded: number
  commit_sha: string | null
  created_repo: boolean
}

export const setupSkillsRepoCreate = (body: {
  github_org?: string
  repo_name?: string
}) =>
  api.post<SetupSkillsRepoResult>('/setup/skills-repo', {
    mode: 'create',
    ...body,
  })

export const setupSkillsRepoExisting = (existing_repo_url: string) =>
  api.post<SetupSkillsRepoResult>('/setup/skills-repo', {
    mode: 'existing',
    existing_repo_url,
  })
