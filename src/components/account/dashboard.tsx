'use client'

import NextLink from 'next/link'
import { CalendarClock, PackagePlus } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { formatSar } from '@/lib/money'

type Delivery = {
  id: string
  deliveryDate: Date
  status: string
  subtotalHalalas: number
  order: { orderNumber: number; type: 'ONE_OFF' | 'WEEKLY_SCHEDULE' }
  items: { id: string; titleSnapshot: string; quantity: number }[]
}

export default function Dashboard({ cafeName, cutoffHour, deliveries }: { cafeName: string; cutoffHour: number; deliveries: Delivery[] }) {
  const t = useTranslations('Account')
  const ta = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-medium">{t('greeting', { name: cafeName })}</h1>
        <p className="mt-1 text-sm text-muted">{t('greetingSub')}</p>
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
              <li key={d.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-600/10 text-xs font-semibold text-rose-500" dir="ltr">
                  {format.dateTime(d.deliveryDate, { day: '2-digit', month: 'short' })}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{d.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(' · ')}</p>
                  <p className="text-xs text-muted" dir="ltr">
                    ORD-{d.order.orderNumber} {d.order.type === 'WEEKLY_SCHEDULE' && '· ' + ta('typeWeekly')}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted">{ta(`DeliveryStatus.${d.status}`)}</span>
                <span className="shrink-0 text-sm font-semibold">{formatSar(d.subtotalHalalas, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
