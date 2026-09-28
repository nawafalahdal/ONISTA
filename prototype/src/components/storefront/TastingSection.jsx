import { motion } from 'framer-motion'
import { ArrowUpRight, Coffee, PackageCheck, Sparkles, Truck } from 'lucide-react'
import { LogoMark } from '../ui/Logo.jsx'
import { useStore } from '../../store/StoreProvider.jsx'

const PERKS = [
  { icon: Sparkles, title: 'Curated sample box', text: 'Up to five items from our wholesale menu, boxed for your team.' },
  { icon: Truck, title: 'Delivered to your café', text: 'Complimentary drop-off within Riyadh, Jeddah and Khobar.' },
  { icon: PackageCheck, title: 'Wholesale pricing', text: 'Daily or weekly standing orders with flexible minimums.' },
]

export default function TastingSection({ onOpen }) {
  const { state } = useStore()
  const menu = state.products.filter((p) => p.tasting && p.available)

  return (
    <section id="cafes" className="relative scroll-mt-20 overflow-hidden border-y border-line bg-ink-2">
      <LogoMark className="pointer-events-none absolute -right-24 top-1/2 h-[140%] w-auto -translate-y-1/2 text-rose-600/[0.06]" strokeWidth={1} />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-24 md:grid-cols-[1.1fr_1fr] md:px-8 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow flex items-center gap-2">
            <Coffee size={14} /> Onista for business
          </p>
          <h2 className="mt-5 text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-tight text-cream">
            <span dir="rtl">طلب تجربة للكافيه</span>
          </h2>
          <p className="mt-2 font-display text-2xl italic text-rose-300 md:text-3xl">Tasting requests for cafés</p>
          <p className="mt-6 max-w-lg leading-relaxed text-muted">
            Stock your counter with cakes your guests will photograph. Tell us which pieces you'd like to try and
            our wholesale team will confirm your tasting box over WhatsApp, usually within the hour.
          </p>
          <button onClick={onOpen} className="btn-primary mt-9">
            Request a tasting box <ArrowUpRight size={16} />
          </button>
        </motion.div>

        <div className="space-y-4">
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-4 rounded-2xl border border-line bg-ink/60 p-5 backdrop-blur"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-600/15 text-rose-400">
                <perk.icon size={19} />
              </span>
              <div>
                <h3 className="font-semibold">{perk.title}</h3>
                <p className="mt-1 text-sm text-muted">{perk.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* tasting menu marquee */}
      {menu.length > 0 && (
        <div className="relative border-t border-line py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <motion.div
            className="flex w-max gap-10 whitespace-nowrap font-display text-2xl italic text-muted"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 36, ease: 'linear' }}
          >
            {[...menu, ...menu].map((p, i) => (
              <span key={`${p.id}-${i}`} className="flex items-center gap-10">
                {p.name} <span className="text-rose-500">✦</span>
              </span>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  )
}
