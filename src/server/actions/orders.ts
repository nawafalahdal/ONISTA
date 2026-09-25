'use server'

import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import { deliveryStatusSchema, oneOffOrderSchema, orderStatusSchema, weeklyScheduleSchema } from '@/lib/validation/order'
import { db } from '@/server/db'
import { guardCafeAction, guardStaffAction } from '@/server/dal/guard'
import { buildOrder, type BuildOrderError } from '@/server/order-builder'
import { audit } from '@/server/security/audit'
import { rateLimit } from '@/server/security/rate-limit'

export type SubmitOrderResult = ActionResult<{ orderNumber: number }>

function mapBuildError(error: BuildOrderError) {
  if (error.code === 'addressNotFound') return fail('notFound', { addressId: ['notFound'] })
  if (error.code === 'invalidDate') return fail('validation', { days: ['invalidDate'] })
  return fail('unavailableSamples', { days: ['unavailableItems'] })
}

/** Café-only: a single-date order. Requires being logged in — no guest checkout. */
export async function submitOneOffOrder(input: unknown): Promise<SubmitOrderResult> {
  const { user, denied } = await guardCafeAction()
  if (denied) return denied
  if (!(await rateLimit('placeOrder', user.cafeId)).success) return fail('rateLimited')

  const parsed = oneOffOrderSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { deliveryDate, timeWindow, addressId, items, ...rest } = parsed.data

  const result = await buildOrder({
    cafeId: user.cafeId,
    type: 'ONE_OFF',
    addressId,
    days: [{ deliveryDate, timeWindow, items }],
    ...rest,
  })
  if (!result.ok) return mapBuildError(result.error)

  await audit({ actorId: user.id, action: 'order.create', entityType: 'Order', entityId: result.orderId, metadata: { type: 'ONE_OFF' } })
  return ok({ orderNumber: result.orderNumber })
}

/** Café-only: the weekly delivery schedule, paid in full for the whole week. */
export async function submitWeeklySchedule(input: unknown): Promise<SubmitOrderResult> {
  const { user, denied } = await guardCafeAction()
  if (denied) return denied
  if (!(await rateLimit('placeOrder', user.cafeId)).success) return fail('rateLimited')

  const parsed = weeklyScheduleSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { weekStartDate: _weekStartDate, addressId, days, ...rest } = parsed.data
  void _weekStartDate // the week is anchored by the first delivery date, not a separate value

  const result = await buildOrder({ cafeId: user.cafeId, type: 'WEEKLY_SCHEDULE', addressId, days, ...rest })
  if (!result.ok) return mapBuildError(result.error)

  await audit({
    actorId: user.id,
    action: 'order.create',
    entityType: 'Order',
    entityId: result.orderId,
    metadata: { type: 'WEEKLY_SCHEDULE', days: days.length },
  })
  return ok({ orderNumber: result.orderNumber })
}

/** STAFF: order-level lifecycle (confirm / cancel / complete). */
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

/** STAFF: day-by-day fulfilment of one delivery within an order. */
export async function updateDeliveryStatus(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = deliveryStatusSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, status } = parsed.data

  const { count } = await db.delivery.updateMany({
    where: { id },
    data: { status, deliveredAt: status === 'DELIVERED' ? new Date() : undefined },
  })
  if (count === 0) return fail('notFound')

  // If every delivery on the order is now DELIVERED, mark the order COMPLETED.
  const delivery = await db.delivery.findUnique({ where: { id }, select: { orderId: true } })
  if (delivery) {
    const siblings = await db.delivery.findMany({ where: { orderId: delivery.orderId }, select: { status: true } })
    if (siblings.every((s) => s.status === 'DELIVERED')) {
      await db.order.updateMany({ where: { id: delivery.orderId, status: { not: 'CANCELLED' } }, data: { status: 'COMPLETED' } })
    } else if (siblings.some((s) => s.status === 'OUT_FOR_DELIVERY' || s.status === 'DELIVERED' || s.status === 'IN_PROGRESS')) {
      await db.order.updateMany({ where: { id: delivery.orderId, status: 'CONFIRMED' }, data: { status: 'IN_PROGRESS' } })
    }
  }

  await audit({ actorId: user.id, action: 'delivery.status', entityType: 'Delivery', entityId: id, metadata: { status } })
  return ok({ id })
}
