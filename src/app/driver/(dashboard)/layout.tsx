import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import DriverShell from '@/components/driver/driver-shell'
import { AppDocument } from '@/components/shared/app-document'
import { requireDriverPage } from '@/server/dal/session'

export const metadata: Metadata = { title: 'Onista · Driver', robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' } }
// Per-request by design (session + locale cookie): never prerendered.
export const instant = false

export default async function DriverDashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireDriverPage()
  return (
    <AppDocument>
      <DriverShell driverName={user.name ?? ''}>{children}</DriverShell>
    </AppDocument>
  )
}
