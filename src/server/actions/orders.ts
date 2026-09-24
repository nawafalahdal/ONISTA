'use server'

import { fail, ok, type ActionResult } from '@/lib/action-result'
import { computeTotals } from '@/lib/pricing'
import { fieldErrors } from '@/lib/validation/common'
import { orderStatusSchema, placeOrderSchema } from '@/lib/validation/order'
import { db } from '@/server/db'
import { guardStaffAction } from '@/server/dal/guard'
import { audit } from '@/server/security/audit'
import { rateLimit } from '@/server/security/rate-limit'
import { getClientIp } from '@/server/security/request'

/**
 * PUBLIC checkout. Prices and totals are computed here from the database;
 * the client only sends product IDs and quantities.
 */
export async function placeOrder(input: unknown): Promise<ActionResult<{ orderNumber: number }>> {
  const ip = await getClientIp()
  if (!(await rateLimit('placeOrder', ip)).success) return fail('rateLimited')

  const parsed = placeOrderSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { items, locale, deliveryAddress, ...customer } = parsed.data

  // Merge duplicate lines, then load current prices for purchasable products.
  const quantities = new Map<string, number>()
  for (const { productId, quantity } of items) quantities.set(productId, (quantities.get(productId) ?? 0) + quantity)
  if ([...quantities.values()].some((q) => q > 50)) return fail('validation', { items: ['invalid'] })

  const products = await db.product.findMany({
    where: { id: { in: [...quantities.keys()] }, archivedAt: null, inStock: true },
    select: { id: true, priceHalalas: true, translations: { where: { locale }, select: { title: true } } },
  })
  if (products.length !== quantities.size || products.some((p) => !p.translations[0])) {
    return fail('unavailableSamples', { items: ['unavailableItems'] })
  }

  const lines = products.map((p) => {
    const quantity = quantities.get(p.id)!
    return {
      productId: p.id,
      titleSnapshot: p.translations[0]!.title,
      unitPriceHalalas: p.priceHalalas,
      quantity,
      lineTotalHalalas: p.priceHalalas * quantity,
    }
  })
  const totals = computeTotals(
    lines.reduce((sum, l) => sum + l.lineTotalHalalas, 0),
    customer.fulfillment,
  )

  const order = await db.order.create({
    data: {
      ...customer,
      deliveryAddress: customer.fulfillment === 'DELIVERY' ? deliveryAddress : null,
      locale,
      ...totals,
      items: { create: lines },
    },
    select: { orderNumber: true },
  })
  return ok(order)
}

/** STAFF: move an order through its lifecycle. */
export async function updateOrderStatus(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = orderStatusSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, status } = parsed.data

  const { count } = await db.order.updateMany({ where: { id }, data: { status } })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'order.status', entityType: 'Order', entityId: id, metadata: { status } })
  return ok({ id })
}
