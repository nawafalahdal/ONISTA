import { z } from 'zod'
import { sarToHalalas } from '@/lib/money'
import { MSG, isoDate, optional, text } from './common'

export const schedulingSettingsSchema = z.object({
  cutoffHour: z.coerce.number().int().min(0).max(23, { error: MSG.invalid }),
  minLeadDays: z.coerce.number().int().min(1).max(14, { error: MSG.invalid }), // never 0: no same-day delivery
  maxAdvanceDays: z.coerce.number().int().min(1).max(365, { error: MSG.invalid }),
  deliveryWeekdays: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, { error: MSG.required })
    .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
  deliveryFeeOneOffHalalas: z.coerce.number().min(0).max(10_000).transform(sarToHalalas),
  deliveryFeeWeekHalalas: z.coerce.number().min(0).max(10_000).transform(sarToHalalas),
  deliveryFeeBiweekHalalas: z.coerce.number().min(0).max(10_000).transform(sarToHalalas),
  deliveryFeeMonthHalalas: z.coerce.number().min(0).max(10_000).transform(sarToHalalas),
  tastingExtraFeeHalalas: z.coerce.number().min(0).max(10_000).transform(sarToHalalas),
})
export type SchedulingSettingsInput = z.input<typeof schedulingSettingsSchema>

export const blackoutDateSchema = z.object({
  date: isoDate,
  reasonAr: optional(text({ max: 120 })),
  reasonEn: optional(text({ max: 120 })),
})

export const blackoutDateDeleteSchema = z.object({ date: isoDate })
