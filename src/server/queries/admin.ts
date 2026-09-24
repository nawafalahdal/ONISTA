import 'server-only'
import type { Locale } from '@/generated/prisma/enums'
import { db } from '@/server/db'
import { requireStaffPage } from '@/server/dal/session'

// Admin reads are never cached and always start with the DAL check, so the
// data cannot be reached even if a page forgets its own guard. Every function
// returns a plain DTO: only the fields the admin UI actually renders.

const OPEN_ORDER = { notIn: ['DELIVERED', 'CANCELLED'] as ('DELIVERED' | 'CANCELLED')[] }

export async function getNavCounts() {
  await requireStaffPage()
  const [newOrders, newRequests] = await Promise.all([
    db.order.count({ where: { status: 'PENDING' } }),
    db.tastingRequest.count({ where: { status: 'NEW' } }),
  ])
  return { newOrders, newRequests }
}

export async function getDashboardData() {
  await requireStaffPage()
  const [revenue, orderCount, openOrders, newRequests, totalRequests, liveProducts, tastingProducts, recentOrders, recentRequests, top] =
    await Promise.all([
      db.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalHalalas: true } }),
      db.order.count({ where: { status: { not: 'CANCELLED' } } }),
      db.order.count({ where: { status: OPEN_ORDER } }),
      db.tastingRequest.count({ where: { status: 'NEW' } }),
      db.tastingRequest.count(),
      db.product.count({ where: { archivedAt: null, inStock: true } }),
      db.product.count({ where: { archivedAt: null, isTastingMenu: true } }),
      db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, orderNumber: true, customerName: true, totalHalalas: true, createdAt: true },
      }),
      db.tastingRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, requestNumber: true, cafeName: true, createdAt: true, _count: { select: { selectedProducts: true } } },
      }),
      db.orderItem.groupBy({
        by: ['titleSnapshot'],
        where: { order: { status: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ])

  const activity = [
    ...recentOrders.map((o) => ({
      kind: 'order' as const,
      id: o.id,
      ref: `ORD-${o.orderNumber}`,
      who: o.customerName,
      amountHalalas: o.totalHalalas,
      samples: 0,
      at: o.createdAt,
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
    tastingProducts,
    activity,
    bestSellers: top.map((t) => ({ title: t.titleSnapshot, qty: t._sum.quantity ?? 0 })),
  }
}
export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export async function listOrders() {
  await requireStaffPage()
  const orders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      fulfillment: true,
      paymentMethod: true,
      customerName: true,
      customerPhone: true,
      deliveryAddress: true,
      totalHalalas: true,
      createdAt: true,
      items: { select: { id: true, titleSnapshot: true, quantity: true } },
    },
  })
  return orders
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
      id: true, slug: true, priceHalalas: true, inStock: true, isTastingMenu: true, isFeatured: true,
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
