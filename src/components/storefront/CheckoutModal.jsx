import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Check, CreditCard, Loader2, Smartphone, Store, Truck } from 'lucide-react'
import { CloseButton, Modal } from '../ui/Overlay.jsx'
import { formatPrice } from '../../lib/format.js'
import { useStore } from '../../store/StoreProvider.jsx'

const DELIVERY_FEE = 25
const VAT = 0.15

const FULFILLMENT = [
  { id: 'Delivery', icon: Truck, hint: 'Same-day, 2–4h' },
  { id: 'Pickup', icon: Store, hint: 'Ready in 45 min' },
]
const PAYMENT = [
  { id: 'Card', icon: CreditCard },
  { id: 'Apple Pay', icon: Smartphone },
  { id: 'Cash', icon: Banknote },
]

export default function CheckoutModal({ open, onClose }) {
  const { state, dispatch, cartLines, cartTotal } = useStore()
  const [form, setForm] = useState({ name: '', phone: '', address: '', fulfillment: 'Delivery', payment: 'Card' })
  const [touched, setTouched] = useState(false)
  const [phase, setPhase] = useState('form') // form | processing | done

  const delivery = form.fulfillment === 'Delivery' ? DELIVERY_FEE : 0
  const vat = (cartTotal + delivery) * VAT
  const total = cartTotal + delivery + vat

  const errors = {
    name: !form.name.trim(),
    phone: form.phone.replace(/\D/g, '').length < 9,
    address: form.fulfillment === 'Delivery' && !form.address.trim(),
  }
  const valid = !Object.values(errors).some(Boolean)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const close = () => {
    onClose()
    setTimeout(() => {
      setPhase('form')
      setTouched(false)
    }, 300)
  }

  const place = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || cartLines.length === 0) return
    setPhase('processing')
    setTimeout(() => {
      dispatch({
        type: 'orders/place',
        order: {
          customer: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          fulfillment: form.fulfillment,
          payment: form.payment,
          items: cartLines.map((l) => ({ id: l.id, name: l.product.name, qty: l.qty, price: l.product.price })),
          total: Math.round(total * 100) / 100,
        },
      })
      setPhase('done')
    }, 1400)
  }

  return (
    <Modal open={open} onClose={close} className="max-w-3xl">
      <div className="flex items-center justify-between border-b border-line px-6 py-5 md:px-8">
        <div>
          <p className="eyebrow">Secure checkout</p>
          <h2 className="mt-1 font-display text-3xl">Almost yours</h2>
        </div>
        <CloseButton onClick={close} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'form' && (
          <motion.form
            key="form"
            exit={{ opacity: 0 }}
            onSubmit={place}
            noValidate
            className="grid gap-8 px-6 py-6 md:grid-cols-[1.25fr_1fr] md:px-8"
          >
            <div className="space-y-5">
              <Segmented
                options={FULFILLMENT}
                value={form.fulfillment}
                onChange={(v) => set('fulfillment', v)}
              />
              <input
                className={`field ${touched && errors.name ? 'border-rose-500/70' : ''}`}
                placeholder="Full name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
              <input
                className={`field ${touched && errors.phone ? 'border-rose-500/70' : ''}`}
                placeholder="Mobile number"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
              <AnimatePresence initial={false}>
                {form.fulfillment === 'Delivery' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <textarea
                      rows={2}
                      className={`field resize-none ${touched && errors.address ? 'border-rose-500/70' : ''}`}
                      placeholder="Delivery address"
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <p className="mb-2 text-xs text-muted">Payment method</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => set('payment', m.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs transition ${
                        form.payment === m.id ? 'border-rose-500 bg-rose-600/10 text-cream' : 'border-line text-muted hover:text-cream'
                      }`}
                    >
                      <m.icon size={17} /> {m.id}
                    </button>
                  ))}
                </div>
              </div>
              {touched && !valid && <p className="text-xs text-rose-400">Please complete the highlighted fields.</p>}
            </div>

            <div className="flex flex-col rounded-2xl border border-line bg-ink p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Order summary</p>
              <ul className="mt-4 space-y-2 text-sm">
                {cartLines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-3">
                    <span className="text-muted">
                      {l.qty}× <span className="text-cream">{l.product.name}</span>
                    </span>
                    <span className="tabular-nums">{formatPrice(l.qty * l.product.price)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm text-muted">
                <Row label="Subtotal" value={cartTotal} />
                <Row label="Delivery" value={delivery} />
                <Row label="VAT (15%)" value={vat} />
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-sm">Total</span>
                <span className="font-display text-3xl">{formatPrice(total)}</span>
              </div>
              <button type="submit" className="btn-primary mt-6 w-full py-4" disabled={cartLines.length === 0}>
                Place order
              </button>
              <p className="mt-3 text-center text-[11px] text-muted/70">Prototype: no payment will be taken.</p>
            </div>
          </motion.form>
        )}

        {phase === 'processing' && (
          <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-28 text-muted">
            <Loader2 className="animate-spin text-rose-400" size={30} /> Processing payment…
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="d" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-8 py-16 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 14 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-600 text-white shadow-[0_0_60px_rgba(224,51,127,0.5)]"
            >
              <Check size={36} strokeWidth={2.5} />
            </motion.div>
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted">Order {state.orders[0]?.id}</p>
            <h3 className="mt-2 font-display text-4xl">Thank you, {form.name.split(' ')[0]}.</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
              Your order is in the oven. We'll text {form.phone} when it's{' '}
              {form.fulfillment === 'Delivery' ? 'out for delivery' : 'ready for pickup'}.
            </p>
            <p dir="rtl" className="mt-2 text-sm text-rose-300">شكراً لطلبك من أونيستا</p>
            <button onClick={close} className="btn-ghost mt-8">
              Back to the shop
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatPrice(value)}</dd>
    </div>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-ink p-1">
      {options.map((o) => (
        <button
          type="button"
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`relative flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition ${
            value === o.id ? 'text-white' : 'text-muted hover:text-cream'
          }`}
        >
          {value === o.id && (
            <motion.span layoutId="fulfillment" className="absolute inset-0 rounded-xl bg-rose-600" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
          )}
          <span className="relative flex items-center gap-2">
            <o.icon size={16} /> {o.id}
            <span className="hidden text-[10px] opacity-70 sm:inline">· {o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
