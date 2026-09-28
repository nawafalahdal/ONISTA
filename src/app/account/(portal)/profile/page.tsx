import ProfileCard from '@/components/account/profile-card'
import { getCafeProfile } from '@/server/queries/cafe'

export default async function AccountProfilePage() {
  return <ProfileCard profile={await getCafeProfile()} />
}
