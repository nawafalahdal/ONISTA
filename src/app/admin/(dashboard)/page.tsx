import { getDashboardCounts } from '@/server/queries/admin'

// PLACEHOLDER: replaced by the ported dashboard in the UI phase.
export default async function AdminHome() {
  const counts = await getDashboardCounts()
  return <pre className="mt-6">{JSON.stringify(counts, null, 2)}</pre>
}
