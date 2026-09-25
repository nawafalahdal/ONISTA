import OrdersList from '@/components/account/orders-list'
import { getCafeOrders } from '@/server/queries/cafe'

export default async function AccountOrdersPage() {
  return <OrdersList orders={await getCafeOrders()} />
}
