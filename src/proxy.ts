import NextAuth from 'next-auth'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth/config'
import { ADMIN_LOGIN_PATH, isAdminPath, isStaffRole } from '@/config/security'
import { routing } from '@/i18n/routing'

/**
 * Next.js 16 Proxy (formerly middleware). Runs before every matched request.
 *
 * Responsibilities
 * 1. Locale negotiation/redirects for the storefront (next-intl).
 * 2. OPTIMISTIC gatekeeping for /admin using only the encrypted session
 *    cookie (no database access, per Next.js guidance). The authoritative
 *    check is repeated in the Data Access Layer by every admin layout,
 *    page, query and Server Action, so a proxy bypass grants nothing.
 * 3. Rejecting Server Action POSTs that carry no Origin header (Next.js
 *    only warns on those; we fail closed).
 */
const { auth } = NextAuth(authConfig)
const handleI18n = createIntlMiddleware(routing)

export default auth((req) => {
  const { pathname, search } = req.nextUrl

  if (req.method === 'POST' && req.headers.has('next-action') && !req.headers.get('origin')) {
    return new NextResponse(null, { status: 403 })
  }

  if (!isAdminPath(pathname)) return handleI18n(req)

  const isStaff = isStaffRole(req.auth?.user?.role)
  let res: NextResponse

  if (pathname === ADMIN_LOGIN_PATH) {
    // No "already signed in → /admin" bounce here: a revoked-but-unexpired
    // JWT would loop between login and the DAL. The login page decides that
    // with the authoritative database check instead.
    res = NextResponse.next()
  } else if (!req.auth) {
    const login = new URL(ADMIN_LOGIN_PATH, req.url)
    login.searchParams.set('callbackUrl', pathname + search)
    res = NextResponse.redirect(login)
  } else if (!isStaff) {
    // Signed-in customers get a plain 404: the admin area does not
    // acknowledge that it exists.
    res = new NextResponse('Not Found', { status: 404 })
  } else {
    res = NextResponse.next()
  }

  // Admin responses must never be cached by shared caches or indexed.
  res.headers.set('Cache-Control', 'private, no-store')
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
})

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
