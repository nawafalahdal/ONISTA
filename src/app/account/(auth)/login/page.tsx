import { redirect } from 'next/navigation'
import { isCafeRole, safeAccountRedirect } from '@/config/security'
import { getSessionUser } from '@/server/dal/session'
import { LoginForm } from './login-form'

export default async function CafeLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams
  // Authoritative (database-backed) check, so a revoked session stays here.
  const user = await getSessionUser()
  if (user && isCafeRole(user.role)) redirect(safeAccountRedirect(callbackUrl))

  return (
    <main className="grain relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--c-glow),transparent_60%)]" />
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  )
}
