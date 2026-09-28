import { cookies } from 'next/headers'
import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

/**
 * Resolves the locale for each request.
 * - Storefront (/[locale]/...): taken from the URL segment.
 * - Admin (/admin/..., not locale-prefixed): taken from the NEXT_LOCALE cookie
 *   so staff keep their language preference without a URL prefix.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!hasLocale(routing.locales, locale)) {
    const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value
    locale = hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Riyadh',
  }
})
