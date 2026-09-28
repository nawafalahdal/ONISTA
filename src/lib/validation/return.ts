import { z } from 'zod'
import { MSG, id, optional, text } from './common'

export const requestReturnSchema = z.object({
  deliveryId: id,
  reason: text({ min: 5, max: 500, multiline: true }),
})
export type RequestReturnInput = z.input<typeof requestReturnSchema>

export const decideReturnSchema = z.object({
  id,
  decision: z.enum(['APPROVED', 'REJECTED'], { error: MSG.invalid }),
  adminNotes: optional(text({ max: 500, multiline: true })),
})
export type DecideReturnInput = z.input<typeof decideReturnSchema>
