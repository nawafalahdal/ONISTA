'use server'

import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import { decideReturnSchema, requestReturnSchema } from '@/lib/validation/return'
import { db } from '@/server/db'
import { guardCafeAction, guardStaffAction } from '@/server/dal/guard'
import { audit } from '@/server/security/audit'

/** Café-only: file a return claim against one of its own DELIVERED deliveries. */
export async function requestReturn(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardCafeAction()
  if (denied) return denied

  const parsed = requestReturnSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { deliveryId, reason } = parsed.data

  const delivery = await db.delivery.findUnique({
    where: { id: deliveryId },
    select: { id: true, status: true, order: { select: { cafeId: true } } },
  })
  if (!delivery || delivery.order.cafeId !== user.cafeId) return fail('notFound')
  if (delivery.status !== 'DELIVERED') return fail('validation', { deliveryId: ['notDelivered'] })

  try {
    const created = await db.$transaction(async (tx) => {
      const request = await tx.returnRequest.create({
        data: { deliveryId, cafeId: user.cafeId, reason },
      })
      await tx.delivery.update({ where: { id: deliveryId }, data: { status: 'RETURN_REQUESTED' } })
      return request
    })
    await audit({ actorId: user.id, action: 'return.request', entityType: 'ReturnRequest', entityId: created.id })
    return ok({ id: created.id })
  } catch {
    return fail('conflict')
  }
}

/** STAFF: approve or reject a pending return claim. */
export async function decideReturn(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = decideReturnSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, decision, adminNotes } = parsed.data

  const { count } = await db.returnRequest.updateMany({
    where: { id, decision: 'PENDING' },
    data: { decision, adminNotes, decidedById: user.id, decidedAt: new Date() },
  })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'return.decide', entityType: 'ReturnRequest', entityId: id, metadata: { decision } })
  return ok({ id })
}
