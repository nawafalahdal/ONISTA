'use client'

import NextLink from 'next/link'
import { CalendarClock, ClipboardList, PackagePlus, Receipt } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { formatSar } from '@/lib/money'

type Delivery = {
  id: string
  deliveryDate: Date
  timeWindow: string | null
  status: string
  subtotalHalalas: number
  otpCode: string | null
  order: { orderNumber: number; type: 'ONE_OFF' | 'WEEKLY_SCHEDULE' }
  items: { id: string; titleSnapshot: string; quantity: number }[]
}

/** The café reads this code out to the driver; it is what closes the delivery. */
const SHOWS_OTP = new Set(['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'])

type Overview = { totalOrders: number; totalSpentHalalas: number; upcomingDeliveries: number }

export default function Dashboard({
  cafeName,
  cutoffHour,
  deliveries,
  overview,
}: {
  cafeName: string
  cutoffHour: number
  deliveries: Delivery[]
  overview: Overview
}) {
  const t = useTranslations('Account')
  const ta = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'

  const stats = [
    { icon: ClipboardList, label: t('Overview.totalOrders'), value: format.number(overview.totalOrders) },
    { icon: Receipt, label: t('Overview.totalSpent'), value: formatSar(overview.totalSpentHalalas, locale) },
    { icon: CalendarClock, label: t('Overview.upcoming'), value: format.number(overview.upcomingDeliveries) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-medium">{t('greeting', { name: cafeName })}</h1>
        <p className="mt-1 text-sm text-muted">{t('greetingSub')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-ink-2 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600/15 text-rose-500">
              <s.icon size={18} />
            </span>
            <p className="mt-3 font-display text-3xl" dir="ltr">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-rose-500/25 bg-rose-600/5 p-4 text-sm text-rose-600 dark:text-rose-300">
        {t('cutoffNotice', { hour: cutoffHour })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NextLink href="/account/schedule?mode=weekly" className="group flex items-center gap-4 rounded-2xl border border-line bg-ink-2 p-5 transition hover:border-rose-500/40">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-600/15 text-rose-500">
            <CalendarClock size={20} />
          </span>
          <div>
            <p className="font-semibold">{t('buildSchedule')}</p>
            <p className="text-xs text-muted">{t('buildScheduleHint')}</p>
          </div>
        </NextLink>
        <NextLink href="/account/schedule?mode=one-off" className="group flex items-center gap-4 rounded-2xl border border-line bg-ink-2 p-5 transition hover:border-rose-500/40">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-600/15 text-rose-500">
            <PackagePlus size={20} />
          </span>
          <div>
            <p className="font-semibold">{t('quickOrder')}</p>
            <p className="text-xs text-muted">{t('quickOrderHint')}</p>
          </div>
        </NextLink>
      </div>

      <div className="rounded-2xl border border-line bg-ink-2 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('upcomingDeliveries')}</h2>
          <NextLink href="/account/orders" className="text-xs text-muted hover:text-cream">
            {t('viewAllOrders')}
          </NextLink>
        </div>
        {deliveries.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted">{t('noUpcoming')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {deliveries.map((d) => (
              <li key={d.id} className="py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-600/10 text-xs font-semibold text-rose-500" dir="ltr">
                    {format.dateTime(d.deliveryDate, { day: '2-digit', month: 'short' })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{d.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(' · ')}</p>
                    <p className="text-xs text-muted" dir="ltr">
                      ORD-{d.order.orderNumber} {d.timeWindow && `· ${d.timeWindow}`}{' '}
                      {d.order.type === 'WEEKLY_SCHEDULE' && '· ' + ta('typeWeekly')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted">{ta(`DeliveryStatus.${d.status}`)}</span>
                  <span className="shrink-0 text-sm font-semibold">{formatSar(d.subtotalHalalas, locale)}</span>
                </div>
                {d.otpCode && SHOWS_OTP.has(d.status) && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-rose-600/10 px-3 py-2">
                    <span className="text-xs text-rose-600 dark:text-rose-300">{t('deliveryCodeLabel')}</span>
                    <span className="font-display text-xl tracking-[0.3em] text-rose-500 tabular-nums dark:text-rose-400" dir="ltr">
                      {d.otpCode}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
