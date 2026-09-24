import DeliveriesToday from '@/components/driver/deliveries-today'
import { getDriverDeliveriesToday } from '@/server/queries/driver'

export default async function DriverPage() {
  return <DeliveriesToday deliveries={await getDriverDeliveriesToday()} />
}
