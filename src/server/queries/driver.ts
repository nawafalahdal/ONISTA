import 'server-only'
import { requireDriverPage } from '@/server/dal/session'
import { db } from '@/server/db'
import { getSchedulingContext } from '@/server/scheduling'

/** Everything assigned to this driver for today: what, how much, where, and for whom. */
export async function getDriverDeliveriesToday() {
  const user = await requireDriverPage()
  const { todayISO } = await getSchedulingContext()
  const start = new Date(`${todayISO}T00:00:00Z`)
  const end = new Date(`${todayISO}T23:59:59Z`)

  return db.delivery.findMany({
    where: { assignedDriverId: user.id, deliveryDate: { gte: start, lte: end }, status: { notIn: ['CANCELLED'] } },
    orderBy: { deliveryDate: 'asc' },
    select: {
      id: true, deliveryDate: true, timeWindow: true, status: true, addressSnapshot: true,
      recipientName: true, recipientPhone: true,
      order: { select: { orderNumber: true, cafe: { select: { cafeName: true, contactPhone: true } } } },
      items: { select: { id: true, titleSnapshot: true, quantity: true } },
    },
  })
}
export type DriverDelivery = Awaited<ReturnType<typeof getDriverDeliveriesToday>>[number]
