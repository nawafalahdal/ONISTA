import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { AdminDocument, adminMetadata } from '@/components/admin/admin-document'

// Root layout for the public part of /admin (login only). The admin area
// shares no layout, providers or client bundle with the storefront.
export const metadata: Metadata = adminMetadata
export const instant = false

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return <AdminDocument>{children}</AdminDocument>
}
