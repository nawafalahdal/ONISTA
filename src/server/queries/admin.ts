import 'server-only'
import type { Locale } from '@/generated/prisma/enums'
import { db } from '@/server/db'
import { requireStaffPage } from '@/server/dal/session'

// Admin reads are never cached and always start with the DAL check, so the
// data cannot be reached even if a page forgets its own guard. Every function
// returns a plain DTO: only the fields the admin UI actually renders.

const OPEN_ORDER = { notIn: ['COMPLETED', 'CANCELLED'] as ('COMPLETED' | 'CANCELLED')[] }

export async function getNavCounts() {
  await requireStaffPage()
  const [pendingOrders, newRequests, pendingReturns] = await Promise.all([
    db.order.count({ where: { status: 'PENDING_PAYMENT' } }),
    db.tastingRequest.count({ where: { status: 'NEW' } }),
    db.returnRequest.count({ where: { decision: 'PENDING' } }),
  ])
  return { newOrders: pendingOrders, newRequests, pendingReturns }
}

export async function getDashboardData() {
  await requireStaffPage()
  const [revenue, orderCount, openOrders, newRequests, totalRequests, liveProducts, cafeCount, upcomingDeliveries, recentRequests, top] =
    await Promise.all([
      db.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalHalalas: true } }),
      db.order.count({ where: { status: { not: 'CANCELLED' } } }),
      db.order.count({ where: { status: OPEN_ORDER } }),
      db.tastingRequest.count({ where: { status: 'NEW' } }),
      db.tastingRequest.count(),
      db.product.count({ where: { archivedAt: null, inStock: true } }),
      db.cafeProfile.count(),
      db.delivery.findMany({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { deliveryDate: 'asc' },
        take: 6,
        select: {
          id: true, deliveryDate: true, status: true, subtotalHalalas: true,
          order: { select: { orderNumber: true, type: true, cafe: { select: { cafeName: true } } } },
        },
      }),
      db.tastingRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, requestNumber: true, cafeName: true, createdAt: true, _count: { select: { selectedProducts: true } } },
      }),
      db.deliveryItem.groupBy({
        by: ['titleSnapshot'],
        where: { delivery: { order: { status: { not: 'CANCELLED' } } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ])

  const activity = [
    ...upcomingDeliveries.map((d) => ({
      kind: 'delivery' as const,
      id: d.id,
      ref: `ORD-${d.order.orderNumber}${d.order.type === 'WEEKLY_SCHEDULE' ? ' · weekly' : ''}`,
      who: d.order.cafe.cafeName,
      amountHalalas: d.subtotalHalalas,
      samples: 0,
      at: d.deliveryDate,
    })),
    ...recentRequests.map((r) => ({
      kind: 'tasting' as const,
      id: r.id,
      ref: `TST-${r.requestNumber}`,
      who: r.cafeName,
      amountHalalas: 0,
      samples: r._count.selectedProducts,
      at: r.createdAt,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6)

  return {
    revenueHalalas: revenue._sum.totalHalalas ?? 0,
    orderCount,
    openOrders,
    newRequests,
    totalRequests,
    liveProducts,
    cafeCount,
    activity,
    bestSellers: top.map((t) => ({ title: t.titleSnapshot, qty: t._sum.quantity ?? 0 })),
  }
}
export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export async function listOrders() {
  await requireStaffPage()
  return db.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, orderNumber: true, type: true, status: true, totalHalalas: true, createdAt: true, weekStartDate: true,
      cafe: { select: { cafeName: true, contactPhone: true } },
      deliveries: {
        orderBy: { deliveryDate: 'asc' },
        select: {
          id: true, deliveryDate: true, timeWindow: true, status: true, subtotalHalalas: true, addressSnapshot: true, assignedDriverId: true,
          items: { select: { id: true, titleSnapshot: true, quantity: true } },
        },
      },
    },
  })
}
export type AdminOrder = Awaited<ReturnType<typeof listOrders>>[number]

export async function listTastingRequests() {
  await requireStaffPage()
  return db.tastingRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, requestNumber: true, status: true, cafeName: true, contactName: true, phone: true,
      email: true, city: true, notes: true, staffNotes: true, locale: true, createdAt: true,
      extraSamplesCount: true, extraFeeHalalas: true,
      selectedProducts: { select: { productId: true, titleSnapshot: true } },
    },
  })
}
export type AdminTastingRequest = Awaited<ReturnType<typeof listTastingRequests>>[number]

export async function listAdminProducts(locale: Locale) {
  await requireStaffPage()
  const rows = await db.product.findMany({
    where: { archivedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true, slug: true, priceHalalas: true, inStock: true, isTastingMenu: true, isSchedulable: true, isFeatured: true,
      sortOrder: true, categoryId: true,
      category: { select: { translations: { where: { locale }, select: { name: true } }, slug: true } },
      translations: { select: { locale: true, title: true, description: true, badge: true } },
      images: { orderBy: { position: 'asc' }, select: { url: true, altAr: true, altEn: true } },
    },
  })
  return rows.map(({ translations, category, ...p }) => {
    const tr = (l: Locale) => {
      const t = translations.find((x) => x.locale === l)
      return { title: t?.title ?? '', description: t?.description ?? '', badge: t?.badge ?? '' }
    }
    return { ...p, categoryName: category.translations[0]?.name ?? category.slug, translations: { ar: tr('ar'), en: tr('en') } }
  })
}
export type AdminProduct = Awaited<ReturnType<typeof listAdminProducts>>[number]

export async function listCategories(locale: Locale) {
  await requireStaffPage()
  const rows = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, translations: { where: { locale }, select: { name: true } } },
  })
  return rows.map((c) => ({ id: c.id, name: c.translations[0]?.name ?? c.slug }))
}
export type AdminCategory = Awaited<ReturnType<typeof listCategories>>[number]

// ── Clients / Cafés ─────────────────────────────────────────────────────────

export async function listCafes() {
  await requireStaffPage()
  const rows = await db.cafeProfile.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, cafeName: true, contactName: true, contactPhone: true, contactEmail: true, googleMapsUrl: true, createdAt: true,
      user: { select: { isActive: true, lastLoginAt: true, mustChangePassword: true } },
      _count: { select: { orders: true } },
    },
  })
  return rows.map((c) => ({
    id: c.id,
    cafeName: c.cafeName,
    contactName: c.contactName,
    contactPhone: c.contactPhone,
    contactEmail: c.contactEmail,
    googleMapsUrl: c.googleMapsUrl,
    createdAt: c.createdAt,
    isActive: c.user.isActive,
    lastLoginAt: c.user.lastLoginAt,
    mustChangePassword: c.user.mustChangePassword,
    orderCount: c._count.orders,
  }))
}
export type AdminCafe = Awaited<ReturnType<typeof listCafes>>[number]

export async function getCafeDetail(id: string) {
  await requireStaffPage()
  return db.cafeProfile.findUnique({
    where: { id },
    select: {
      id: true, cafeName: true, legalName: true, contactName: true, contactPhone: true, contactEmail: true,
      vatNumber: true, crNumber: true, internalNotes: true, preferredLocale: true, createdAt: true,
      user: { select: { isActive: true, lastLoginAt: true, mustChangePassword: true } },
      addresses: { where: { archivedAt: null }, orderBy: { isDefault: 'desc' } },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, orderNumber: true, type: true, status: true, totalHalalas: true, createdAt: true },
      },
    },
  })
}
export type AdminCafeDetail = NonNullable<Awaited<ReturnType<typeof getCafeDetail>>>

// ── Drivers ──────────────────────────────────────────────────────────────────

export async function listDrivers() {
  await requireStaffPage()
  const rows = await db.user.findMany({
    where: { role: 'DRIVER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, isActive: true, lastLoginAt: true, mustChangePassword: true, createdAt: true,
      _count: { select: { assignedDeliveries: true } },
    },
  })
  return rows.map((d) => ({
    id: d.id,
    name: d.name ?? '',
    email: d.email ?? '',
    isActive: d.isActive,
    lastLoginAt: d.lastLoginAt,
    mustChangePassword: d.mustChangePassword,
    createdAt: d.createdAt,
    deliveryCount: d._count.assignedDeliveries,
  }))
}
export type AdminDriver = Awaited<ReturnType<typeof listDrivers>>[number]

/** Active drivers, for the "assign a driver" dropdown on each delivery row. */
export async function listActiveDrivers() {
  await requireStaffPage()
  return db.user.findMany({
    where: { role: 'DRIVER', isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

// ── Returns ──────────────────────────────────────────────────────────────────

export async function listReturnRequests() {
  await requireStaffPage()
  return db.returnRequest.findMany({
    orderBy: [{ decision: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    select: {
      id: true, reason: true, decision: true, adminNotes: true, decidedAt: true, createdAt: true,
      cafe: { select: { cafeName: true, contactPhone: true } },
      decidedBy: { select: { name: true } },
      delivery: {
        select: {
          id: true, deliveryDate: true, subtotalHalalas: true,
          order: { select: { orderNumber: true } },
          items: { select: { id: true, titleSnapshot: true, quantity: true } },
        },
      },
    },
  })
}
export type AdminReturnRequest = Awaited<ReturnType<typeof listReturnRequests>>[number]

// ── Kitchen schedule (combined across every café) ───────────────────────────

/** Every open delivery from `fromISO` onward, for kitchen prep planning. */
export async function getKitchenSchedule(fromISO: string) {
  await requireStaffPage()
  const deliveries = await db.delivery.findMany({
    where: { deliveryDate: { gte: new Date(`${fromISO}T00:00:00Z`) }, status: { notIn: ['CANCELLED'] } },
    orderBy: { deliveryDate: 'asc' },
    select: {
      id: true, deliveryDate: true, status: true,
      order: { select: { orderNumber: true, type: true, cafe: { select: { cafeName: true } } } },
      items: { select: { id: true, titleSnapshot: true, quantity: true } },
    },
  })

  const byDate = new Map<string, typeof deliveries>()
  for (const d of deliveries) {
    const key = d.deliveryDate.toISOString().slice(0, 10)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(d)
  }

  return Array.from(byDate.entries()).map(([date, dayDeliveries]) => {
    const productTotals = new Map<string, number>()
    for (const d of dayDeliveries) {
      for (const item of d.items) productTotals.set(item.titleSnapshot, (productTotals.get(item.titleSnapshot) ?? 0) + item.quantity)
    }
    return {
      date,
      deliveries: dayDeliveries,
      productTotals: Array.from(productTotals.entries()).map(([title, quantity]) => ({ title, quantity })).sort((a, b) => b.quantity - a.quantity),
    }
  })
}
export type KitchenScheduleDay = Awaited<ReturnType<typeof getKitchenSchedule>>[number]

// ── Scheduling settings ─────────────────────────────────────────────────────

export async function getSchedulingSettings() {
  await requireStaffPage()
  return db.schedulingSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
}

export async function listBlackoutDates() {
  await requireStaffPage()
  return db.blackoutDate.findMany({ orderBy: { date: 'asc' } })
}
