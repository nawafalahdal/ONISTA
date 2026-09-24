import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import AdminShell from '@/components/admin/admin-shell'
import { AdminDocument, adminMetadata } from '@/components/admin/admin-document'
import { requireStaffPage } from '@/server/dal/session'
import { getNavCounts } from '@/server/queries/admin'

export const metadata: Metadata = adminMetadata
// Per-request by design (session + locale cookie): never prerendered.
export const instant = false

/**
 * Root layout of the protected dashboard. The DAL check runs BEFORE any
 * markup is produced, so an invalid session is answered with a redirect/404
 * and not a single byte of the admin shell is streamed. Pages, queries and
 * actions re-check too: layouts do not re-run on every client navigation.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireStaffPage()
  const counts = await getNavCounts()
  return (
    <AdminDocument>
      <AdminShell user={{ email: user.email, role: user.role }} counts={counts}>
        {children}
      </AdminShell>
    </AdminDocument>
  )
}
