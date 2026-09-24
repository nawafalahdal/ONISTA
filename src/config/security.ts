// Shared security constants. Imported by next.config.ts, the proxy and the
// validators, so it must stay free of server-only / Node-only imports.

/** Hosts product images may be served from (next/image remotePatterns + Zod). */
export const IMAGE_HOSTS = ['images.unsplash.com', 'res.cloudinary.com'] as const

export const ADMIN_PATH = '/admin'
export const ADMIN_LOGIN_PATH = '/admin/login'

export const STAFF_ROLES = ['STAFF', 'ADMIN'] as const
export type AppRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export const isStaffRole = (role: unknown): role is (typeof STAFF_ROLES)[number] =>
  role === 'STAFF' || role === 'ADMIN'

export const isAdminPath = (pathname: string) =>
  pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)

/**
 * Only allow redirects back into the admin area. Blocks open redirects such as
 * `?callbackUrl=https://evil.tld` or protocol-relative `//evil.tld`.
 */
export function safeAdminRedirect(target: unknown, fallback = ADMIN_PATH): string {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
    return fallback
  }
  try {
    const url = new URL(target, 'http://localhost')
    if (url.origin !== 'http://localhost' || !isAdminPath(url.pathname) || url.pathname === ADMIN_LOGIN_PATH) {
      return fallback
    }
    return url.pathname + url.search
  } catch {
    return fallback
  }
}
