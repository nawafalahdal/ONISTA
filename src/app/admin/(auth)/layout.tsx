import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { AppDocument } from '@/components/shared/app-document'

// Root layout for the public part of /admin (login only). The admin area
// shares no layout, providers or client bundle with the storefront.
export const metadata: Metadata = { title: 'Onista · Back office', robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' } }
export const instant = false

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return <AppDocument>{children}</AppDocument>
}
