'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { CloseButton, Drawer } from '@/components/ui/overlay'
import SmartImage from '@/components/ui/smart-image'
import { formatSar } from '@/lib/money'
import { useCart } from './cart-provider'

export default function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean
  onClose: () => void
  onCheckout: () => void
}) {
  const t = useTranslations('Cart')
  const locale = useLocale() as 'ar' | 'en'
  const { lines, count, subtotalHalalas, setQty, remove } = useCart()
  const price = (h: number) => formatSar(h, locale)

  return (
    <Drawer open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <h2 className="font-display text-3xl">{t('title')}</h2>
          <p className="text-xs text-muted">{t('count', { count })}</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-line text-muted">
            <ShoppingBag size={22} />
          </span>
          <p className="font-display text-2xl">{t('emptyTitle')}</p>
          <p className="text-sm text-muted">{t('emptyBody')}</p>
          <button type="button" onClick={onClose} className="btn-ghost mt-2">
            {t('continue')}
          </button>
        </div>
      ) : (
        <>
          <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            <AnimatePresence initial={false}>
              {lines.map(({ id, qty, product }) => (
                <motion.li
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="flex gap-4 rounded-2xl border border-line bg-ink/50 p-3"
                >
                  <SmartImage src={product.images[0]?.url} alt={product.title} className="h-24 w-20 shrink-0 rounded-xl" sizes="80px" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-lg leading-tight">{product.title}</p>
                      <button
                        type="button"
                        onClick={() => remove(id)}
                        aria-label={t('remove', { name: product.title })}
                        className="text-muted transition hover:text-rose-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-xs text-muted">{t('each', { price: price(product.priceHalalas) })}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-line" dir="ltr">
                        <QtyButton label={t('decrease')} onClick={() => setQty(id, qty - 1)}>
                          <Minus size={13} />
                        </QtyButton>
                        <span className="w-7 text-center text-sm tabular-nums">{qty}</span>
                        <QtyButton label={t('increase')} onClick={() => setQty(id, qty + 1)}>
                          <Plus size={13} />
                        </QtyButton>
                      </div>
                      <p className="text-sm font-semibold">{price(product.priceHalalas * qty)}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="space-y-4 border-t border-line bg-ink-2 px-6 py-6">
            <div className="flex justify-between text-sm text-muted">
              <span>{t('subtotal')}</span>
              <span className="tabular-nums">{price(subtotalHalalas)}</span>
            </div>
            <p className="text-xs text-muted/80">{t('feesNote')}</p>
            <button type="button" onClick={onCheckout} className="btn-primary w-full py-4">
              {t('checkout', { total: price(subtotalHalalas) })}
            </button>
          </div>
        </>
      )}
    </Drawer>
  )
}

function QtyButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:text-cream"
    >
      {children}
    </button>
  )
}
