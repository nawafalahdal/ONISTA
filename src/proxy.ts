import NextAuth from 'next-auth'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth/config'
import {
  ACCOUNT_LOGIN_PATH,
  ADMIN_LOGIN_PATH,
  isAccountPath,
  isAdminPath,
  isCafeRole,
  isStaffRole,
} from '@/config/security'
import { routing } from '@/i18n/routing'

/**
 * Next.js 16 Proxy (formerly middleware). Runs before every matched request.
 *
 * Responsibilities
 * 1. Locale negotiation/redirects for the storefront (next-intl).
 * 2. OPTIMISTIC gatekeeping for /admin and /account using only the encrypted
 *    session cookie (no database access, per Next.js guidance). The
 *    authoritative check is repeated in the Data Access Layer by every
 *    layout, page, query and Server Action in each area, so a proxy bypass
 *    grants nothing — it only decides which login page to bounce to.
 * 3. Rejecting Server Action POSTs that carry no Origin header (Next.js
 *    only warns on those; we fail closed).
 */
const { auth } = NextAuth(authConfig)
const handleI18n = createIntlMiddleware(routing)

/** Optimistic gate shared by /admin (staff) and /account (café), which never overlap. */
function gateArea(
  pathname: string,
  search: string,
  url: string,
  role: unknown,
  isAuthed: boolean,
  loginPath: string,
  isAllowedRole: (role: unknown) => boolean,
): NextResponse {
  let res: NextResponse

  if (pathname === loginPath) {
    // No "already signed in → area home" bounce here: a revoked-but-unexpired
    // JWT would loop between login and the DAL. The login page decides that
    // with the authoritative database check instead.
    res = NextResponse.next()
  } else if (!isAuthed) {
    const login = new URL(loginPath, url)
    login.searchParams.set('callbackUrl', pathname + search)
    res = NextResponse.redirect(login)
  } else if (!isAllowedRole(role)) {
    // Signed-in but the wrong kind of account: this area does not
    // acknowledge that it exists to them.
    res = new NextResponse('Not Found', { status: 404 })
  } else {
    res = NextResponse.next()
  }

  res.headers.set('Cache-Control', 'private, no-store')
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl

  if (req.method === 'POST' && req.headers.has('next-action') && !req.headers.get('origin')) {
    return new NextResponse(null, { status: 403 })
  }

  const isAuthed = Boolean(req.auth)
  const role = req.auth?.user?.role

  if (isAdminPath(pathname)) return gateArea(pathname, search, req.url, role, isAuthed, ADMIN_LOGIN_PATH, isStaffRole)
  if (isAccountPath(pathname)) return gateArea(pathname, search, req.url, role, isAuthed, ACCOUNT_LOGIN_PATH, isCafeRole)
  return handleI18n(req)
})

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
