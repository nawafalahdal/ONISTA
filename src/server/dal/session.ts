import 'server-only'
import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ADMIN_LOGIN_PATH, isStaffRole, type AppRole } from '@/config/security'
import { db } from '@/server/db'

/** The only user shape that leaves the DAL (no hash, lockout or version fields). */
export type SessionUser = { id: string; email: string; name: string | null; role: AppRole }

/**
 * Authoritative session check (the proxy's check is only optimistic).
 * Re-reads the user from the database once per request (React `cache`) so
 * deactivation, role changes and `sessionVersion` bumps revoke access
 * immediately, even while an old JWT is still unexpired.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isActive: true, sessionVersion: true },
  })
  if (!user || !user.isActive || user.sessionVersion !== session.user.sessionVersion) return null

  return { id: user.id, email: user.email, name: user.name, role: user.role }
})

/**
 * For admin pages and layouts: unauthenticated → login, authenticated
 * non-staff → 404 (the admin area does not reveal that it exists).
 */
export async function requireStaffPage(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(ADMIN_LOGIN_PATH)
  if (!isStaffRole(user.role)) notFound()
  return user
}

/** For Server Actions: returns null instead of redirecting so actions can respond. */
export async function getStaffUser(minRole: 'STAFF' | 'ADMIN' = 'STAFF'): Promise<SessionUser | null> {
  const user = await getSessionUser()
  if (!user || !isStaffRole(user.role)) return null
  if (minRole === 'ADMIN' && user.role !== 'ADMIN') return null
  return user
}
