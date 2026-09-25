import AddressesManager from '@/components/account/addresses-manager'
import { getCafeAddresses } from '@/server/queries/cafe'

export default async function AddressesPage() {
  return <AddressesManager addresses={await getCafeAddresses()} />
}
