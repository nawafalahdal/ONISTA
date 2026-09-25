import TastingTable from '@/components/admin/tasting-table'
import { listTastingRequests } from '@/server/queries/admin'

export default async function TastingRequestsPage() {
  return <TastingTable requests={await listTastingRequests()} />
}
