import 'server-only'
import { fail, type ActionResult } from '@/lib/action-result'
import { rateLimit } from '@/server/security/rate-limit'
import { getCafeUser, getDriverUser, getStaffUser, type CafeSessionUser, type SessionUser } from './session'

// NOTE: deliberately NOT a 'use server' module. Every export of a
// 'use server' file becomes a publicly reachable endpoint, so helpers like
// this one must live elsewhere.

type Guarded<U> = { user: U; denied?: never } | { user?: never; denied: ActionResult<never> }

/**
 * First line of every privileged Server Action: authenticates, authorizes
 * the role against the database, and applies the per-user mutation limit.
 */
export async function guardStaffAction(minRole: 'STAFF' | 'ADMIN' = 'STAFF'): Promise<Guarded<SessionUser>> {
  const user = await getStaffUser(minRole)
  if (!user) return { denied: fail('unauthorized') }
  const limit = await rateLimit('adminMutation', user.id)
  if (!limit.success) return { denied: fail('rateLimited') }
  return { user }
}

/** Same as {@link guardStaffAction}, for Server Actions the café portal calls. */
export async function guardCafeAction(): Promise<Guarded<CafeSessionUser>> {
  const user = await getCafeUser()
  if (!user) return { denied: fail('unauthorized') }
  const limit = await rateLimit('cafeMutation', user.id)
  if (!limit.success) return { denied: fail('rateLimited') }
  return { user }
}

/**
 * Same as {@link guardStaffAction}, for the driver portal. Being a driver is
 * not enough on its own: every driver action must additionally scope its
 * write to deliveries assigned to this user.
 */
export async function guardDriverAction(): Promise<Guarded<SessionUser>> {
  const user = await getDriverUser()
  if (!user) return { denied: fail('unauthorized') }
  const limit = await rateLimit('driverMutation', user.id)
  if (!limit.success) return { denied: fail('rateLimited') }
  return { user }
}
