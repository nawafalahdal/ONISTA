'use server'

import { AuthError, CredentialsSignin } from 'next-auth'
import { signIn, signOut } from '@/auth'
import { ADMIN_LOGIN_PATH, safeAdminRedirect } from '@/config/security'

export type LoginState = { error: 'invalidCredentials' | 'rateLimited' } | null

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      // Open-redirect safe: only paths inside /admin are honoured.
      redirectTo: safeAdminRedirect(formData.get('callbackUrl')),
    })
    return null
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { error: error.code === 'rate_limited' ? 'rateLimited' : 'invalidCredentials' }
    }
    if (error instanceof AuthError) return { error: 'invalidCredentials' }
    throw error // re-throw NEXT_REDIRECT on success
  }
}

export async function logout() {
  await signOut({ redirectTo: ADMIN_LOGIN_PATH })
}
