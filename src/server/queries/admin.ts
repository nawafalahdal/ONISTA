import 'server-only'
import { db } from '@/server/db'
import { requireStaffPage } from '@/server/dal/session'

// Admin reads are never cached and always start with the DAL check, so the
// data cannot be reached even if a page forgets its own guard.

export async function getDashboardCounts() {
  await requireStaffPage()
  const [openOrders, newTastingRequests, liveProducts] = await Promise.all([
    db.order.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
    db.tastingRequest.count({ where: { status: 'NEW' } }),
    db.product.count({ where: { archivedAt: null, inStock: true } }),
  ])
  return { openOrders, newTastingRequests, liveProducts }
}

export async function listTastingRequests() {
  await requireStaffPage()
  return db.tastingRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, requestNumber: true, status: true, cafeName: true, contactName: true, phone: true,
      email: true, city: true, notes: true, staffNotes: true, locale: true, createdAt: true,
      selectedProducts: { select: { productId: true, titleSnapshot: true } },
    },
  })
}
