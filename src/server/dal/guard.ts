import 'server-only'
import { fail, type ActionResult } from '@/lib/action-result'
import { rateLimit } from '@/server/security/rate-limit'
import { getStaffUser, type SessionUser } from './session'

// NOTE: deliberately NOT a 'use server' module. Every export of a
// 'use server' file becomes a publicly reachable endpoint, so helpers like
// this one must live elsewhere.

type Guarded = { user: SessionUser; denied?: never } | { user?: never; denied: ActionResult<never> }

/**
 * First line of every privileged Server Action: authenticates, authorizes
 * the role against the database, and applies the per-user mutation limit.
 */
export async function guardStaffAction(minRole: 'STAFF' | 'ADMIN' = 'STAFF'): Promise<Guarded> {
  const user = await getStaffUser(minRole)
  if (!user) return { denied: fail('unauthorized') }
  const limit = await rateLimit('adminMutation', user.id)
  if (!limit.success) return { denied: fail('rateLimited') }
  return { user }
}
