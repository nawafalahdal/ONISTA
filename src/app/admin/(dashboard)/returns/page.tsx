import ReturnsManager from '@/components/admin/returns-manager'
import { listReturnRequests } from '@/server/queries/admin'

export default async function ReturnsPage() {
  return <ReturnsManager requests={await listReturnRequests()} />
}
