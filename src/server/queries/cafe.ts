import 'server-only'
import { requireCafePage } from '@/server/dal/session'
import { db } from '@/server/db'
import { earliestAllowedDate, getSchedulingContext, listAllowedDates } from '@/server/scheduling'
import { addDays } from '@/lib/date'

// Café-portal reads are never cached and always start with the DAL check
// (requireCafePage redirects/404s before touching any data), same rule as
// the admin queries.

export async function getCafeAddresses() {
  const user = await requireCafePage()
  return db.cafeAddress.findMany({
    where: { cafeId: user.cafeId, archivedAt: null },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
}
export type CafeAddressRow = Awaited<ReturnType<typeof getCafeAddresses>>[number]

export async function getCafeOrders() {
  const user = await requireCafePage()
  return db.order.findMany({
    where: { cafeId: user.cafeId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, orderNumber: true, type: true, status: true, totalHalalas: true, createdAt: true,
      deliveries: {
        orderBy: { deliveryDate: 'asc' },
        select: {
          id: true, deliveryDate: true, status: true, subtotalHalalas: true, addressSnapshot: true,
          items: { select: { id: true, titleSnapshot: true, quantity: true } },
          returnRequest: { select: { id: true, reason: true, decision: true, createdAt: true } },
        },
      },
    },
  })
}
export type CafeOrder = Awaited<ReturnType<typeof getCafeOrders>>[number]

/** Stat cards for the account dashboard: lifetime orders, spend, and what's still coming. */
export async function getCafeOverview() {
  const user = await requireCafePage()
  const { todayISO } = await getSchedulingContext()
  const [orderStats, upcomingCount] = await Promise.all([
    db.order.aggregate({
      where: { cafeId: user.cafeId, status: { not: 'CANCELLED' } },
      _count: true,
      _sum: { totalHalalas: true },
    }),
    db.delivery.count({
      where: {
        order: { cafeId: user.cafeId },
        deliveryDate: { gte: new Date(`${todayISO}T00:00:00Z`) },
        status: { notIn: ['CANCELLED', 'DELIVERED'] },
      },
    }),
  ])
  return {
    totalOrders: orderStats._count,
    totalSpentHalalas: orderStats._sum.totalHalalas ?? 0,
    upcomingDeliveries: upcomingCount,
  }
}

/** The café's own profile, incl. the Google Maps link the admin set at account creation. */
export async function getCafeProfile() {
  const user = await requireCafePage()
  const profile = await db.cafeProfile.findUniqueOrThrow({
    where: { id: user.cafeId },
    select: {
      cafeName: true, contactName: true, contactPhone: true, contactEmail: true, googleMapsUrl: true, createdAt: true,
      addresses: { where: { archivedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
    },
  })
  return profile
}
export type CafeProfileDetail = Awaited<ReturnType<typeof getCafeProfile>>

/** Dashboard summary: next few upcoming deliveries across all orders. */
export async function getUpcomingDeliveries(limit = 6) {
  const user = await requireCafePage()
  const { todayISO } = await getSchedulingContext()
  return db.delivery.findMany({
    where: { order: { cafeId: user.cafeId }, deliveryDate: { gte: new Date(`${todayISO}T00:00:00Z`) }, status: { not: 'CANCELLED' } },
    orderBy: { deliveryDate: 'asc' },
    take: limit,
    select: {
      id: true, deliveryDate: true, status: true, subtotalHalalas: true,
      order: { select: { orderNumber: true, type: true } },
      items: { select: { id: true, titleSnapshot: true, quantity: true } },
    },
  })
}

/** Everything the schedule/order builder needs about delivery-date rules. */
export async function getSchedulingWindow() {
  await requireCafePage()
  const ctx = await getSchedulingContext()
  const earliest = earliestAllowedDate(ctx)
  return {
    earliestDate: earliest,
    // Enough allowed dates to fill a 7-day builder even around blackout days.
    allowedDates: listAllowedDates(ctx, earliest, 21),
    deliveryFeeTiers: ctx.deliveryFeeTiers,
    minLeadDays: ctx.minLeadDays,
  }
}

/** The next `days` calendar dates starting from `fromISO`, for the weekly grid. */
export function upcomingCalendarDates(fromISO: string, days: number) {
  return Array.from({ length: days }, (_, i) => addDays(fromISO, i))
}
