import 'server-only'
import { requireDriverPage } from '@/server/dal/session'
import { db } from '@/server/db'
import { getSchedulingContext } from '@/server/scheduling'

function todayRange(todayISO: string) {
  return { gte: new Date(`${todayISO}T00:00:00Z`), lte: new Date(`${todayISO}T23:59:59Z`) }
}

/**
 * This driver's open run for today: what, how much, where, and for whom.
 * Completed drops fall out of the list the moment they are confirmed — they
 * are counted in the day's summary instead (see getDriverDayStats).
 *
 * Deliberately does not select otpCode: the code is the café's proof and
 * must reach the driver from the café, never from their own screen.
 */
export async function getDriverDeliveriesToday() {
  const user = await requireDriverPage()
  const { todayISO } = await getSchedulingContext()

  const [deliveries, settings] = await Promise.all([
    db.delivery.findMany({
      where: {
        assignedDriverId: user.id,
        deliveryDate: todayRange(todayISO),
        status: { notIn: ['CANCELLED', 'DELIVERED'] },
      },
      orderBy: [{ timeWindow: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true, deliveryDate: true, timeWindow: true, status: true, addressSnapshot: true,
        recipientName: true, recipientPhone: true, deliveryFeeHalalas: true,
        order: { select: { orderNumber: true, cafe: { select: { cafeName: true, contactPhone: true, googleMapsUrl: true } } } },
        items: { select: { id: true, titleSnapshot: true, quantity: true } },
      },
    }),
    db.schedulingSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
  ])

  return { deliveries, kitchenGoogleMapsUrl: settings.kitchenGoogleMapsUrl }
}
export type DriverDelivery = Awaited<ReturnType<typeof getDriverDeliveriesToday>>['deliveries'][number]

/**
 * What the driver has earned today: one delivery fee per drop they actually
 * completed, which is the same figure the café was charged for that drop.
 */
export async function getDriverDayStats() {
  const user = await requireDriverPage()
  const { todayISO } = await getSchedulingContext()

  const [completed, remaining] = await Promise.all([
    db.delivery.aggregate({
      where: { assignedDriverId: user.id, deliveryDate: todayRange(todayISO), status: 'DELIVERED' },
      _count: true,
      _sum: { deliveryFeeHalalas: true },
    }),
    db.delivery.count({
      where: {
        assignedDriverId: user.id,
        deliveryDate: todayRange(todayISO),
        status: { notIn: ['CANCELLED', 'DELIVERED'] },
      },
    }),
  ])

  return {
    completedCount: completed._count,
    earningsHalalas: completed._sum.deliveryFeeHalalas ?? 0,
    remainingCount: remaining,
  }
}
export type DriverDayStats = Awaited<ReturnType<typeof getDriverDayStats>>
