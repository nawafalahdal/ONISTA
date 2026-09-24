import { setRequestLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/routing'
import { formatSar } from '@/lib/money'
import { getCatalog } from '@/server/queries/catalog'

// PLACEHOLDER: proves the cached catalog query end to end. Replaced by the
// ported storefront (hero, catalog, tasting modal, cart) in the UI phase.
export default async function HomePage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const products = await getCatalog(locale)

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Onista</h1>
      <ul className="mt-4 space-y-1">
        {products.map((p) => (
          <li key={p.id}>
            {p.title} · {p.category.name} · {formatSar(p.priceHalalas, locale)}
            {p.isTastingMenu && ' · ☕'}
            {!p.inStock && ' · —'}
          </li>
        ))}
      </ul>
    </main>
  )
}
