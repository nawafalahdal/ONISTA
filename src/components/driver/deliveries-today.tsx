'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, Clock, Loader2, MapPin, Navigation, Package, Phone, Wallet } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { DriverDayStats, DriverDelivery } from '@/server/queries/driver'
import { confirmDeliveryWithOtp, markDeliveryPickedUp } from '@/server/actions/driver-deliveries'
import { OTP_LENGTH } from '@/lib/validation/driver-delivery'
import { formatSar } from '@/lib/money'

export default function DeliveriesToday({
  deliveries,
  kitchenGoogleMapsUrl,
  stats,
}: {
  deliveries: DriverDelivery[]
  kitchenGoogleMapsUrl: string | null
  stats: DriverDayStats
}) {
  const t = useTranslations('Driver')
  const ta = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-medium">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {t('subtitle', { date: format.dateTime(new Date(), { weekday: 'long', day: '2-digit', month: 'long' }) })}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Stat icon={<CheckCircle2 size={16} />} label={t('statCompleted')} value={String(stats.completedCount)} />
        <Stat icon={<Package size={16} />} label={t('statRemaining')} value={String(deliveries.length)} />
        <Stat icon={<Wallet size={16} />} label={t('statEarnings')} value={formatSar(stats.earningsHalalas, locale)} highlight />
      </dl>

      {deliveries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">{t('empty')}</p>
      ) : (
        <ul className="space-y-4">
          {deliveries.map((d) => (
            <li key={d.id} className="rounded-2xl border border-line bg-ink-2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-600/15 text-rose-500">
                    <Clock size={18} />
                  </span>
                  <div>
                    <p className="font-semibold" dir="ltr">
                      {d.timeWindow ?? t('anyTime')}
                    </p>
                    <p className="text-xs text-muted">
                      <span dir="ltr">ORD-{d.order.orderNumber}</span> ·{' '}
                      {format.dateTime(d.deliveryDate, { weekday: 'short', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">{ta(`DeliveryStatus.${d.status}`)}</span>
              </div>

              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <Building2 size={15} className="mt-0.5 shrink-0 text-rose-500" />
                  <div>
                    <p className="text-sm font-medium">{d.order.cafe.cafeName}</p>
                    {d.recipientName && <p className="text-xs text-muted">{d.recipientName}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone size={15} className="mt-0.5 shrink-0 text-rose-500" />
                  <p className="text-sm" dir="ltr">
                    {d.recipientPhone ?? d.order.cafe.contactPhone}
                  </p>
                </div>
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-rose-500" />
                  <p className="text-sm text-muted">{d.addressSnapshot}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-line bg-ink p-3">
                <p className="mb-2 text-[11px] tracking-[0.12em] text-muted uppercase">{t('items')}</p>
                <ul className="space-y-1.5 text-sm">
                  {d.items.map((i) => (
                    <li key={i.id} className="flex items-center justify-between">
                      <span>{i.titleSnapshot}</span>
                      <span className="font-semibold tabular-nums" dir="ltr">
                        {i.quantity}×
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <DeliveryActions delivery={d} kitchenGoogleMapsUrl={kitchenGoogleMapsUrl} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-2 p-4">
      <dt className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-muted uppercase">
        {icon} {label}
      </dt>
      <dd className={`mt-1.5 font-display text-2xl ${highlight ? 'text-rose-500 dark:text-rose-400' : ''}`} dir="ltr">
        {value}
      </dd>
    </div>
  )
}

/** The two steps a driver drives themselves: collect it, then prove it arrived. */
function DeliveryActions({ delivery, kitchenGoogleMapsUrl }: { delivery: DriverDelivery; kitchenGoogleMapsUrl: string | null }) {
  const t = useTranslations('Driver')
  const tv = useTranslations('Validation')
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setPending(true)
    setError(null)
    try {
      const res = await fn()
      if (res.ok) {
        setOtp('')
        router.refresh()
      } else {
        setError(res.error ?? 'generic')
      }
    } catch {
      setError('generic')
    } finally {
      setPending(false)
    }
  }

  if (delivery.status === 'READY_FOR_PICKUP') {
    return (
      <div className="mt-4 space-y-2">
        <p className="rounded-xl bg-rose-600/10 p-3 text-xs text-rose-600 dark:text-rose-300">{t('readyNotice')}</p>
        <div className="flex flex-wrap gap-2">
          {kitchenGoogleMapsUrl && (
            <a href={kitchenGoogleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <Navigation size={15} /> {t('kitchenDirections')}
            </a>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => markDeliveryPickedUp({ deliveryId: delivery.id }))}
            className="btn-primary"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Package size={15} />} {t('markPickedUp')}
          </button>
        </div>
        {error && <p className="text-xs text-rose-500">{tv(error as 'generic')}</p>}
      </div>
    )
  }

  if (delivery.status === 'OUT_FOR_DELIVERY') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-xs text-muted">{t('otpPrompt')}</p>
        <div className="flex flex-wrap gap-2">
          <input
            className="field w-36 text-center tracking-[0.4em] tabular-nums"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            placeholder={'0'.repeat(OTP_LENGTH)}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <button
            type="button"
            disabled={pending || otp.length !== OTP_LENGTH}
            onClick={() => run(() => confirmDeliveryWithOtp({ deliveryId: delivery.id, otpCode: otp }))}
            className="btn-primary"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} {t('confirmDelivery')}
          </button>
        </div>
        {error && <p className="text-xs text-rose-500">{tv(error as 'generic')}</p>}
      </div>
    )
  }

  return <p className="mt-4 text-xs text-muted">{t('awaitingKitchen')}</p>
}
