'use client'

import { Building2, Clock, MapPin, Phone } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { DriverDelivery } from '@/server/queries/driver'

export default function DeliveriesToday({ deliveries }: { deliveries: DriverDelivery[] }) {
  const t = useTranslations('Driver')
  const ta = useTranslations('Admin')
  const format = useFormatter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-medium">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('subtitle', { date: format.dateTime(new Date(), { weekday: 'long', day: '2-digit', month: 'long' }) })}</p>
      </div>

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
                    <p className="text-xs text-muted" dir="ltr">
                      ORD-{d.order.orderNumber}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
