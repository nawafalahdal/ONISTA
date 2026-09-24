import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { AdminDocument, adminMetadata } from '@/components/admin/admin-document'
import { logout } from '@/server/actions/auth'
import { requireStaffPage } from '@/server/dal/session'

export const metadata: Metadata = adminMetadata
// Per-request by design (session + locale cookie): never prerendered.
export const instant = false

/**
 * Root layout of the protected dashboard. The DAL check runs BEFORE any
 * markup is produced, so an invalid session is answered with a real HTTP
 * redirect/404 and not a single byte of the admin shell is streamed.
 * Pages, queries and actions re-check too: layouts do not re-run on every
 * client-side navigation.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireStaffPage()
  return (
    <AdminDocument>
      {/* PLACEHOLDER chrome: sidebar/header are ported in the UI phase. */}
      <div className="p-8">
        <header className="flex justify-between">
          <span>{user.email} · {user.role}</span>
          <form action={logout}><button type="submit">Sign out</button></form>
        </header>
        {children}
      </div>
    </AdminDocument>
  )
}
