'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Check, CreditCard, Loader2, Plus, Smartphone, Trash2 } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { CatalogProduct } from '@/server/queries/catalog'
import type { CafeAddressRow } from '@/server/queries/cafe'
import { createCafeAddress } from '@/server/actions/cafe-addresses'
import { submitOneOffOrder, submitWeeklySchedule } from '@/server/actions/orders'
import { computeTotals } from '@/lib/pricing'
import { formatSar } from '@/lib/money'
import { JEDDAH } from '@/lib/constants'

type Mode = 'one-off' | 'weekly'
type Line = { key: string; productId: string; quantity: number }
type Day = { key: string; date: string; lines: Line[] }
type Payment = 'CARD' | 'APPLE_PAY' | 'BANK_TRANSFER'

const uid = () => Math.random().toString(36).slice(2)
const emptyDay = (date: string): Day => ({ key: uid(), date, lines: [{ key: uid(), productId: '', quantity: 1 }] })

export default function ScheduleBuilder({
  initialMode,
  products,
  addresses,
  earliestDate,
  allowedDates,
  deliveryFeeHalalas,
}: {
  initialMode: Mode
  products: CatalogProduct[]
  addresses: CafeAddressRow[]
  earliestDate: string
  allowedDates: string[]
  deliveryFeeHalalas: number
}) {
  const t = useTranslations('Account.Schedule')
  const taddr = useTranslations('Account.Addresses')
  const tv = useTranslations('Validation')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()

  const [mode, setMode] = useState<Mode>(initialMode)
  const [days, setDays] = useState<Day[]>([emptyDay(earliestDate)])
  const [addressId, setAddressId] = useState<string>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? '__new')
  const [newAddress, setNewAddress] = useState({ label: '', city: JEDDAH[locale], district: '', street: '', buildingNumber: '', additionalNumber: '', postalCode: '' })
  const [payment, setPayment] = useState<Payment>('CARD')
  const [notes, setNotes] = useState('')
  const [phase, setPhase] = useState<'form' | 'submitting' | 'done'>('form')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ ref: string } | null>(null)

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const usedDates = new Set(days.map((d) => d.date))

  const switchMode = (m: Mode) => {
    setMode(m)
    setDays(m === 'one-off' ? [days[0] ?? emptyDay(earliestDate)] : days)
  }

  const setDay = (key: string, patch: Partial<Day>) => setDays((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  const addDay = () => {
    const next = allowedDates.find((d) => !usedDates.has(d))
    if (next) setDays((ds) => [...ds, emptyDay(next)])
  }
  const removeDay = (key: string) => setDays((ds) => (ds.length > 1 ? ds.filter((d) => d.key !== key) : ds))

  const setLines = (dayKey: string, lines: Line[]) => setDay(dayKey, { lines })
  const addLine = (dayKey: string) =>
    setDays((ds) => ds.map((d) => (d.key === dayKey ? { ...d, lines: [...d.lines, { key: uid(), productId: '', quantity: 1 }] } : d)))
  const removeLine = (dayKey: string, lineKey: string) =>
    setDays((ds) => ds.map((d) => (d.key === dayKey ? { ...d, lines: d.lines.filter((l) => l.key !== lineKey) } : d)))

  const dayTotal = (day: Day) => day.lines.reduce((n, l) => n + (byId.get(l.productId)?.priceHalalas ?? 0) * l.quantity, 0)
  const subtotal = days.reduce((n, d) => n + dayTotal(d), 0)
  const totals = computeTotals(subtotal, days.length, deliveryFeeHalalas)
  const usingNewAddress = addressId === '__new'
  const canSubmit =
    days.every((d) => d.lines.some((l) => l.productId && l.quantity > 0)) &&
    (usingNewAddress ? newAddress.city && newAddress.district && newAddress.street && newAddress.label : Boolean(addressId))

  const submit = async () => {
    setError(null)
    setPhase('submitting')
    try {
      let resolvedAddressId = addressId
      if (usingNewAddress) {
        const created = await createCafeAddress({ ...newAddress, isDefault: addresses.length === 0 })
        if (!created.ok) {
          setError(tv('validation'))
          setPhase('form')
          return
        }
        resolvedAddressId = created.data.id
      }

      const payload = (day: Day) => ({
        deliveryDate: day.date,
        items: day.lines.filter((l) => l.productId && l.quantity > 0).map((l) => ({ productId: l.productId, quantity: l.quantity })),
      })

      const res =
        mode === 'one-off'
          ? await submitOneOffOrder({ ...payload(days[0]!), addressId: resolvedAddressId, paymentMethod: payment, notes, locale })
          : await submitWeeklySchedule({
              weekStartDate: days[0]!.date,
              addressId: resolvedAddressId,
              days: days.map(payload),
              paymentMethod: payment,
              notes,
              locale,
            })

      if (res.ok) {
        setResult({ ref: `ORD-${res.data.orderNumber}` })
        setPhase('done')
        router.refresh()
      } else {
        setError(tv((Object.values(res.fieldErrors ?? {})[0]?.[0] ?? res.error) as 'generic'))
        setPhase('form')
      }
    } catch {
      setError(tv('generic'))
      setPhase('form')
    }
  }

  if (phase === 'done' && result) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-600 text-white shadow-[0_0_60px_rgba(224,51,127,0.5)]"
        >
          <Check size={36} strokeWidth={2.5} />
        </motion.div>
        <h1 className="mt-6 font-display text-3xl">{t('successTitle')}</h1>
        <p className="mt-2 text-sm text-muted">
          {mode === 'one-off'
            ? t('oneOffSuccessBody', { ref: result.ref, date: format.dateTime(new Date(`${days[0]!.date}T00:00:00Z`), { day: '2-digit', month: 'long' }) })
            : t('successBody', { ref: result.ref })}
        </p>
        <a href="/account" className="btn-primary mt-8 inline-flex">
          {t('backToDashboard')}
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-medium">{mode === 'weekly' ? t('title') : t('oneOffTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{mode === 'weekly' ? t('subtitle') : t('oneOffSubtitle')}</p>
      </div>

      <div className="inline-flex rounded-2xl border border-line bg-ink-2 p-1">
        {(['weekly', 'one-off'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`relative rounded-xl px-4 py-2 text-sm transition ${mode === m ? 'text-white' : 'text-muted hover:text-cream'}`}
          >
            {mode === m && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-xl bg-rose-600" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="relative">{m === 'weekly' ? t('modeWeekly') : t('modeOneOff')}</span>
          </button>
        ))}
      </div>

      {/* address */}
      <div className="rounded-2xl border border-line bg-ink-2 p-5">
        <p className="mb-3 text-xs font-medium text-muted uppercase">{t('address')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {addresses.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => setAddressId(a.id)}
              className={`rounded-xl border p-3 text-start text-sm transition ${addressId === a.id ? 'border-rose-500 bg-rose-600/10' : 'border-line hover:border-muted/50'}`}
            >
              <p className="font-medium">{a.label}</p>
              <p className="text-xs text-muted">
                {a.street}, {a.district}, {a.city}
              </p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAddressId('__new')}
            className={`rounded-xl border border-dashed p-3 text-start text-sm transition ${usingNewAddress ? 'border-rose-500 bg-rose-600/10' : 'border-line hover:border-muted/50'}`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Plus size={14} /> {t('addAddress')}
            </span>
          </button>
        </div>
        <AnimatePresence initial={false}>
          {usingNewAddress && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <input className="field" placeholder={taddr('labelPh')} value={newAddress.label} onChange={(e) => setNewAddress((a) => ({ ...a, label: e.target.value }))} />
                <div />
                <input className="field cursor-not-allowed opacity-70" placeholder={taddr('city')} value={newAddress.city} readOnly />
                <input className="field" placeholder={taddr('district')} value={newAddress.district} onChange={(e) => setNewAddress((a) => ({ ...a, district: e.target.value }))} />
                <input className="field sm:col-span-2" placeholder={taddr('street')} value={newAddress.street} onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* days */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {days.map((day) => (
            <motion.div key={day.key} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-line bg-ink-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted">{t('selectDate')}</span>
                  <select className="field w-auto py-2" dir="ltr" value={day.date} onChange={(e) => setDay(day.key, { date: e.target.value })}>
                    {[day.date, ...allowedDates.filter((d) => !usedDates.has(d) || d === day.date)]
                      .filter((d, i, arr) => arr.indexOf(d) === i)
                      .map((d) => (
                        <option key={d} value={d}>
                          {format.dateTime(new Date(`${d}T00:00:00Z`), { weekday: 'short', day: '2-digit', month: 'short' })}
                        </option>
                      ))}
                  </select>
                </label>
                {mode === 'weekly' && days.length > 1 && (
                  <button type="button" onClick={() => removeDay(day.key)} className="flex items-center gap-1 text-xs text-muted hover:text-rose-500">
                    <Trash2 size={13} /> {t('removeDay')}
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {day.lines.map((line) => (
                  <div key={line.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                    <select
                      className="field py-2"
                      value={line.productId}
                      onChange={(e) => setLines(day.key, day.lines.map((l) => (l.key === line.key ? { ...l, productId: e.target.value } : l)))}
                    >
                      <option value="">{t('product')}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} · {formatSar(p.priceHalalas, locale)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      dir="ltr"
                      className="field w-20 py-2 text-center"
                      value={line.quantity}
                      onChange={(e) =>
                        setLines(day.key, day.lines.map((l) => (l.key === line.key ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) } : l)))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => (day.lines.length > 1 ? removeLine(day.key, line.key) : undefined)}
                      disabled={day.lines.length <= 1}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:text-rose-500 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addLine(day.key)} className="flex items-center gap-1 text-xs text-rose-500 hover:underline dark:text-rose-300">
                  <Plus size={13} /> {t('addItems')}
                </button>
              </div>

              <div className="mt-4 flex justify-end border-t border-line pt-3 text-sm">
                <span className="text-muted">{t('dayTotal')}:</span>
                <span className="ms-2 font-semibold">{formatSar(dayTotal(day), locale)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {mode === 'weekly' && days.length < 7 && allowedDates.some((d) => !usedDates.has(d)) && (
          <button type="button" onClick={addDay} className="btn-ghost w-full py-3">
            <Plus size={15} /> {t('addDay')}
          </button>
        )}
      </div>

      {/* summary */}
      <div className="rounded-2xl border border-line bg-ink p-5">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">{t('summary')}</p>
        <dl className="mt-4 space-y-1.5 text-sm text-muted">
          <div className="flex justify-between">
            <dt>{t('subtotal')}</dt>
            <dd className="tabular-nums">{formatSar(totals.subtotalHalalas, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t('deliveryFee', { count: days.length })}</dt>
            <dd className="tabular-nums">{formatSar(totals.deliveryFeeHalalas, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t('vat')}</dt>
            <dd className="tabular-nums">{formatSar(totals.vatHalalas, locale)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm">{t('total')}</span>
          <span className="font-display text-3xl">{formatSar(totals.totalHalalas, locale)}</span>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs text-muted">{t('payment')}</p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['CARD', CreditCard, t('card')],
                ['APPLE_PAY', Smartphone, t('applePay')],
                ['BANK_TRANSFER', Banknote, t('bankTransfer')],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                type="button"
                key={id}
                onClick={() => setPayment(id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs transition ${payment === id ? 'border-rose-500 bg-rose-600/10 text-cream' : 'border-line text-muted hover:text-cream'}`}
              >
                <Icon size={17} /> {label}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs text-muted">{t('notes')}</span>
          <textarea className="field resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
        </label>

        {error && <p className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p>}

        <button type="button" disabled={!canSubmit || phase === 'submitting'} onClick={submit} className="btn-primary mt-5 w-full py-4">
          {phase === 'submitting' ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted/80">{t('prototypeNote')}</p>
      </div>
    </div>
  )
}
