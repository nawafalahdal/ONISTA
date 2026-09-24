import { setRequestLocale } from 'next-intl/server'
import Storefront from '@/components/storefront/storefront'
import type { AppLocale } from '@/i18n/routing'
import { getCatalog } from '@/server/queries/catalog'

// Statically prerendered per locale; refreshed whenever the admin changes the
// catalog (updateTag('catalog') in the product actions).
export default async function HomePage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const products = await getCatalog(locale)
  return <Storefront products={products} />
}
