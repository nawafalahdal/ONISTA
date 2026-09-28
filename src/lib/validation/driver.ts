import { z } from 'zod'
import { email, id, optional, strongPassword, text } from './common'


export const createDriverAccountSchema = z.object({
  name: text({ min: 2, max: 100 }),
  email,
  password: strongPassword,
})
export type CreateDriverAccountInput = z.input<typeof createDriverAccountSchema>

export const resetDriverPasswordSchema = z.object({ id, password: strongPassword })
export const setDriverActiveSchema = z.object({ id, isActive: z.boolean() })

export const assignDriverSchema = z.object({
  deliveryId: id,
  driverId: optional(id),
})
export type AssignDriverInput = z.input<typeof assignDriverSchema>

export const setDeliveryUrgentSchema = z.object({ deliveryId: id, isUrgent: z.boolean() })
