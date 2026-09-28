import DriversManager from '@/components/admin/drivers-manager'
import { listDrivers } from '@/server/queries/admin'

export default async function DriversPage() {
  return <DriversManager drivers={await listDrivers()} />
}
