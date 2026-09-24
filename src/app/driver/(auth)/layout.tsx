import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { AppDocument } from '@/components/shared/app-document'

export const metadata: Metadata = { title: 'Onista · Driver', robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' } }
export const instant = false

export default function DriverAuthLayout({ children }: { children: ReactNode }) {
  return <AppDocument>{children}</AppDocument>
}
