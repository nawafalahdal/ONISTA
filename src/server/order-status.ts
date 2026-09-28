import 'server-only'
// Deliberately NOT a 'use server' module — every export of one becomes a
// publicly reachable endpoint, and this is internal bookkeeping.
import type { DeliveryStatus } from '@/generated/prisma/enums'
import { db } from '@/server/db'

/** A drop the kitchen or a driver has started working on, i.e. no longer just booked. */
const STARTED: DeliveryStatus[] = ['IN_PROGRESS', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED']

/**
 * Keeps an order's status in step with its drops, so the café and the admin
 * read the same state without anyone maintaining it by hand. Shared by the
 * staff and driver actions so the two cannot drift apart.
 */
export async function syncOrderStatus(orderId: string) {
  const siblings = await db.delivery.findMany({ where: { orderId }, select: { status: true } })
  if (siblings.length === 0) return

  if (siblings.every((s) => s.status === 'DELIVERED')) {
    await db.order.updateMany({ where: { id: orderId, status: { not: 'CANCELLED' } }, data: { status: 'COMPLETED' } })
  } else if (siblings.some((s) => STARTED.includes(s.status))) {
    await db.order.updateMany({ where: { id: orderId, status: 'CONFIRMED' }, data: { status: 'IN_PROGRESS' } })
  }
}
