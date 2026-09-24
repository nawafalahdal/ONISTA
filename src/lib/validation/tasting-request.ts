import { z } from 'zod'
import { MSG, email, id, localeSchema, optional, phone, text } from './common'

export const MAX_TASTING_ITEMS = 3

export const tastingRequestSchema = z.object({
  cafeName: text({ min: 2, max: 100 }),
  contactName: optional(text({ max: 100 })),
  phone,
  email: optional(email),
  city: optional(text({ max: 60 })),
  notes: optional(text({ max: 500, multiline: true })),
  productIds: z
    .preprocess(
      (v) => (Array.isArray(v) ? v.filter((x) => x !== '') : v), // unchecked inputs
      z.array(id).min(1, { error: 'selectSamples' }).max(MAX_TASTING_ITEMS, { error: 'selectSamples' }),
    )
    .transform((ids) => [...new Set(ids)]),
  locale: localeSchema.default('ar'),
})
export type TastingRequestInput = z.input<typeof tastingRequestSchema>

export const tastingStatusSchema = z.object({
  id,
  status: z.enum(['NEW', 'CONTACTED', 'SCHEDULED', 'CONVERTED', 'DECLINED'], { error: MSG.invalid }),
})

export const tastingNotesSchema = z.object({
  id,
  staffNotes: text({ min: 0, max: 1000, multiline: true }).transform((v) => v || null),
})
