import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { localeDirection, type AppLocale } from '@/i18n/routing'
import '@/styles/globals.css'

/** <html> shell shared by the two admin root layouts (auth and dashboard). */
export async function AdminDocument({ children }: { children: ReactNode }) {
  const locale = (await getLocale()) as AppLocale
  return (
    <html lang={locale} dir={localeDirection(locale)} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}

export const adminMetadata = {
  title: 'Onista · Back office',
  robots: { index: false, follow: false },
}
