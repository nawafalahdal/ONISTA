import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { AppDocument } from '@/components/shared/app-document'
import { ACCOUNT_CHANGE_PASSWORD_PATH } from '@/config/security'
import { requireCafePage } from '@/server/dal/session'

export const metadata: Metadata = { title: 'Onista · Partner Portal', robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' } }
export const instant = false

/**
 * Owns the one page a café must reach even with `mustChangePassword` set:
 * passing this exact path to `requireCafePage` stops the (portal) layout's
 * redirect loop from bouncing back here.
 */
export default async function AccountSetupLayout({ children }: { children: ReactNode }) {
  await requireCafePage(ACCOUNT_CHANGE_PASSWORD_PATH)
  return <AppDocument>{children}</AppDocument>
}
