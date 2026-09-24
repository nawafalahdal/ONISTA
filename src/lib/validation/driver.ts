import { z } from 'zod'
import { email, id, optional, text } from './common'

// TODO(before launch): raise this to the full strength policy (12+ chars,
// mixed character classes) once the environment-variable UX issue that led
// to relaxing SEED_ADMIN_PASSWORD is resolved for admin-issued passwords too.
const initialPassword = z.string().min(8).max(128)

export const createDriverAccountSchema = z.object({
  name: text({ min: 2, max: 100 }),
  email,
  password: initialPassword,
})
export type CreateDriverAccountInput = z.input<typeof createDriverAccountSchema>

export const resetDriverPasswordSchema = z.object({ id, password: initialPassword })
export const setDriverActiveSchema = z.object({ id, isActive: z.boolean() })

export const assignDriverSchema = z.object({
  deliveryId: id,
  driverId: optional(id),
})
export type AssignDriverInput = z.input<typeof assignDriverSchema>
