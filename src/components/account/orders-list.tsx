'use client'

import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { CafeOrder } from '@/server/queries/cafe'
import { formatSar } from '@/lib/money'

export default function OrdersList({ orders }: { orders: CafeOrder[] }) {
  const t = useTranslations('Account.Orders')
  const ta = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-medium">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">{t('empty')}</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-line bg-ink-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium" dir="ltr">
                    ORD-{o.orderNumber}
                  </p>
                  <p className="text-xs text-muted">
                    {o.type === 'WEEKLY_SCHEDULE' ? t('typeWeekly') : t('typeOneOff')} · {format.dateTime(o.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-display text-2xl">{formatSar(o.totalHalalas, locale)}</p>
                  <p className="text-xs text-muted">{ta(`OrderStatus.${o.status}`)}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 border-t border-line pt-4">
                {o.deliveries.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted" dir="ltr">
                      {format.dateTime(d.deliveryDate, { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                    <span className="min-w-0 flex-1 truncate px-2">{d.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(' · ')}</span>
                    <span className="shrink-0 text-xs text-muted">{ta(`DeliveryStatus.${d.status}`)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
