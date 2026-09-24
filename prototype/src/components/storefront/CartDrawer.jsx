import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { CloseButton, Drawer } from '../ui/Overlay.jsx'
import SmartImage from '../ui/SmartImage.jsx'
import { formatPrice } from '../../lib/format.js'
import { useStore } from '../../store/StoreProvider.jsx'

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { dispatch, cartLines, cartCount, cartTotal } = useStore()

  return (
    <Drawer open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <h2 className="font-display text-3xl">Your box</h2>
          <p className="text-xs text-muted">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} · <span dir="rtl">سلة المشتريات</span>
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {cartLines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-line text-muted">
            <ShoppingBag size={22} />
          </span>
          <p className="font-display text-2xl">Your box is empty</p>
          <p className="text-sm text-muted">Add a slice of something beautiful from the collection.</p>
          <button onClick={onClose} className="btn-ghost mt-2">
            Continue browsing
          </button>
        </div>
      ) : (
        <>
          <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            <AnimatePresence initial={false}>
              {cartLines.map(({ id, qty, product }) => (
                <motion.li
                  key={id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }}
                  className="flex gap-4 rounded-2xl border border-line bg-ink/50 p-3"
                >
                  <SmartImage src={product.image} alt={product.name} className="h-24 w-20 shrink-0 rounded-xl" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-lg leading-tight">{product.name}</p>
                      <button
                        onClick={() => dispatch({ type: 'cart/remove', id })}
                        aria-label={`Remove ${product.name}`}
                        className="text-muted transition hover:text-rose-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-xs text-muted">{formatPrice(product.price)} each</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-line">
                        <QtyButton label="Decrease" onClick={() => dispatch({ type: 'cart/setQty', id, qty: qty - 1 })}>
                          <Minus size={13} />
                        </QtyButton>
                        <span className="w-7 text-center text-sm tabular-nums">{qty}</span>
                        <QtyButton label="Increase" onClick={() => dispatch({ type: 'cart/setQty', id, qty: qty + 1 })}>
                          <Plus size={13} />
                        </QtyButton>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(product.price * qty)}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="space-y-4 border-t border-line bg-ink-2 px-6 py-6">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-xs text-muted/70">Delivery fees and VAT are calculated at checkout.</p>
            <button onClick={onCheckout} className="btn-primary w-full py-4">
              Checkout · {formatPrice(cartTotal)}
            </button>
          </div>
        </>
      )}
    </Drawer>
  )
}

function QtyButton({ label, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:text-cream"
    >
      {children}
    </button>
  )
}
