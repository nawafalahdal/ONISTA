import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import CafeShell from '@/components/account/cafe-shell'
import { AppDocument } from '@/components/shared/app-document'
import { requireCafePage } from '@/server/dal/session'

export const metadata: Metadata = { title: 'Onista · Partner Portal', robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' } }
// Per-request by design (session + locale cookie): never prerendered.
export const instant = false

/**
 * Root layout of the protected café portal. The DAL check (and the
 * must-change-password redirect) runs before any markup is produced.
 * Pages, queries and actions re-check too: layouts do not re-run on every
 * client-side navigation.
 */
export default async function AccountPortalLayout({ children }: { children: ReactNode }) {
  const user = await requireCafePage()
  return (
    <AppDocument>
      <CafeShell cafeName={user.cafeName}>{children}</CafeShell>
    </AppDocument>
  )
}
