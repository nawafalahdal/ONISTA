import { z } from 'zod'
import { MSG, id, localeSchema, optional, phone, text } from './common'

export const MAX_QTY_PER_ITEM = 50

export const placeOrderSchema = z
  .object({
    items: z
      .array(z.object({ productId: id, quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_ITEM) }))
      .min(1, { error: MSG.required })
      .max(30, { error: MSG.invalid }),
    customerName: text({ min: 2, max: 100 }),
    customerPhone: phone,
    fulfillment: z.enum(['DELIVERY', 'PICKUP']),
    deliveryAddress: optional(text({ max: 500, multiline: true })),
    paymentMethod: z.enum(['CARD', 'APPLE_PAY', 'CASH']),
    notes: optional(text({ max: 500, multiline: true })),
    locale: localeSchema.default('ar'),
  })
  .refine((o) => o.fulfillment !== 'DELIVERY' || Boolean(o.deliveryAddress), {
    path: ['deliveryAddress'],
    error: MSG.required,
  })
export type PlaceOrderInput = z.input<typeof placeOrderSchema>

export const orderStatusSchema = z.object({
  id,
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
})
