import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  // Every storefront URL carries its locale (/ar/..., /en/...) so pages are
  // cacheable per language and shareable links keep their language.
  localePrefix: 'always',
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' },
})

export type AppLocale = (typeof routing.locales)[number]

export const localeDirection = (locale: AppLocale) => (locale === 'ar' ? 'rtl' : 'ltr')
