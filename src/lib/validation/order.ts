import { z } from 'zod'
import { DELIVERY_WINDOWS } from '@/lib/constants'
import { MSG, id, isoDate, localeSchema, optional, text } from './common'

export const MAX_QTY_PER_LINE = 200
export const MAX_LINES_PER_DAY = 30
export const MAX_SCHEDULE_DAYS = 7

const dayItem = z.object({
  productId: id,
  quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE, { error: MSG.invalid }),
})

const paymentMethod = z.enum(['CARD', 'APPLE_PAY', 'BANK_TRANSFER'], { error: MSG.invalid })
const timeWindow = z.enum(DELIVERY_WINDOWS, { error: MSG.invalid })

/** A standard, single-date order (still requires a café login — see requireCafePage). */
export const oneOffOrderSchema = z.object({
  deliveryDate: isoDate,
  timeWindow,
  addressId: id,
  items: z.array(dayItem).min(1, { error: MSG.required }).max(MAX_LINES_PER_DAY),
  paymentMethod,
  notes: optional(text({ max: 500, multiline: true })),
  locale: localeSchema.default('ar'),
})
export type OneOffOrderInput = z.input<typeof oneOffOrderSchema>

/** The weekly delivery schedule: up to 7 dated deliveries, paid for as one order. */
export const weeklyScheduleSchema = z.object({
  weekStartDate: isoDate,
  addressId: id,
  days: z
    .array(z.object({ deliveryDate: isoDate, timeWindow, items: z.array(dayItem).min(1, { error: MSG.required }).max(MAX_LINES_PER_DAY) }))
    .min(1, { error: MSG.required })
    .max(MAX_SCHEDULE_DAYS, { error: MSG.invalid })
    .refine((days) => new Set(days.map((d) => d.deliveryDate)).size === days.length, { error: 'invalid' }),
  paymentMethod,
  notes: optional(text({ max: 500, multiline: true })),
  locale: localeSchema.default('ar'),
})
export type WeeklyScheduleInput = z.input<typeof weeklyScheduleSchema>

export const orderStatusSchema = z.object({
  id,
  status: z.enum(['PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], { error: MSG.invalid }),
})

export const deliveryStatusSchema = z.object({
  id,
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'], { error: MSG.invalid }),
})
