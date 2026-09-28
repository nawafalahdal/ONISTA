import KitchenSchedule from '@/components/admin/kitchen-schedule'
import { getKitchenSchedule } from '@/server/queries/admin'
import { getSchedulingContext } from '@/server/scheduling'

export default async function AdminSchedulePage() {
  const { todayISO } = await getSchedulingContext()
  return <KitchenSchedule days={await getKitchenSchedule(todayISO)} />
}
