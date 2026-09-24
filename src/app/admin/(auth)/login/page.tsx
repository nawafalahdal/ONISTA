import { redirect } from 'next/navigation'
import { isStaffRole, safeAdminRedirect } from '@/config/security'
import { getSessionUser } from '@/server/dal/session'
import { LoginForm } from './login-form'

// PLACEHOLDER markup; styled in the UI phase.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams
  // Authoritative (database-backed) check, so revoked sessions stay here.
  const user = await getSessionUser()
  if (user && isStaffRole(user.role)) redirect(safeAdminRedirect(callbackUrl))

  return (
    <main className="p-8">
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  )
}
