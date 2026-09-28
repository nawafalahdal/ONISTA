'use client'

import { CalendarRange } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { KitchenScheduleDay } from '@/server/queries/admin'
import { PageHeader, Panel } from './ui'

export default function KitchenSchedule({ days }: { days: KitchenScheduleDay[] }) {
  const t = useTranslations('Admin')
  const format = useFormatter()

  return (
    <div className="space-y-6">
      <PageHeader title={t('kitchenScheduleTitle')} subtitle={t('kitchenScheduleSub')} />

      {days.length === 0 ? (
        <Panel className="py-16 text-center text-sm text-muted">{t('noUpcomingDeliveries')}</Panel>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <Panel key={day.date} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <p className="flex items-center gap-2 font-semibold" dir="ltr">
                  <CalendarRange size={15} className="text-rose-500" />
                  {format.dateTime(new Date(`${day.date}T00:00:00Z`), { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
                <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
                  {t('deliveryCount', { count: day.deliveries.length })}
                </span>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] tracking-[0.12em] text-muted uppercase">{t('productionTotals')}</p>
                  <ul className="space-y-1.5">
                    {day.productTotals.map((p) => (
                      <li key={p.title} className="flex items-center justify-between text-sm">
                        <span>{p.title}</span>
                        <span className="font-semibold tabular-nums" dir="ltr">
                          {p.quantity}×
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[11px] tracking-[0.12em] text-muted uppercase">{t('byCafe')}</p>
                  <ul className="space-y-1.5">
                    {day.deliveries.map((d) => (
                      <li key={d.id} className="flex items-center justify-between text-sm">
                        <span className="min-w-0 truncate">{d.order.cafe.cafeName}</span>
                        <span className="shrink-0 text-xs text-muted" dir="ltr">
                          ORD-{d.order.orderNumber}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
