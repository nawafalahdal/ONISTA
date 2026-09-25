import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { AtSign, Coffee, MapPin, Phone } from 'lucide-react'
import Navbar from './Navbar.jsx'
import HeroAbout from './HeroAbout.jsx'
import ProductsCatalog from './ProductsCatalog.jsx'
import TastingSection from './TastingSection.jsx'
import TastingModal from './TastingModal.jsx'
import CartDrawer from './CartDrawer.jsx'
import CheckoutModal from './CheckoutModal.jsx'
import { LogoMark, Wordmark } from '../ui/Logo.jsx'

export default function Storefront({ onAdmin, notify }) {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [tastingOpen, setTastingOpen] = useState(false)

  const scrollToCollection = () => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div id="top">
      <Navbar onCart={() => setCartOpen(true)} onAdmin={onAdmin} />

      <main>
        <HeroAbout onShop={scrollToCollection} onTasting={() => setTastingOpen(true)} />
        <ProductsCatalog onAdded={(p) => notify(`${p.name} added to your box`)} />
        <TastingSection onOpen={() => setTastingOpen(true)} />
      </main>

      <Footer onAdmin={onAdmin} />

      <TastingFab onClick={() => setTastingOpen(true)} hidden={tastingOpen || cartOpen || checkoutOpen} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false)
          setCheckoutOpen(true)
        }}
      />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      <TastingModal open={tastingOpen} onClose={() => setTastingOpen(false)} />
    </div>
  )
}

/** Floating B2B entry point, revealed once the visitor leaves the hero. */
function TastingFab({ onClick, hidden }) {
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setVisible(y > window.innerHeight * 0.8))

  return (
    <AnimatePresence>
      {visible && !hidden && (
        <motion.button
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
          onClick={onClick}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-3 rounded-full border border-rose-400/30 bg-ink-3/90 py-2 pl-2 pr-5 shadow-[0_20px_50px_-15px_rgba(200,16,110,0.6)] backdrop-blur-xl md:bottom-8 md:right-8"
        >
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-rose-600 text-white">
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />
            <Coffee size={17} className="relative" />
          </span>
          <span className="text-left leading-tight">
            <span dir="rtl" className="block text-sm font-bold">طلب تجربة للكافيه</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted">Café tasting</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function Footer({ onAdmin }) {
  return (
    <footer className="mx-auto max-w-7xl px-5 pb-28 pt-20 md:px-8">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="text-rose-500">
          <LogoMark className="h-20 w-auto" strokeWidth={3} />
          <Wordmark className="mt-4 text-2xl text-cream" />
          <p className="mt-5 max-w-xs text-sm text-muted">
            A modern patisserie baking signature cakes for homes, celebrations and the region's best cafés.
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <p className="eyebrow mb-4">Visit</p>
          <p className="flex items-center gap-2"><MapPin size={14} /> Prince Sultan Rd, Riyadh</p>
          <p className="flex items-center gap-2"><Phone size={14} /> +966 50 000 0000</p>
          <p className="flex items-center gap-2"><AtSign size={14} /> @onista.cakeshop</p>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <p className="eyebrow mb-4">Hours</p>
          <p>Sat – Thu · 8:00 – 23:00</p>
          <p>Friday · 14:00 – 23:30</p>
          <button onClick={onAdmin} className="mt-4 text-xs underline decoration-line underline-offset-4 hover:text-cream">
            Staff dashboard →
          </button>
        </div>
      </div>
      <p className="mt-16 border-t border-line pt-6 text-xs text-muted/60">
        © {new Date().getFullYear()} Onista Cake Shop. Prototype for demonstration purposes.
      </p>
    </footer>
  )
}
