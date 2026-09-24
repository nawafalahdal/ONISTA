import 'server-only'
// Deliberately NOT a 'use server' module — shared logic for the two order-
// creating Server Actions (one-off, weekly schedule) lives here so it isn't
// itself a publicly callable endpoint.
import type { Locale, OrderType, PaymentMethod } from '@/generated/prisma/enums'
import { computeTotals } from '@/lib/pricing'
import { db } from '@/server/db'
import { getSchedulingContext, isDateAllowed } from '@/server/scheduling'

/** '2026-09-26' -> a UTC-midnight Date, what Prisma's @db.Date columns expect. */
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

export type OrderDay = { deliveryDate: string; items: { productId: string; quantity: number }[] }

export type BuildOrderInput = {
  cafeId: string
  type: OrderType
  addressId: string
  days: OrderDay[]
  paymentMethod: PaymentMethod
  notes?: string
  locale: Locale
}

export type BuildOrderError =
  | { code: 'addressNotFound' }
  | { code: 'invalidDate'; date: string }
  | { code: 'unavailableItems' }

export type BuildOrderResult = { ok: true; orderNumber: number; orderId: string } | { ok: false; error: BuildOrderError }

/**
 * Validates and creates a café order: every delivery date is re-checked
 * against the live scheduling rules (no same-day delivery, weekday/blackout
 * rules, cut-off), the address must belong to the café, and every product
 * price is re-read from the database — nothing about price or eligibility is
 * trusted from the client. Payment is simulated (no gateway is wired up
 * yet): the order is created already PAID/CONFIRMED, matching how checkout
 * behaved before the café-only model.
 */
export async function buildOrder(input: BuildOrderInput): Promise<BuildOrderResult> {
  const address = await db.cafeAddress.findFirst({
    where: { id: input.addressId, cafeId: input.cafeId, archivedAt: null },
  })
  if (!address) return { ok: false, error: { code: 'addressNotFound' } }

  const ctx = await getSchedulingContext()
  for (const day of input.days) {
    if (!isDateAllowed(day.deliveryDate, ctx)) return { ok: false, error: { code: 'invalidDate', date: day.deliveryDate } }
  }

  const productIds = [...new Set(input.days.flatMap((d) => d.items.map((i) => i.productId)))]
  const products = await db.product.findMany({
    where: { id: { in: productIds }, archivedAt: null, inStock: true, isSchedulable: true },
    select: { id: true, priceHalalas: true, translations: { where: { locale: input.locale }, select: { title: true } } },
  })
  const byId = new Map(products.map((p) => [p.id, p]))
  if (products.length !== productIds.length || products.some((p) => !p.translations[0])) {
    return { ok: false, error: { code: 'unavailableItems' } }
  }

  const addressSnapshot = [address.street, address.district, address.city].filter(Boolean).join(', ')
  const deliveries = input.days.map((day) => {
    // Merge duplicate product rows within the same day.
    const merged = new Map<string, number>()
    for (const item of day.items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)

    const items = [...merged.entries()].map(([productId, quantity]) => {
      const p = byId.get(productId)!
      return {
        productId,
        titleSnapshot: p.translations[0]!.title,
        unitPriceHalalas: p.priceHalalas,
        quantity,
        lineTotalHalalas: p.priceHalalas * quantity,
      }
    })
    return {
      deliveryDate: asDate(day.deliveryDate),
      addressId: address.id,
      addressSnapshot,
      subtotalHalalas: items.reduce((n, i) => n + i.lineTotalHalalas, 0),
      items: { create: items },
    }
  })

  const subtotalHalalas = deliveries.reduce((n, d) => n + d.subtotalHalalas, 0)
  const totals = computeTotals(subtotalHalalas, deliveries.length, ctx.deliveryFeeHalalas)
  const weekStartDate = input.type === 'WEEKLY_SCHEDULE' ? asDate(input.days[0]!.deliveryDate) : undefined

  const order = await db.order.create({
    data: {
      type: input.type,
      status: 'CONFIRMED',
      cafeId: input.cafeId,
      weekStartDate,
      notes: input.notes,
      locale: input.locale,
      ...totals,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'PAID',
      paidAt: new Date(),
      deliveries: { create: deliveries },
    },
    select: { id: true, orderNumber: true },
  })

  return { ok: true, orderId: order.id, orderNumber: order.orderNumber }
}
