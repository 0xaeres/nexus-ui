import { NextRequest } from 'next/server'

const BACKEND = process.env.NEXUS_API_URL ?? process.env.NEXT_PUBLIC_NEXUS_API ?? 'http://localhost:8000'

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const target = new URL(`/${path.join('/')}`, BACKEND)
  target.search = request.nextUrl.search

  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase()
    if (['host', 'connection', 'content-length'].includes(lower)) continue
    headers.set(key, value)
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
    redirect: 'manual',
  }

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
