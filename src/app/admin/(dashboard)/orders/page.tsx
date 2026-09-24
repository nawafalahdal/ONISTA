import OrdersTable from '@/components/admin/orders-table'
import { listOrders } from '@/server/queries/admin'

export default async function OrdersPage() {
  return <OrdersTable orders={await listOrders()} />
}
