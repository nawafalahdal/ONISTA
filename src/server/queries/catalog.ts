import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import type { Locale } from '@/generated/prisma/enums'
import { db } from '@/server/db'

/** Cache tags. Mutations call `updateTag(...)` with these. */
export const TAGS = {
  catalog: 'catalog',
  product: (id: string) => `product:${id}`,
} as const

/** Public product DTO: only fields safe to send to any visitor. */
export type CatalogProduct = {
  id: string
  slug: string
  priceHalalas: number
  inStock: boolean
  isTastingMenu: boolean
  isFeatured: boolean
  title: string
  description: string
  badge: string | null
  category: { slug: string; name: string }
  images: { url: string; alt: string }[]
}

const visible = { archivedAt: null } as const

async function loadCatalog(locale: Locale, where: object = {}): Promise<CatalogProduct[]> {
  const rows = await db.product.findMany({
    where: { ...visible, ...where },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true, slug: true, priceHalalas: true, inStock: true, isTastingMenu: true, isFeatured: true,
      translations: { where: { locale }, select: { title: true, description: true, badge: true } },
      category: { select: { slug: true, translations: { where: { locale }, select: { name: true } } } },
      images: { orderBy: { position: 'asc' }, select: { url: true, altAr: true, altEn: true } },
    },
  })

  return rows.flatMap((p) => {
    const t = p.translations[0]
    if (!t) return [] // not translated into this locale yet → hide
    return [{
      id: p.id,
      slug: p.slug,
      priceHalalas: p.priceHalalas,
      inStock: p.inStock,
      isTastingMenu: p.isTastingMenu,
      isFeatured: p.isFeatured,
      title: t.title,
      description: t.description,
      badge: t.badge,
      category: { slug: p.category.slug, name: p.category.translations[0]?.name ?? p.category.slug },
      images: p.images.map((i) => ({ url: i.url, alt: (locale === 'ar' ? i.altAr : i.altEn) ?? t.title })),
    }]
  })
}

/** Full storefront catalog (in-stock and sold-out items). */
export async function getCatalog(locale: Locale) {
  'use cache'
  cacheTag(TAGS.catalog)
  cacheLife('hours')
  return loadCatalog(locale)
}

/** Items cafés may request as samples: tasting-menu, in stock, not archived. */
export async function getTastingMenu(locale: Locale) {
  'use cache'
  cacheTag(TAGS.catalog)
  cacheLife('hours')
  return loadCatalog(locale, { isTastingMenu: true, inStock: true })
}
