import { useState } from 'react'
import { Search, Store, Truck } from 'lucide-react'
import { EmptyRow, ORDER_STATUSES, PageHeader, Panel, StatusSelect, Tabs } from './ui.jsx'
import { formatPrice, formatTime } from '../../lib/format.js'
import { useStore } from '../../store/StoreProvider.jsx'

const FILTERS = ['All', 'New', 'Preparing', 'Ready', 'Out for delivery', 'Delivered']

export default function OrdersTable() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const rows = state.orders.filter(
    (o) =>
      (filter === 'All' || o.status === filter) &&
      (!q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.phone.includes(q)),
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Retail orders" subtitle="Orders placed through the online storefront." />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <Tabs
            id="orders"
            value={filter}
            onChange={setFilter}
            tabs={FILTERS.map((f) => ({
              id: f,
              label: f,
              count: f === 'All' ? state.orders.length : state.orders.filter((o) => o.status === f).length,
            }))}
          />
          <label className="relative block md:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field py-2 pl-9"
              placeholder="Search orders…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.15em] text-muted">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Fulfilment</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} className="transition hover:bg-ink-3/50">
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium">{o.id}</p>
                    <p className="text-xs text-muted">{formatTime(o.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p>{o.customer}</p>
                    <p className="text-xs text-muted">{o.phone}</p>
                  </td>
                  <td className="max-w-[260px] px-5 py-4 align-top text-muted">
                    {o.items.map((i) => (
                      <p key={i.id} className="truncate">
                        <span className="text-cream">{i.qty}×</span> {i.name}
                      </p>
                    ))}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      {o.fulfillment === 'Delivery' ? <Truck size={14} /> : <Store size={14} />} {o.fulfillment}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right align-top font-medium tabular-nums">{formatPrice(o.total)}</td>
                  <td className="px-5 py-4 align-top">
                    <StatusSelect
                      value={o.status}
                      options={ORDER_STATUSES}
                      onChange={(status) => dispatch({ type: 'orders/setStatus', id: o.id, status })}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={6}>No orders match this view.</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
