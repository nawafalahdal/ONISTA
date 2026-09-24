import type { NextAuthConfig } from 'next-auth'
import { ADMIN_LOGIN_PATH } from '@/config/security'

/**
 * Proxy-safe Auth.js configuration: no database or Node-only imports, so
 * `proxy.ts` can decode the session JWT cheaply on every request. Providers
 * that need the database are added in `src/auth/index.ts`.
 */
export const authConfig = {
  pages: { signIn: ADMIN_LOGIN_PATH, error: ADMIN_LOGIN_PATH },
  session: {
    strategy: 'jwt', // required for the Credentials provider
    maxAge: 8 * 60 * 60, // admin sessions expire after a working day
    updateAge: 30 * 60, // sliding refresh every 30 min of activity
  },
  providers: [],
  callbacks: {
    // Persist only what authorization needs. The token is encrypted (JWE)
    // with AUTH_SECRET and stored in an httpOnly, SameSite=Lax cookie that
    // is `Secure` and `__Secure-` prefixed in production.
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string
        token.role = user.role
        token.sv = user.sessionVersion
        token.mcp = user.mustChangePassword
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.uid
      session.user.role = token.role
      session.user.sessionVersion = token.sv
      session.user.mustChangePassword = token.mcp
      return session
    },
  },
} satisfies NextAuthConfig
