import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { LayoutDashboard, ShoppingBag } from 'lucide-react'
import { LogoMark, Wordmark } from '../ui/Logo.jsx'
import { useStore } from '../../store/StoreProvider.jsx'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#collection', label: 'Collection' },
  { href: '#cafes', label: 'For Cafés' },
]

export default function Navbar({ onCart, onAdmin }) {
  const { cartCount } = useStore()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40))

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-all duration-500 ${
        scrolled ? 'border-b border-line/70 bg-ink/75 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <a href="#top" className="flex items-center gap-3 text-rose-500">
          <LogoMark className="h-9 w-auto md:h-10" strokeWidth={4} />
          <Wordmark className="text-base text-cream md:text-lg" />
        </a>

        <ul className="hidden items-center gap-9 text-[13px] tracking-wide text-muted md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="relative transition hover:text-cream">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={onAdmin}
            className="hidden h-10 items-center gap-2 rounded-full border border-line px-4 text-xs text-muted transition hover:border-rose-500/50 hover:text-cream sm:flex"
          >
            <LayoutDashboard size={14} /> Admin
          </button>
          <button
            onClick={onCart}
            aria-label={`Open cart, ${cartCount} items`}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line transition hover:border-rose-500/60"
          >
            <ShoppingBag size={17} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>
    </header>
  )
}
