'use server'

import { AuthError, CredentialsSignin } from 'next-auth'
import { signIn, signOut } from '@/auth'
import { hashPassword, verifyPassword } from '@/auth/password'
import {
  ACCOUNT_LOGIN_PATH,
  ADMIN_LOGIN_PATH,
  DRIVER_LOGIN_PATH,
  safeAccountRedirect,
  safeAdminRedirect,
  safeDriverRedirect,
} from '@/config/security'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { changePasswordSchema } from '@/lib/validation/auth'
import { db } from '@/server/db'
import { getSessionUser } from '@/server/dal/session'
import { rateLimit } from '@/server/security/rate-limit'

export type LoginState = { error: 'invalidCredentials' | 'rateLimited' } | null

async function submitLogin(formData: FormData, redirectTo: string): Promise<LoginState> {
  try {
    await signIn('credentials', { identifier: formData.get('identifier'), password: formData.get('password'), redirectTo })
    return null
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { error: error.code === 'rate_limited' ? 'rateLimited' : 'invalidCredentials' }
    }
    if (error instanceof AuthError) return { error: 'invalidCredentials' }
    throw error // re-throw NEXT_REDIRECT on success
  }
}

/** Admin/staff sign-in at /admin/login. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  return submitLogin(formData, safeAdminRedirect(formData.get('callbackUrl')))
}

/** Café-account sign-in at /account/login. No self-service sign-up exists. */
export async function cafeLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  return submitLogin(formData, safeAccountRedirect(formData.get('callbackUrl')))
}

/** Driver sign-in at /driver/login. Accounts are admin-issued, same as cafés. */
export async function driverLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  return submitLogin(formData, safeDriverRedirect(formData.get('callbackUrl')))
}

export async function logout() {
  await signOut({ redirectTo: ADMIN_LOGIN_PATH })
}

export async function cafeLogout() {
  await signOut({ redirectTo: ACCOUNT_LOGIN_PATH })
}

export async function driverLogout() {
  await signOut({ redirectTo: DRIVER_LOGIN_PATH })
}

/**
 * First-login flow: an admin-issued password must be changed before the
 * café portal (or, in principle, a staff account) is used further.
 */
export async function changePassword(input: unknown): Promise<ActionResult<undefined>> {
  const user = await getSessionUser()
  if (!user) return fail('unauthorized')
  const limit = await rateLimit('cafeMutation', user.id)
  if (!limit.success) return fail('rateLimited')

  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) return fail('validation', { confirmPassword: ['passwordMismatch'] })
  const { currentPassword, newPassword } = parsed.data

  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
  if (!(await verifyPassword(currentPassword, row?.passwordHash))) {
    return fail('validation', { currentPassword: ['invalid'] })
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  })
  return ok(undefined)
}
