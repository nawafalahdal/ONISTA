'use client'

import { useState } from 'react'
import { Search, Store, Truck } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { AdminOrder } from '@/server/queries/admin'
import { updateOrderStatus } from '@/server/actions/orders'
import Toast from '@/components/ui/toast'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import { formatSar } from '@/lib/money'
import { EmptyRow, ORDER_STATUSES, PageHeader, Panel, StatusSelect, Tabs, type OrderStatus } from './ui'

type Filter = 'ALL' | OrderStatus

export default function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const t = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const rows = orders.filter(
    (o) =>
      (filter === 'ALL' || o.status === filter) &&
      (!q || `ord-${o.orderNumber}`.includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q)),
  )
  const statusLabel = (s: OrderStatus) => t(`OrderStatus.${s}`)

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
          <label className="relative block md:w-64">
            <Search size={14} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="field py-2 ps-9" placeholder={t('searchOrders')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-start text-[11px] tracking-[0.12em] text-muted uppercase">
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-start font-medium">{t('colOrder')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colCustomer')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colItems')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colFulfilment')}</th>
                <th className="px-5 py-3 text-end font-medium">{t('colTotal')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} className="transition hover:bg-ink-3/50">
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium" dir="ltr">
                      ORD-{o.orderNumber}
                    </p>
                    <p className="text-xs text-muted">
                      {format.dateTime(o.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p>{o.customerName}</p>
                    <p className="text-xs text-muted" dir="ltr">
                      {o.customerPhone}
                    </p>
                  </td>
                  <td className="max-w-[260px] px-5 py-4 align-top text-muted">
                    {o.items.map((i) => (
                      <p key={i.id} className="truncate">
                        <span className="text-cream" dir="ltr">
                          {i.quantity}×
                        </span>{' '}
                        {i.titleSnapshot}
                      </p>
                    ))}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      {o.fulfillment === 'DELIVERY' ? <Truck size={14} /> : <Store size={14} />} {t(`Fulfilment.${o.fulfillment}`)}
                    </span>
                    {o.deliveryAddress && <p className="mt-1 max-w-[200px] text-xs text-muted/80">{o.deliveryAddress}</p>}
                  </td>
                  <td className="px-5 py-4 text-end align-top font-medium tabular-nums">{formatSar(o.totalHalalas, locale)}</td>
                  <td className="px-5 py-4 align-top">
                    <StatusSelect
                      value={o.status as OrderStatus}
                      options={ORDER_STATUSES}
                      label={statusLabel}
                      disabled={pending}
                      onChange={(status) => run(() => updateOrderStatus({ id: o.id, status }), t('statusUpdated'))}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={6}>{t('noOrders')}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Toast message={toast} />
    </div>
  )
}
