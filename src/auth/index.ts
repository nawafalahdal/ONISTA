import 'server-only'
import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './config'
import { verifyPassword } from './password'
import { isStaffRole } from '@/config/security'
import { loginSchema } from '@/lib/validation/auth'
import { db } from '@/server/db'
import { rateLimit } from '@/server/security/rate-limit'
import { getClientIp } from '@/server/security/request'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

class InvalidCredentials extends CredentialsSignin {
  code = 'invalid_credentials'
}
class RateLimited extends CredentialsSignin {
  code = 'rate_limited'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw)
        if (!parsed.success) throw new InvalidCredentials()
        const { email, password } = parsed.data

        const ip = await getClientIp()
        const [perAccount, perIp] = await Promise.all([
          rateLimit('login', `${ip}:${email}`),
          rateLimit('loginIp', ip),
        ])
        if (!perAccount.success || !perIp.success) throw new RateLimited()

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true, email: true, name: true, role: true, isActive: true,
            passwordHash: true, sessionVersion: true, lockedUntil: true,
          },
        })

        // Always run bcrypt, even for unknown users, to keep timing uniform.
        const passwordOk = await verifyPassword(password, user?.passwordHash)

        // Only staff accounts may sign in here; customers get the same generic
        // error so the admin login cannot be used to probe customer accounts.
        if (!user || !user.isActive || !isStaffRole(user.role)) throw new InvalidCredentials()
        if (user.lockedUntil && user.lockedUntil > new Date()) throw new RateLimited()

        if (!passwordOk) {
          const updated = await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: { increment: 1 } },
            select: { failedLoginAttempts: true },
          })
          if (updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            await db.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000) },
            })
          }
          throw new InvalidCredentials()
        }

        await db.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
})
