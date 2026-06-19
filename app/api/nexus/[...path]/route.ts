import { NextRequest } from 'next/server'

const BACKEND = process.env.NEXUS_API_URL ?? 'http://localhost:8000'
const FORWARDED_COOKIES = new Set(['nexus_session', 'nexus_csrf'])

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

  const response = await fetch(target, init)
  const outHeaders = new Headers(response.headers)
  outHeaders.delete('content-encoding')
  outHeaders.delete('content-length')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: outHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
