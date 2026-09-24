import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import SmartImage from '../ui/SmartImage.jsx'
import { CATEGORIES } from '../../data/seed.js'
import { formatPrice } from '../../lib/format.js'
import { useStore } from '../../store/StoreProvider.jsx'

const FILTERS = ['All', ...CATEGORIES]

export default function ProductsCatalog({ onAdded }) {
  const { state } = useStore()
  const [filter, setFilter] = useState('All')
  const products = state.products.filter((p) => filter === 'All' || p.category === filter)

  return (
    <section id="collection" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">The collection · <span dir="rtl">تشكيلتنا</span></p>
          <h2 className="mt-3 font-display text-[clamp(2.2rem,5vw,4rem)] font-medium leading-none">
            Made this morning.
          </h2>
        </motion.div>

        <div className="-mx-5 flex gap-1 overflow-x-auto px-5 no-scrollbar md:mx-0 md:px-0">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative shrink-0 rounded-full px-4 py-2 text-xs tracking-wide transition ${
                filter === f ? 'text-white' : 'text-muted hover:text-cream'
              }`}
            >
              {filter === f && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full bg-rose-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{f}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} onAdded={onAdded} />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

function ProductCard({ product, index, onAdded }) {
  const { dispatch } = useStore()
  const [justAdded, setJustAdded] = useState(false)

  const add = () => {
    dispatch({ type: 'cart/add', id: product.id })
    onAdded?.(product)
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
          src={product.image}
          alt={product.name}
          className={`aspect-[4/5] transition duration-[1.2s] ease-out group-hover:scale-[1.04] ${
            product.available ? '' : 'grayscale'
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex gap-2">
          {product.badge && (
            <span className="rounded-full bg-ink/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-300 backdrop-blur">
              {product.badge}
            </span>
          )}
          {!product.available && (
            <span className="rounded-full bg-ink/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur">
              Sold out today
            </span>
          )}
        </div>

        <button
          onClick={add}
          disabled={!product.available}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-4 right-4 flex h-12 items-center gap-2 overflow-hidden rounded-full bg-cream px-4 text-sm font-semibold text-ink shadow-xl transition hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
        >
          <AnimatePresence mode="wait" initial={false}>
            {justAdded ? (
              <motion.span key="ok" initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: -16 }} className="flex items-center gap-2">
                <Check size={16} /> Added
              </motion.span>
            ) : (
              <motion.span key="add" initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: -16 }} className="flex items-center gap-2">
                <Plus size={16} /> Add
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 px-1">
        <div>
          <h3 className="font-display text-2xl leading-tight">{product.name}</h3>
          <p className="mt-1 text-xs text-rose-300/80">
            <span dir="rtl">{product.nameAr}</span>
          </p>
        </div>
        <p className="shrink-0 pt-1 text-sm font-semibold text-cream">{formatPrice(product.price)}</p>
      </div>
      <p className="mt-2 px-1 text-sm leading-relaxed text-muted">{product.description}</p>
    </motion.article>
  )
}
