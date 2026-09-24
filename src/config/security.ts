// Shared security constants. Imported by next.config.ts, the proxy and the
// validators, so it must stay free of server-only / Node-only imports.

/** Hosts product images may be served from (next/image remotePatterns + Zod). */
export const IMAGE_HOSTS = ['images.unsplash.com', 'res.cloudinary.com'] as const

export const ADMIN_PATH = '/admin'
export const ADMIN_LOGIN_PATH = '/admin/login'

/** The café partner portal: logged-in B2B clients only, no public sign-up. */
export const ACCOUNT_PATH = '/account'
export const ACCOUNT_LOGIN_PATH = '/account/login'
export const ACCOUNT_CHANGE_PASSWORD_PATH = '/account/change-password'

export const STAFF_ROLES = ['STAFF', 'ADMIN'] as const
export type AppRole = 'ADMIN' | 'STAFF' | 'CAFE'

export const isStaffRole = (role: unknown): role is (typeof STAFF_ROLES)[number] =>
  role === 'STAFF' || role === 'ADMIN'

export const isCafeRole = (role: unknown): role is 'CAFE' => role === 'CAFE'

export const isAdminPath = (pathname: string) => pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)
export const isAccountPath = (pathname: string) => pathname === ACCOUNT_PATH || pathname.startsWith(`${ACCOUNT_PATH}/`)

/** Builds a redirect-target validator scoped to one area (admin or account). */
function safeRedirectWithin(base: string, loginPath: string, isInArea: (p: string) => boolean) {
  return (target: unknown, fallback = base): string => {
    if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
      return fallback
    }
    try {
      const url = new URL(target, 'http://localhost')
      if (url.origin !== 'http://localhost' || !isInArea(url.pathname) || url.pathname === loginPath) return fallback
      return url.pathname + url.search
    } catch {
      return fallback
    }
  }
}

/** Only allow redirects back into /admin. Blocks open redirects. */
export const safeAdminRedirect = safeRedirectWithin(ADMIN_PATH, ADMIN_LOGIN_PATH, isAdminPath)
/** Only allow redirects back into /account. Blocks open redirects. */
export const safeAccountRedirect = safeRedirectWithin(ACCOUNT_PATH, ACCOUNT_LOGIN_PATH, isAccountPath)
