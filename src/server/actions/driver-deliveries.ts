'use server'

import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import { deliveryConfirmSchema, deliveryPickupSchema } from '@/lib/validation/driver-delivery'
import { db } from '@/server/db'
import { guardDriverAction } from '@/server/dal/guard'
import { syncOrderStatus } from '@/server/order-status'
import { audit } from '@/server/security/audit'
import { rateLimit } from '@/server/security/rate-limit'

/**
 * DRIVER: collect a drop from the kitchen. The write is scoped to a delivery
 * assigned to this driver that the admin has already marked ready, so a
 * driver cannot pick up someone else's drop or skip the kitchen's sign-off.
 */
export async function markDeliveryPickedUp(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardDriverAction()
  if (denied) return denied

  const parsed = deliveryPickupSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { deliveryId } = parsed.data

  const { count } = await db.delivery.updateMany({
    where: { id: deliveryId, assignedDriverId: user.id, status: 'READY_FOR_PICKUP' },
    data: { status: 'OUT_FOR_DELIVERY', pickedUpAt: new Date() },
  })
  if (count === 0) return fail('notFound')

  const delivery = await db.delivery.findUnique({ where: { id: deliveryId }, select: { orderId: true } })
  if (delivery) await syncOrderStatus(delivery.orderId)

  await audit({ actorId: user.id, action: 'delivery.pickup', entityType: 'Delivery', entityId: deliveryId })
  return ok({ id: deliveryId })
}

/**
 * DRIVER: close out a drop at the café door. The code the café is showing is
 * matched inside the UPDATE's own WHERE clause, so the check and the write
 * are one atomic step — there is no window in which a delivery could be
 * completed without the right code, and a wrong code changes nothing.
 */
export async function confirmDeliveryWithOtp(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardDriverAction()
  if (denied) return denied

  const parsed = deliveryConfirmSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { deliveryId, otpCode } = parsed.data

  // A 6-digit code is only 10^6 wide, so cap attempts per delivery.
  if (!(await rateLimit('deliveryOtp', deliveryId)).success) return fail('rateLimited')

  const { count } = await db.delivery.updateMany({
    where: { id: deliveryId, assignedDriverId: user.id, status: 'OUT_FOR_DELIVERY', otpCode },
    data: { status: 'DELIVERED', deliveredAt: new Date() },
  })
  if (count === 0) return fail('invalidOtp', { otpCode: ['invalidOtp'] })

  const delivery = await db.delivery.findUnique({ where: { id: deliveryId }, select: { orderId: true } })
  if (delivery) await syncOrderStatus(delivery.orderId)

  await audit({ actorId: user.id, action: 'delivery.confirmed', entityType: 'Delivery', entityId: deliveryId })
  return ok({ id: deliveryId })
}
