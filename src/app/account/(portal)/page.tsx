import Dashboard from '@/components/account/dashboard'
import { requireCafePage } from '@/server/dal/session'
import { getUpcomingDeliveries } from '@/server/queries/cafe'
import { getSchedulingContext } from '@/server/scheduling'

export default async function AccountDashboardPage() {
  const user = await requireCafePage()
  const [deliveries, ctx] = await Promise.all([getUpcomingDeliveries(), getSchedulingContext()])
  return <Dashboard cafeName={user.cafeName} cutoffHour={ctx.cutoffHour} deliveries={deliveries} />
}
