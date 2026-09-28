import Dashboard from '@/components/account/dashboard'
import { requireCafePage } from '@/server/dal/session'
import { getCafeOverview, getUpcomingDeliveries } from '@/server/queries/cafe'
import { getSchedulingContext } from '@/server/scheduling'

export default async function AccountDashboardPage() {
  const user = await requireCafePage()
  const [deliveries, ctx, overview] = await Promise.all([getUpcomingDeliveries(), getSchedulingContext(), getCafeOverview()])
  return <Dashboard cafeName={user.cafeName} cutoffHour={ctx.cutoffHour} deliveries={deliveries} overview={overview} />
}
