import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Storefront from './components/storefront/Storefront.jsx'
import AdminDashboard from './components/admin/AdminDashboard.jsx'
import Toast from './components/ui/Toast.jsx'

const VIEWS = [
  { id: 'store', label: 'Storefront' },
  { id: 'admin', label: 'Admin' },
]

export default function App() {
  const [view, setView] = useState(() => (window.location.hash === '#admin' ? 'admin' : 'store'))
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  const notify = useCallback((text) => {
    clearTimeout(toastTimer.current)
    setToast({ text, key: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }, [])

  const switchView = useCallback((next) => {
    setView(next)
    window.scrollTo({ top: 0 })
    history.replaceState(null, '', next === 'admin' ? '#admin' : window.location.pathname)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {view === 'store' ? (
            <Storefront onAdmin={() => switchView('admin')} notify={notify} />
          ) : (
            <AdminDashboard onStorefront={() => switchView('store')} notify={notify} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prototype view switcher (the admin sidebar has its own link back) */}
      {view === 'store' && (
        <div className="fixed bottom-5 left-5 z-40 hidden rounded-full border border-line bg-ink-2/90 p-1 text-xs shadow-2xl backdrop-blur-xl sm:flex md:bottom-8 md:left-8">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => switchView(v.id)}
              className={`relative rounded-full px-4 py-2 transition ${view === v.id ? 'text-white' : 'text-muted hover:text-cream'}`}
            >
              {view === v.id && (
                <motion.span layoutId="view-switch" className="absolute inset-0 rounded-full bg-rose-600" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{v.label}</span>
            </button>
          ))}
        </div>
      )}

      <Toast message={toast} />
    </>
  )
}
