import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import Storefront from '@/components/storefront/storefront'
import { routing } from '@/i18n/routing'
import { getCatalog } from '@/server/queries/catalog'

// Statically prerendered per locale; refreshed whenever the admin changes the
// catalog (updateTag('catalog') in the product actions).
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // The page renders in parallel with the layout, so it must validate the
  // segment itself (e.g. a browser asking for /favicon.ico lands here).
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const products = await getCatalog(locale)
  return <Storefront products={products} />
}
