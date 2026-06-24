import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const BACKEND = process.env.ANVAY_API_URL ?? 'http://localhost:8000'
const SESSION_COOKIE = 'anvay_session'
const SESSION_CHECK_TIMEOUT_MS = 3_000

async function hasValidSession(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value
  if (!session) return false

  try {
    const response = await fetch(new URL('/me', BACKEND), {
      cache: 'no-store',
      headers: {
        cookie: `${SESSION_COOKIE}=${session}`,
      },
      signal: AbortSignal.timeout(SESSION_CHECK_TIMEOUT_MS),
    })
    if (response.status === 401 || response.status === 403) return false
    return true
  } catch {
    return true
  }
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    if (await hasValidSession(request)) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
