import { NextRequest } from 'next/server'

const BACKEND = process.env.ANVAY_API_URL ?? 'http://localhost:8000'
const FORWARDED_COOKIES = new Set(['anvay_session', 'anvay_csrf'])
const PROXY_TIMEOUT_MS = 10_000
const LONG_PROXY_TIMEOUT_MS = 90_000

function timeoutFor(path: string[]) {
  return (path.at(-2) === 'agent' && path.at(-1) === 'messages') || path.join('/') === 'evals/runs'
    ? LONG_PROXY_TIMEOUT_MS
    : PROXY_TIMEOUT_MS
}

function filterCookieHeader(value: string) {
  return value
    .split(';')
    .map((part) => part.trim())
    .filter((part) => FORWARDED_COOKIES.has(part.split('=')[0] ?? ''))
    .join('; ')
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const target = new URL(`/${path.join('/')}`, BACKEND)
  target.search = request.nextUrl.search

  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase()
    if (lower === 'cookie') {
      const filtered = filterCookieHeader(value)
      if (filtered) headers.set('cookie', filtered)
      continue
    }
    if (['host', 'connection', 'content-length'].includes(lower)) continue
    headers.set(key, value)
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method)
  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
  }
  if (hasBody) init.duplex = 'half'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutFor(path))

  try {
    const response = await fetch(target, { ...init, signal: controller.signal })
    const outHeaders = new Headers(response.headers)
    outHeaders.delete('content-encoding')
    outHeaders.delete('content-length')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders,
    })
  } catch {
    return Response.json(
      { detail: 'Anvay backend is unavailable' },
      { status: 503 },
    )
  } finally {
    clearTimeout(timeout)
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
