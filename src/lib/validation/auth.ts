import { z } from 'zod'

/**
 * Shared by both login forms. `identifier` is an e-mail (admin/staff) or a
 * phone number (café accounts) — `src/auth/index.ts` tells them apart and
 * normalises the phone the same way `lib/validation/common.ts#phone` does.
 * TODO(before launch): raise the password minimum again (relaxed for the
 * preview phase). The upper bound prevents bcrypt DoS with huge inputs.
 */
export const loginSchema = z.object({
  identifier: z.string().min(1).max(254),
  password: z.string().min(1).max(128),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], error: 'passwordMismatch' })
