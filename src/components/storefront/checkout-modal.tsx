'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Check, CreditCard, Loader2, Smartphone, Store, Truck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { placeOrder } from '@/server/actions/orders'
import { CloseButton, Modal } from '@/components/ui/overlay'
import { formatSar } from '@/lib/money'
import { computeTotals, type Fulfillment } from '@/lib/pricing'
import { useCart } from './cart-provider'

type Payment = 'CARD' | 'APPLE_PAY' | 'CASH'
type Phase = 'form' | 'processing' | 'done'

export default function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('Checkout')
  const tv = useTranslations('Validation')
  const locale = useLocale() as 'ar' | 'en'
  const { lines, subtotalHalalas, clear } = useCart()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    fulfillment: 'DELIVERY' as Fulfillment,
    payment: 'CARD' as Payment,
  })
  const [phase, setPhase] = useState<Phase>('form')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [orderRef, setOrderRef] = useState('')
  const [placed, setPlaced] = useState({ name: '', phone: '', fulfillment: 'DELIVERY' as Fulfillment })

  // Display estimate; the server recomputes the authoritative totals.
  const totals = computeTotals(subtotalHalalas, form.fulfillment)
  const price = (h: number) => formatSar(h, locale)
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const close = () => {
    onClose()
    setTimeout(() => {
      setPhase('form')
      setErrors({})
      setFormError(null)
    }, 300)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lines.length === 0) return
    setPhase('processing')
    setErrors({})
    setFormError(null)
    try {
      const res = await placeOrder({
        items: lines.map((l) => ({ productId: l.id, quantity: l.qty })),
        customerName: form.name,
        customerPhone: form.phone,
        fulfillment: form.fulfillment,
        deliveryAddress: form.fulfillment === 'DELIVERY' ? form.address : '',
        paymentMethod: form.payment,
        locale,
      })
      if (res.ok) {
        setOrderRef(`ORD-${res.data.orderNumber}`)
        setPlaced({ name: form.name.trim().split(/\s+/)[0] ?? '', phone: form.phone, fulfillment: form.fulfillment })
        clear()
        setPhase('done')
      } else {
        setErrors(res.fieldErrors ?? {})
        setFormError(res.fieldErrors?.items ? 'unavailableItems' : res.error === 'validation' ? 'completeFields' : res.error)
        setPhase('form')
      }
    } catch {
      setFormError('generic')
      setPhase('form')
    }
  }

  const has = (k: string) => Boolean(errors[k]?.length)
  const errorText = formError === 'completeFields' ? t('completeFields') : formError ? tv(formError as 'generic') : null

  const fulfillmentOptions = [
    { id: 'DELIVERY' as const, icon: Truck, label: t('delivery'), hint: t('deliveryHint') },
    { id: 'PICKUP' as const, icon: Store, label: t('pickup'), hint: t('pickupHint') },
  ]
  const paymentOptions = [
    { id: 'CARD' as const, icon: CreditCard, label: t('card') },
    { id: 'APPLE_PAY' as const, icon: Smartphone, label: t('applePay') },
    { id: 'CASH' as const, icon: Banknote, label: t('cash') },
  ]

  return (
    <Modal open={open} onClose={close} className="max-w-3xl">
      <div className="flex items-center justify-between border-b border-line px-6 py-5 md:px-8">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 className="mt-1 font-display text-3xl">{t('title')}</h2>
        </div>
        <CloseButton onClick={close} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'form' && (
          <motion.form
            key="form"
            exit={{ opacity: 0 }}
            onSubmit={submit}
            noValidate
            className="grid gap-8 px-6 py-6 md:grid-cols-[1.25fr_1fr] md:px-8"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-ink p-1">
                {fulfillmentOptions.map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => set('fulfillment', o.id)}
                    className={`relative flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition ${
                      form.fulfillment === o.id ? 'text-white' : 'text-muted hover:text-cream'
                    }`}
                  >
                    {form.fulfillment === o.id && (
                      <motion.span
                        layoutId="fulfillment"
                        className="absolute inset-0 rounded-xl bg-rose-600"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      <o.icon size={16} /> {o.label}
                      <span className="hidden text-[10px] opacity-70 sm:inline">· {o.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              <input
                className={`field ${has('customerName') ? 'border-rose-500/70' : ''}`}
                placeholder={t('name')}
                autoComplete="name"
                maxLength={100}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
              <input
                className={`field ${has('customerPhone') ? 'border-rose-500/70' : ''}`}
                placeholder={t('phone')}
                type="tel"
                autoComplete="tel"
                dir="ltr"
                maxLength={20}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
              <AnimatePresence initial={false}>
                {form.fulfillment === 'DELIVERY' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <textarea
                      rows={2}
                      className={`field resize-none ${has('deliveryAddress') ? 'border-rose-500/70' : ''}`}
                      placeholder={t('address')}
                      autoComplete="street-address"
                      maxLength={500}
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <p className="mb-2 text-xs text-muted">{t('payment')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {paymentOptions.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => set('payment', m.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs transition ${
                        form.payment === m.id ? 'border-rose-500 bg-rose-600/10 text-cream' : 'border-line text-muted hover:text-cream'
                      }`}
                    >
                      <m.icon size={17} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {errorText && <p className="text-xs text-rose-500">{errorText}</p>}
            </div>

            <div className="flex flex-col rounded-2xl border border-line bg-ink p-5">
              <p className="text-xs tracking-[0.2em] text-muted uppercase">{t('summary')}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-3">
                    <span className="text-muted">
                      <span dir="ltr">{l.qty}×</span> <span className="text-cream">{l.product.title}</span>
                    </span>
                    <span className="tabular-nums">{price(l.qty * l.product.priceHalalas)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm text-muted">
                <Row label={t('subtotal')} value={price(totals.subtotalHalalas)} />
                <Row label={t('deliveryFee')} value={price(totals.deliveryFeeHalalas)} />
                <Row label={t('vat')} value={price(totals.vatHalalas)} />
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-sm">{t('total')}</span>
                <span className="font-display text-3xl">{price(totals.totalHalalas)}</span>
              </div>
              <button type="submit" className="btn-primary mt-6 w-full py-4" disabled={lines.length === 0}>
                {t('place')}
              </button>
              <p className="mt-3 text-center text-[11px] text-muted/80">{t('prototypeNote')}</p>
            </div>
          </motion.form>
        )}

        {phase === 'processing' && (
          <motion.div
            key="p"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-28 text-muted"
          >
            <Loader2 className="animate-spin text-rose-500" size={30} /> {t('processing')}
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
            <p className="mt-6 text-xs tracking-[0.3em] text-muted uppercase" dir="ltr">
              {t('orderRef', { ref: orderRef })}
            </p>
            <h3 className="mt-2 font-display text-4xl">{t('thanks', { name: placed.name })}</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
              {placed.fulfillment === 'DELIVERY'
                ? t('bodyDelivery', { phone: placed.phone })
                : t('bodyPickup', { phone: placed.phone })}
            </p>
            <button type="button" onClick={close} className="btn-ghost mt-8">
              {t('back')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
