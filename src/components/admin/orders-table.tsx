'use client'

import { Fragment, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { AdminOrder } from '@/server/queries/admin'
import { updateDeliveryStatus, updateOrderStatus } from '@/server/actions/orders'
import Toast from '@/components/ui/toast'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import { formatSar } from '@/lib/money'
import { DELIVERY_STATUSES, EmptyRow, ORDER_STATUSES, PageHeader, Panel, StatusSelect, Tabs, type DeliveryStatus, type OrderStatus } from './ui'

type Filter = 'ALL' | OrderStatus

export default function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const t = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const q = query.trim().toLowerCase()
  const rows = orders.filter(
    (o) =>
      (filter === 'ALL' || o.status === filter) &&
      (!q || `ord-${o.orderNumber}`.includes(q) || o.cafe.cafeName.toLowerCase().includes(q) || o.cafe.contactPhone.includes(q)),
  )
  const statusLabel = (s: OrderStatus) => t(`OrderStatus.${s}`)
  const deliveryLabel = (s: DeliveryStatus) => t(`DeliveryStatus.${s}`)
  const toggle = (id: string) => setExpanded((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)))

  return (
    <div className="space-y-6">
      <PageHeader title={t('ordersTitle')} subtitle={t('ordersSub')} />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <Tabs<Filter>
            id="orders"
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: 'ALL', label: t('all'), count: orders.length },
              ...ORDER_STATUSES.filter((s) => s !== 'CANCELLED').map((s) => ({
                id: s,
                label: statusLabel(s),
                count: orders.filter((o) => o.status === s).length,
              })),
            ]}
          />
          <input className="field py-2 md:w-64" placeholder={t('searchOrders')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-muted uppercase">
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-start font-medium">{t('colOrder')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colCustomer')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colFulfilment')}</th>
                <th className="px-5 py-3 text-end font-medium">{t('colTotal')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => {
                const open = expanded.has(o.id)
                return (
                  <Fragment key={o.id}>
                    <tr key={o.id} className="cursor-pointer transition hover:bg-ink-3/50" onClick={() => toggle(o.id)}>
                      <td className="px-5 py-4 align-top">
                        <p className="font-medium" dir="ltr">
                          ORD-{o.orderNumber}
                        </p>
                        <p className="text-xs text-muted">{o.type === 'WEEKLY_SCHEDULE' ? t('typeWeekly') : t('typeOneOff')}</p>
                        <p className="text-xs text-muted">{format.dateTime(o.createdAt, { day: '2-digit', month: 'short' })}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p>{o.cafe.cafeName}</p>
                        <p className="text-xs text-muted" dir="ltr">
                          {o.cafe.contactPhone}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="inline-flex items-center gap-1.5 text-muted">
                          <CalendarDays size={14} /> {o.deliveries.length}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-end align-top font-medium tabular-nums">{formatSar(o.totalHalalas, locale)}</td>
                      <td className="px-5 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          value={o.status}
                          options={ORDER_STATUSES}
                          label={statusLabel}
                          disabled={pending}
                          onChange={(status) => run(() => updateOrderStatus({ id: o.id, status }), t('statusUpdated'))}
                        />
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${o.id}-detail`} className="bg-ink/40">
                        <td colSpan={5} className="px-5 pb-4">
                          <ul className="space-y-2 rounded-xl border border-line bg-ink-2 p-3">
                            {o.deliveries.map((d) => (
                              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-2 text-xs">
                                <div className="min-w-[140px]">
                                  <p className="font-medium text-cream" dir="ltr">
                                    {format.dateTime(d.deliveryDate, { weekday: 'short', day: '2-digit', month: 'short' })}
                                  </p>
                                  <p className="text-muted">{d.addressSnapshot}</p>
                                </div>
                                <div className="flex-1 text-muted">
                                  {d.items.map((i) => (
                                    <span key={i.id} className="me-3">
                                      <span dir="ltr">{i.quantity}×</span> {i.titleSnapshot}
                                    </span>
                                  ))}
                                </div>
                                <span className="shrink-0 font-medium">{formatSar(d.subtotalHalalas, locale)}</span>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <StatusSelect
                                    value={d.status}
                                    options={DELIVERY_STATUSES}
                                    label={deliveryLabel}
                                    disabled={pending}
                                    onChange={(status) => run(() => updateDeliveryStatus({ id: d.id, status }))}
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {rows.length === 0 && <EmptyRow colSpan={5}>{t('noOrders')}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Toast message={toast} />
    </div>
  )
}
