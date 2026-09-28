import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cake, ClipboardList, Coffee, ExternalLink, LayoutDashboard, RotateCcw } from 'lucide-react'
import Overview from './Overview.jsx'
import OrdersTable from './OrdersTable.jsx'
import TastingTable from './TastingTable.jsx'
import ProductsManager from './ProductsManager.jsx'
import { LogoMark, Wordmark } from '../ui/Logo.jsx'
import { useStore } from '../../store/StoreProvider.jsx'

export default function AdminDashboard({ onStorefront, notify }) {
  const { state, dispatch } = useStore()
  const [section, setSection] = useState('overview')

  const newOrders = state.orders.filter((o) => o.status === 'New').length
  const newRequests = state.tastingRequests.filter((r) => r.status === 'New').length

  const NAV = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ClipboardList, badge: newOrders },
    { id: 'tasting', label: 'Tasting requests', icon: Coffee, badge: newRequests },
    { id: 'products', label: 'Products', icon: Cake },
  ]

  const reset = () => {
    if (window.confirm('Reset all demo data (products, orders, requests, cart)?')) {
      dispatch({ type: 'reset' })
      notify('Demo data restored')
    }
  }

  return (
    <div className="min-h-screen bg-ink md:grid md:grid-cols-[260px_1fr]">
      {/* sidebar */}
      <aside className="sticky top-0 z-20 flex flex-col border-b border-line bg-ink-2/95 backdrop-blur md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-4 md:py-6">
          <div className="flex items-center gap-3 text-rose-500">
            <LogoMark className="h-9 w-auto" strokeWidth={4} />
            <div>
              <Wordmark className="text-base text-cream" sub={false} />
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted">Back office</p>
            </div>
          </div>
          <button onClick={onStorefront} className="btn-ghost px-3 py-1.5 text-xs md:hidden">
            <ExternalLink size={13} /> Store
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 no-scrollbar md:flex-col md:px-3 md:pb-0">
          {NAV.map((item) => {
            const active = section === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                  active ? 'text-cream' : 'text-muted hover:text-cream'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-nav"
                    className="absolute inset-0 rounded-xl bg-ink-3 ring-1 ring-line"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                {active && <span className="absolute inset-y-2 left-0 hidden w-0.5 rounded-full bg-rose-500 md:block" />}
                <item.icon size={17} className={`relative ${active ? 'text-rose-400' : ''}`} />
                <span className="relative">{item.label}</span>
                {item.badge > 0 && (
                  <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto hidden space-y-2 p-4 md:block">
          <button onClick={onStorefront} className="btn-ghost w-full">
            <ExternalLink size={14} /> View storefront
          </button>
          <button onClick={reset} className="flex w-full items-center justify-center gap-2 py-2 text-xs text-muted transition hover:text-cream">
            <RotateCcw size={12} /> Reset demo data
          </button>
        </div>
      </aside>

      {/* content */}
      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-6xl"
          >
            {section === 'overview' && <Overview go={setSection} />}
            {section === 'orders' && <OrdersTable />}
            {section === 'tasting' && <TastingTable />}
            {section === 'products' && <ProductsManager notify={notify} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
