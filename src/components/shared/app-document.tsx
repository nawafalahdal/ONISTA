import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { localeDirection, type AppLocale } from '@/i18n/routing'
import { fontVariables } from '@/styles/fonts'
import '@/styles/globals.css'

/**
 * <html> shell shared by every non-locale-prefixed area (admin back office,
 * café partner portal). Locale comes from the NEXT_LOCALE cookie, since
 * these areas have no /ar, /en URL segment.
 */
export async function AppDocument({ children }: { children: ReactNode }) {
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
