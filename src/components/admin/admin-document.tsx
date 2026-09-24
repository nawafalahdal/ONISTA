import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { localeDirection, type AppLocale } from '@/i18n/routing'
import { fontVariables } from '@/styles/fonts'
import '@/styles/globals.css'

/** <html> shell shared by the two admin root layouts (auth and dashboard). */
export async function AdminDocument({ children }: { children: ReactNode }) {
  const locale = (await getLocale()) as AppLocale
  return (
    <html lang={locale} dir={localeDirection(locale)} className={fontVariables} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const adminMetadata = {
  title: 'Onista · Back office',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
}
