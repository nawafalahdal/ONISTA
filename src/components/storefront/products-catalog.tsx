'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { CatalogProduct } from '@/server/queries/catalog'
import SmartImage from '@/components/ui/smart-image'
import { formatSar } from '@/lib/money'
import { useCart } from './cart-provider'

export default function ProductsCatalog({
  products,
  onAdded,
}: {
  products: CatalogProduct[]
  onAdded: (p: CatalogProduct) => void
}) {
  const t = useTranslations('Catalog')
  const [filter, setFilter] = useState('all')

  // Categories in catalog order, de-duplicated.
  const categories = [...new Map(products.map((p) => [p.category.slug, p.category.name])).entries()]
  const filters = [['all', t('all')], ...categories]
  const visible = products.filter((p) => filter === 'all' || p.category.slug === filter)

  return (
    <section id="collection" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 className="mt-3 font-display text-[clamp(2.2rem,5vw,4rem)] font-medium leading-tight">{t('title')}</h2>
        </motion.div>

        <div className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
          {filters.map(([slug, label]) => (
            <button
              type="button"
              key={slug}
              onClick={() => setFilter(slug!)}
              className={`relative shrink-0 rounded-full px-4 py-2 text-xs tracking-wide transition ${
                filter === slug ? 'text-white' : 'text-muted hover:text-cream'
              }`}
            >
              {filter === slug && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full bg-rose-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} onAdded={onAdded} />
          ))}
        </AnimatePresence>
      </motion.div>
      {visible.length === 0 && <p className="mt-12 text-center text-muted">{t('empty')}</p>}
    </section>
  )
}

function ProductCard({
  product,
  index,
  onAdded,
}: {
  product: CatalogProduct
  index: number
  onAdded: (p: CatalogProduct) => void
}) {
  const t = useTranslations('Catalog')
  const locale = useLocale() as 'ar' | 'en'
  const { add } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const handleAdd = () => {
    add(product.id)
    onAdded(product)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1400)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-[1.75rem] border border-line">
        <SmartImage
          src={product.images[0]?.url}
          alt={product.images[0]?.alt ?? product.title}
          className={`aspect-[4/5] transition duration-[1.2s] ease-out group-hover:scale-[1.04] ${
            product.inStock ? '' : 'grayscale'
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute start-4 top-4 flex gap-2">
          {product.badge && (
            <span className="rounded-full bg-black/55 px-3 py-1 text-[10px] tracking-[0.2em] text-rose-200 uppercase backdrop-blur">
              {product.badge}
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-black/55 px-3 py-1 text-[10px] tracking-[0.2em] text-white/80 uppercase backdrop-blur">
              {t('soldOut')}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.inStock}
          aria-label={t('addAria', { name: product.title })}
          className="absolute bottom-4 end-4 flex h-12 items-center gap-2 overflow-hidden rounded-full bg-white px-4 text-sm font-semibold text-[#1d1518] shadow-xl transition hover:bg-rose-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
        >
          <AnimatePresence mode="wait" initial={false}>
            {justAdded ? (
              <motion.span key="ok" initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: -16 }} className="flex items-center gap-2">
                <Check size={16} /> {t('added')}
              </motion.span>
            ) : (
              <motion.span key="add" initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: -16 }} className="flex items-center gap-2">
                <Plus size={16} /> {t('add')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 px-1">
        <div>
          <h3 className="font-display text-2xl leading-tight">{product.title}</h3>
          <p className="mt-1 text-xs text-rose-500 dark:text-rose-300/80">{product.category.name}</p>
        </div>
        <p className="shrink-0 pt-1 text-sm font-semibold text-cream">{formatSar(product.priceHalalas, locale)}</p>
      </div>
      <p className="mt-2 px-1 text-sm leading-relaxed text-muted">{product.description}</p>
    </motion.article>
  )
}
