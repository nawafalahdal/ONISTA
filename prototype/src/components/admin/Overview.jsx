import { motion } from 'framer-motion'
import { ArrowUpRight, Cake, Coffee, ShoppingBag, Wallet } from 'lucide-react'
import { PageHeader, Panel } from './ui.jsx'
import { formatPrice, formatTime } from '../../lib/format.js'
import { useStore } from '../../store/StoreProvider.jsx'

export default function Overview({ go }) {
  const { state } = useStore()
  const { orders, tastingRequests, products } = state

  const liveOrders = orders.filter((o) => o.status !== 'Cancelled')
  const revenue = liveOrders.reduce((n, o) => n + o.total, 0)
  const openOrders = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length
  const newRequests = tastingRequests.filter((r) => r.status === 'New').length
  const onTasting = products.filter((p) => p.tasting).length

  const stats = [
    { label: 'Revenue', value: formatPrice(revenue), icon: Wallet, hint: `${liveOrders.length} orders` },
    { label: 'Open orders', value: openOrders, icon: ShoppingBag, hint: 'Awaiting fulfilment', to: 'orders' },
    { label: 'New café requests', value: newRequests, icon: Coffee, hint: `${tastingRequests.length} total`, to: 'tasting' },
    { label: 'Products live', value: products.filter((p) => p.available).length, icon: Cake, hint: `${onTasting} on tasting menu`, to: 'products' },
  ]

  // Best sellers from order line items.
  const sales = {}
  liveOrders.forEach((o) => o.items.forEach((i) => (sales[i.name] = (sales[i.name] ?? 0) + i.qty)))
  const top = Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxQty = top[0]?.[1] ?? 1

  return (
    <div className="space-y-8">
      <PageHeader title="Good morning" subtitle="Here's what's happening at Onista today." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => s.to && go(s.to)}
            className="group rounded-2xl border border-line bg-ink-2 p-5 text-left transition hover:border-rose-500/40"
          >
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-[0.18em]">{s.label}</span>
              <s.icon size={16} className="text-rose-400" />
            </div>
            <p className="mt-4 font-display text-4xl">{s.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              {s.hint}
              {s.to && <ArrowUpRight size={12} className="opacity-0 transition group-hover:opacity-100" />}
            </p>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Latest activity</h2>
            <button onClick={() => go('orders')} className="text-xs text-muted hover:text-cream">
              View all
            </button>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {[
              ...orders.map((o) => ({ kind: 'order', id: o.id, who: o.customer, meta: formatPrice(o.total), at: o.createdAt })),
              ...tastingRequests.map((r) => ({ kind: 'tasting', id: r.id, who: r.cafeName, meta: `${r.items.length} samples`, at: r.createdAt })),
            ]
              .sort((a, b) => b.at.localeCompare(a.at))
              .slice(0, 6)
              .map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full ${
                      e.kind === 'order' ? 'bg-rose-600/15 text-rose-300' : 'bg-amber-400/10 text-amber-300'
                    }`}
                  >
                    {e.kind === 'order' ? <ShoppingBag size={15} /> : <Coffee size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{e.who}</p>
                    <p className="text-xs text-muted">
                      {e.kind === 'order' ? 'Retail order' : 'Café tasting request'} · {e.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{e.meta}</p>
                    <p className="text-xs text-muted">{formatTime(e.at)}</p>
                  </div>
                </li>
              ))}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-semibold">Best sellers</h2>
          <ul className="mt-5 space-y-4">
            {top.map(([name, qty], i) => (
              <li key={name}>
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="tabular-nums text-muted">{qty} sold</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(qty / maxQty) * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-rose-500"
                  />
                </div>
              </li>
            ))}
            {top.length === 0 && <p className="text-sm text-muted">No sales yet.</p>}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
