/**
 * Typed accessors mapped to FastAPI routes (ENGINEERING.md §8).
 * One function per endpoint; no business logic.
 */

import type {
  CorrectionsResponse,
  CouncilSession,
  CouncilSessionSummary,
  DashboardData,
  Permissions,
  Product,
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
  owner?: { team?: string; lead?: string }
}) => api.post<Product>('/products', body)

// ---- dashboard -----------------------------------------------------------

export const getDashboard = (productId: string) =>
  api.get<DashboardData>(`/products/${productId}/dashboard`)

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

export const editProposal = (id: string, body: string, actor: string) =>
  api.post<{ ok: boolean }>(`/proposals/${id}/edit`, { body, actor })

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
