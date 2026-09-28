import 'server-only'
import { requireDriverPage } from '@/server/dal/session'
import { db } from '@/server/db'
import { getSchedulingContext } from '@/server/scheduling'

/**
 * Every drop still assigned to this driver, near and far, so nothing is a
 * surprise: the run sheet shows the whole queue in order and the UI counts
 * down to each one. What a driver may act on is decided separately, by
 * deliveryReadiness below — being visible is not permission to collect.
 *
 * Deliberately does not select otpCode: the code is the café's proof and must
 * reach the driver from the café, never from their own screen.
 */
export async function getDriverDeliveriesToday() {
  const user = await requireDriverPage()
  await getSchedulingContext() // opts this query out of prerendering

  const [deliveries, settings] = await Promise.all([
    db.delivery.findMany({
      where: { assignedDriverId: user.id, status: { notIn: ['CANCELLED', 'DELIVERED'] } },
      // Urgent drops lead, then the queue runs in delivery order.
      orderBy: [{ isUrgent: 'desc' }, { deliveryDate: 'asc' }, { timeWindow: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true, deliveryDate: true, timeWindow: true, status: true, addressSnapshot: true,
        recipientName: true, recipientPhone: true, deliveryFeeHalalas: true, isUrgent: true,
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
 * completed today, which is the same figure the café was charged for it.
 * Counted by when it was delivered, not the date it was booked for, so a drop
 * handed over early still pays out on the day the driver did the work.
 */
export async function getDriverDayStats() {
  const user = await requireDriverPage()
  const { todayISO } = await getSchedulingContext()

  const completed = await db.delivery.aggregate({
    where: {
      assignedDriverId: user.id,
      status: 'DELIVERED',
      deliveredAt: { gte: new Date(`${todayISO}T00:00:00Z`), lte: new Date(`${todayISO}T23:59:59Z`) },
    },
    _count: true,
    _sum: { deliveryFeeHalalas: true },
  })

  return { completedCount: completed._count, earningsHalalas: completed._sum.deliveryFeeHalalas ?? 0 }
}
export type DriverDayStats = Awaited<ReturnType<typeof getDriverDayStats>>
