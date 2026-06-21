/**
 * Thin HTTP client for the Nexus FastAPI backend.
 * No env-flag fallback to mocks — backend is the source of truth.
 */

const DEFAULT_BASE = '/api/nexus'
const REQUEST_TIMEOUT_MS = 10_000
const LONG_REQUEST_TIMEOUT_MS = 90_000

function timeoutFor(path: string) {
  return path.includes('/agent/messages') ? LONG_REQUEST_TIMEOUT_MS : REQUEST_TIMEOUT_MS
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${DEFAULT_BASE}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutFor(path))
  const csrf = typeof document === 'undefined'
    ? ''
    : document.cookie
        .split('; ')
        .find((row) => row.startsWith('nexus_csrf='))
        ?.split('=')
        .slice(1)
        .join('=') ?? ''
  try {
    const resp = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-Nexus-CSRF': decodeURIComponent(csrf) } : {}),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
      signal: init?.signal ?? controller.signal,
    })
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      throw new ApiError(resp.status, `${resp.status} ${url}: ${body.slice(0, 200)}`)
    }
    return resp.json() as Promise<T>
  } catch (e) {
    if (e instanceof ApiError) throw e
    const timedOut = controller.signal.aborted
    throw new ApiError(0, `${timedOut ? 'timeout' : 'network error'} ${url}`)
  } finally {
    clearTimeout(timeout)
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  baseUrl: DEFAULT_BASE,
}
