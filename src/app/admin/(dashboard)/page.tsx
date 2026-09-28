import Overview from '@/components/admin/overview'
import { getDashboardData } from '@/server/queries/admin'

export default async function AdminHome() {
  return <Overview data={await getDashboardData()} />
}
