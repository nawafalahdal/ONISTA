import OrdersTable from '@/components/admin/orders-table'
import { listActiveDrivers, listOrders } from '@/server/queries/admin'

export default async function OrdersPage() {
  const [orders, drivers] = await Promise.all([listOrders(), listActiveDrivers()])
  return <OrdersTable orders={orders} drivers={drivers} />
}
