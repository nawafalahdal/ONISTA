import ClientsManager from '@/components/admin/clients-manager'
import { listCafes } from '@/server/queries/admin'

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ cafeName?: string; phone?: string }> }) {
  const [{ cafeName, phone }, cafes] = await Promise.all([searchParams, listCafes()])
  const prefill = cafeName || phone ? { cafeName: cafeName ?? '', phone: phone ?? '' } : undefined
  return <ClientsManager cafes={cafes} prefill={prefill} />
}
