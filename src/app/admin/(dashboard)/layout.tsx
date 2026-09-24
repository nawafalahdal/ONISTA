import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import AdminShell from '@/components/admin/admin-shell'
import { AppDocument } from '@/components/shared/app-document'
import { requireStaffPage } from '@/server/dal/session'
import { getNavCounts } from '@/server/queries/admin'

export const metadata: Metadata = { title: 'Onista · Back office', robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' } }
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
    <AppDocument>
      <AdminShell user={{ email: user.email, role: user.role }} counts={counts}>
        {children}
      </AdminShell>
    </AppDocument>
  )
}
