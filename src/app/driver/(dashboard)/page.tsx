import DeliveriesToday from '@/components/driver/deliveries-today'
import { getDriverDayStats, getDriverDeliveriesToday } from '@/server/queries/driver'

export default async function DriverPage() {
  const [run, stats] = await Promise.all([getDriverDeliveriesToday(), getDriverDayStats()])
  return <DeliveriesToday deliveries={run.deliveries} kitchenGoogleMapsUrl={run.kitchenGoogleMapsUrl} stats={stats} />
}
