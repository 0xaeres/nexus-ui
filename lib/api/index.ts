/**
 * Typed accessors mapped to FastAPI routes (ENGINEERING.md §11).
 * One function per endpoint; no business logic.
 */

import type {
  Activity,
  CouncilSession,
  CouncilSessionSummary,
  DashboardData,
  OrgSkill,
  Permissions,
  Product,
  ProductSkillsResponse,
  Skill,
  SkillProposal,
  Source,
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
  api.post<{ ok: boolean }>(`/products/${productId}/sources/${sourceId}/sync`, {})

// ---- council -------------------------------------------------------------

export const listSessions = (productId: string) =>
  api
    .get<{ sessions: CouncilSessionSummary[] }>(
      `/products/${productId}/council/sessions`,
    )
    .then((r) => r.sessions)

export const createSession = (
  productId: string,
  body: { topic: string; skill_kind?: string },
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

export const rejectProposal = (id: string, reason: string) =>
  api.post<{ ok: boolean }>(`/proposals/${id}/reject?reason=${encodeURIComponent(reason)}`, {})

export const editProposal = (id: string, body: string, actor: string) =>
  api.post<{ ok: boolean }>(`/proposals/${id}/edit`, { body, actor })

// ---- activity ------------------------------------------------------------

export const listActivity = (productId: string) =>
  api
    .get<{ activity: Activity[] }>(`/products/${productId}/activity`)
    .then((r) => r.activity)
