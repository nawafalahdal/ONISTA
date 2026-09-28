'use server'

import { randomInt } from 'node:crypto'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import { cancelOrderSchema, deliveryStatusSchema, oneOffOrderSchema, orderStatusSchema, weeklyScheduleSchema } from '@/lib/validation/order'
import { db } from '@/server/db'
import { guardCafeAction, guardStaffAction } from '@/server/dal/guard'
import { buildOrder, type BuildOrderError } from '@/server/order-builder'
import { syncOrderStatus } from '@/server/order-status'
import { audit } from '@/server/security/audit'
import { rateLimit } from '@/server/security/rate-limit'

export type SubmitOrderResult = ActionResult<{ orderNumber: number }>

/** Proof-of-delivery code. Not exported: only the READY_FOR_PICKUP transition mints one. */
function generateOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

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

  // Cancelling an order must take its drops with it, in one transaction.
  // Otherwise the order reads CANCELLED while its deliveries stay live: the
  // driver's manifest is built from delivery status, so a cancelled order
  // would still be collected, delivered and paid out on.
  const count = await db.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id }, data: { status } })
    if (updated.count > 0 && status === 'CANCELLED') {
      await tx.delivery.updateMany({
        where: { orderId: id, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
        data: { status: 'CANCELLED' },
      })
    }
    return updated.count
  })
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

  // Marking a drop ready mints the proof-of-delivery code the café will show
  // the driver at the door. It is minted once and kept, so re-marking a drop
  // ready does not invalidate a code the café is already looking at.
  const existing = await db.delivery.findUnique({ where: { id }, select: { otpCode: true } })
  if (!existing) return fail('notFound')
  const otpCode = status === 'READY_FOR_PICKUP' ? (existing.otpCode ?? generateOtpCode()) : undefined

  const { count } = await db.delivery.updateMany({
    where: { id },
    data: {
      status,
      otpCode,
      preparedAt: status === 'READY_FOR_PICKUP' ? new Date() : undefined,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
    },
  })
  if (count === 0) return fail('notFound')

  const delivery = await db.delivery.findUnique({ where: { id }, select: { orderId: true } })
  if (delivery) await syncOrderStatus(delivery.orderId)

  await audit({ actorId: user.id, action: 'delivery.status', entityType: 'Delivery', entityId: id, metadata: { status } })
  return ok({ id })
}

/** Thrown inside the cancellation transaction to roll it back. */
class KitchenAlreadyStarted extends Error {}

/**
 * CAFÉ: cancel one's own order, but only while the kitchen has not started.
 * Past that the goods exist and cancelling would hand back food we have
 * already made, so the café is asked to talk to us instead.
 *
 * Anything already paid comes back as store credit rather than a gateway
 * refund: no payment round-trip, instant for the café, and the money stays in
 * the relationship. A real gateway refund can be layered on later without
 * changing this decision.
 *
 * Every guard is part of the writes themselves, so a café cannot win a race
 * against the kitchen: the order transition is conditional in its WHERE, and
 * if a single drop stops being PENDING mid-transaction the counts disagree
 * and the whole thing rolls back.
 */
export async function cancelOwnOrder(input: unknown): Promise<ActionResult<{ id: string; creditedHalalas: number }>> {
  const { user, denied } = await guardCafeAction()
  if (denied) return denied

  const parsed = cancelOrderSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id } = parsed.data

  // Scoped by cafeId: another café's order is simply not found.
  const order = await db.order.findFirst({
    where: { id, cafeId: user.cafeId },
    select: { id: true, status: true, paymentStatus: true, totalHalalas: true },
  })
  if (!order) return fail('notFound')

  try {
    const creditedHalalas = await db.$transaction(async (tx) => {
      const moved = await tx.order.updateMany({
        where: { id, cafeId: user.cafeId, status: { in: ['PENDING_PAYMENT', 'CONFIRMED'] } },
        data: { status: 'CANCELLED' },
      })
      if (moved.count === 0) throw new KitchenAlreadyStarted()

      const total = await tx.delivery.count({ where: { orderId: id } })
      const cancelled = await tx.delivery.updateMany({
        where: { orderId: id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      })
      // A drop that is no longer PENDING means the kitchen started while we
      // were cancelling. Roll back rather than half-cancel a live order.
      if (cancelled.count !== total) throw new KitchenAlreadyStarted()

      // Only money actually taken is credited back.
      if (order.paymentStatus !== 'PAID' || order.totalHalalas <= 0) return 0
      await tx.cafeProfile.update({
        where: { id: user.cafeId },
        data: { walletBalanceHalalas: { increment: order.totalHalalas } },
      })
      await tx.order.update({ where: { id }, data: { paymentStatus: 'REFUNDED' } })
      return order.totalHalalas
    })

    await audit({
      actorId: user.id,
      action: 'order.cancel_by_cafe',
      entityType: 'Order',
      entityId: id,
      metadata: { creditedHalalas },
    })
    return ok({ id, creditedHalalas })
  } catch (e) {
    if (e instanceof KitchenAlreadyStarted) return fail('conflict', { id: ['cancellationTooLate'] })
    throw e
  }
}
