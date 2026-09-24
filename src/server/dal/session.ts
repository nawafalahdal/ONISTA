import 'server-only'
import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  ACCOUNT_CHANGE_PASSWORD_PATH,
  ACCOUNT_LOGIN_PATH,
  ADMIN_LOGIN_PATH,
  DRIVER_LOGIN_PATH,
  isCafeRole,
  isDriverRole,
  isStaffRole,
  type AppRole,
} from '@/config/security'
import { db } from '@/server/db'

/** The only user shape that leaves the DAL (no hash, lockout or version fields). */
export type SessionUser = {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  role: AppRole
  mustChangePassword: boolean
}

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
    select: {
      id: true, email: true, phone: true, name: true, role: true, isActive: true,
      sessionVersion: true, mustChangePassword: true,
    },
  })
  if (!user || !user.isActive || user.sessionVersion !== session.user.sessionVersion) return null

  return {
    id: user.id, email: user.email, phone: user.phone, name: user.name,
    role: user.role, mustChangePassword: user.mustChangePassword,
  }
})

/**
 * For admin pages/layouts: unauthenticated → login, authenticated non-staff
 * → 404 (the admin area does not reveal that it exists to anyone else).
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

export type CafeSessionUser = SessionUser & { cafeId: string; cafeName: string }

/**
 * For the café portal: unauthenticated → café login, authenticated non-café
 * → 404 (staff/admin accounts don't have a CafeProfile to render here).
 * A first-login (`mustChangePassword`) is forced to the change-password page
 * before anything else, everywhere except that page itself.
 */
export async function requireCafePage(currentPath?: string): Promise<CafeSessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(ACCOUNT_LOGIN_PATH)
  if (!isCafeRole(user.role)) notFound()

  const profile = await db.cafeProfile.findUnique({ where: { userId: user.id }, select: { id: true, cafeName: true } })
  if (!profile) notFound()

  if (user.mustChangePassword && currentPath !== ACCOUNT_CHANGE_PASSWORD_PATH) redirect(ACCOUNT_CHANGE_PASSWORD_PATH)

  return { ...user, cafeId: profile.id, cafeName: profile.cafeName }
}

/** For Server Actions: returns null instead of redirecting so actions can respond. */
export async function getCafeUser(): Promise<CafeSessionUser | null> {
  const user = await getSessionUser()
  if (!user || !isCafeRole(user.role)) return null
  const profile = await db.cafeProfile.findUnique({ where: { userId: user.id }, select: { id: true, cafeName: true } })
  if (!profile) return null
  return { ...user, cafeId: profile.id, cafeName: profile.cafeName }
}

/**
 * For /driver: unauthenticated → driver login, authenticated non-driver
 * → 404 (this area does not acknowledge that it exists to anyone else).
 */
export async function requireDriverPage(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(DRIVER_LOGIN_PATH)
  if (!isDriverRole(user.role)) notFound()
  return user
}

/** For Server Actions: returns null instead of redirecting so actions can respond. */
export async function getDriverUser(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  if (!user || !isDriverRole(user.role)) return null
  return user
}
