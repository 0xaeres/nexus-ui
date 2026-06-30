/**
 * Typed accessors mapped to FastAPI routes (ENGINEERING.md §8).
 * One function per endpoint; no business logic.
 */

import type {
  CorrectionsResponse,
  CouncilSession,
  CouncilSessionSummary,
  DashboardData,
  DeleteProductReport,
  GraphRAGAnswer,
  GraphRAGMessage,
  Permissions,
  Product,
  ProductRole,
  ProductSkillsResponse,
  ProductStatus,
  RejectCategory,
  Skill,
  SkillQualityResponse,
  SkillProposal,
  Source,
  SyncDelta,
  User,
} from '../types'
import type {
  EvalJobRef,
  EvalJobStatus,
  EvalRunArtifact,
  ProductEvalInfo,
} from '../evals'
import { api, ApiError } from './client'

export { ApiError }

// ---- /me + /products -----------------------------------------------------

interface MeResponse {
  user: User
  permissions: Permissions
  memberships?: Record<string, ProductRole>
}

export const getMe = () => api.get<MeResponse>('/me')
export const login = (body: { email: string; password: string }) =>
  api.post<MeResponse & { csrf_token: string }>('/auth/login', body)
export const logout = () => api.post<{ ok: boolean }>('/auth/logout', {})
export const requestAccess = (body: { email: string; name?: string; reason?: string }) =>
  api.post<{ ok: boolean }>('/auth/request-access', body)
export const listAccessRequests = (status = 'pending') =>
  api
    .get<{ requests: AccessRequest[] }>(`/auth/access-requests?status=${status}`)
    .then((r) => r.requests)
export const approveAccessRequest = (
  id: string,
  body: { role: 'admin' | 'editor' | 'viewer'; password: string },
) => api.post<{ ok: boolean; request: AccessRequest }>(`/auth/access-requests/${id}/approve`, body)
export const rejectAccessRequest = (id: string) =>
  api.post<{ ok: boolean; request: AccessRequest }>(`/auth/access-requests/${id}/reject`, {})
export const listUsers = () =>
  api.get<{ users: User[] }>('/auth/users').then((r) => r.users)
export const revokeUser = (email: string) =>
  api.post<{ ok: boolean; user: User }>(`/auth/users/${encodeURIComponent(email)}/revoke`, {})

export interface AccessRequest {
  id: string
  email: string
  name: string
  reason: string
  status: string
  created_at: string
}
export const listProducts = () =>
  api.get<{ products: Product[] }>('/products').then((r) => r.products)
export const getProduct = (id: string) => api.get<Product>(`/products/${id}`)

export const getProductStatus = (id: string) =>
  api.get<ProductStatus>(`/products/${id}/status`)

export const createProduct = (body: {
  id: string
  name: string
  tagline?: string
  owner?: { team?: string; lead?: string }
}) => api.post<Product>('/products', body)

export const deleteProduct = (id: string) =>
  api.del<{ ok: boolean; report: DeleteProductReport }>(
    `/products/${encodeURIComponent(id)}`,
  )

// ---- dashboard -----------------------------------------------------------

export const getDashboard = (productId: string) =>
  api.get<DashboardData>(`/products/${productId}/dashboard`)

// ---- product agent --------------------------------------------------------

export const askProductAgent = (
  productId: string,
  body: {
    message: string
    history?: GraphRAGMessage[]
    current_file?: string | null
    max_depth?: number
    top_k?: number
    model?: string
  },
) => api.post<GraphRAGAnswer>(`/products/${encodeURIComponent(productId)}/agent/messages`, body)

export const listProductAgentModels = (productId: string) =>
  api.get<{ models: string[]; default: string }>(
    `/products/${encodeURIComponent(productId)}/agent/models`,
  )

// ---- skills --------------------------------------------------------------

export const listProductSkills = (productId: string) =>
  api.get<ProductSkillsResponse>(`/products/${productId}/skills`)

export const getSkill = (skillId: string) =>
  api.get<Skill>(`/skills/${encodeURIComponent(skillId)}`)

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

export const getSkillQuality = (skillId: string) =>
  api.get<SkillQualityResponse>(`/skills/${encodeURIComponent(skillId)}/quality`)

// ---- sources -------------------------------------------------------------

export const listSources = (productId: string) =>
  api.get<{ sources: Source[] }>(`/products/${productId}/sources`).then((r) => r.sources)

export const getSource = (productId: string, sourceId: string) =>
  api.get<Source>(`/products/${productId}/sources/${sourceId}`)

export const addSource = (
  productId: string,
  body: { name: string; type: string; config?: Record<string, unknown> },
) => api.post<Source>(`/products/${productId}/sources`, body)

export const syncSource = (productId: string, sourceId: string) =>
  api.post<{ ok: boolean; delta?: SyncDelta }>(
    `/products/${productId}/sources/${sourceId}/sync`,
    {},
  )

export const sourceLogUrl = (productId: string, sourceId: string) =>
  `${api.baseUrl}/products/${productId}/sources/${encodeURIComponent(sourceId)}/log`

// ---- council -------------------------------------------------------------

export const createSession = (
  productId: string,
  body: { topic: string; skill_id?: string },
) =>
  api.post<{ session_id: string; status: string }>(
    `/products/${productId}/council/sessions`,
    body,
  )

export const getSession = (sessionId: string) =>
  api.get<CouncilSession>(`/council/sessions/${sessionId}`)

export const sessionStreamUrl = (sessionId: string) =>
  `${api.baseUrl}/council/sessions/${sessionId}/stream`

// ---- evals (multi-product dashboard) -------------------------------------

export const startEvalRun = (body: {
  products: string[]
  modes?: string[]
  limit?: number | null
  top_k?: number
  ingest?: boolean
}) => api.post<EvalJobRef>('/evals/runs', body)

export const listEvalRuns = () =>
  api.get<{ runs: EvalRunArtifact[] }>('/evals/runs').then((r) => r.runs)

export const getEvalRun = (runId: string) =>
  api.get<EvalRunArtifact>(`/evals/runs/${encodeURIComponent(runId)}`)

export const getEvalJob = (jobId: string) =>
  api.get<EvalJobStatus>(`/evals/jobs/${encodeURIComponent(jobId)}`)

export const getEvalCorpus = () =>
  api.get<{ products: ProductEvalInfo[] }>('/evals/corpus').then((r) => r.products)

export const evalJobStreamUrl = (jobId: string) =>
  `${api.baseUrl}/evals/jobs/${encodeURIComponent(jobId)}/stream`

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

export const reviseProposal = (
  id: string,
  body: { summary: string; actor?: string; comments?: Array<{ line?: number | null; body: string }> },
) =>
  api.post<{ session_id: string; status: string }>(
    `/proposals/${id}/revise`,
    body,
  )
