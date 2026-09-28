import { z } from 'zod'
import { strongPassword } from './common'

/**
 * Shared by both login forms. `identifier` is an e-mail (admin/staff) or a
 * phone number (café accounts) — `src/auth/index.ts` tells them apart and
 * normalises the phone the same way `lib/validation/common.ts#phone` does.
 * The login form itself stays permissive (any non-empty password is checked
 * against the hash); the strength policy applies where passwords are SET.
 * The upper bound prevents bcrypt DoS with huge inputs.
 */
export const loginSchema = z.object({
  identifier: z.string().min(1).max(254),
  password: z.string().min(1).max(128),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], error: 'passwordMismatch' })
