'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Coffee, PackageCheck, Sparkles, Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CatalogProduct } from '@/server/queries/catalog'
import { LogoMark } from '@/components/ui/logo'
import { useDirection } from '@/hooks/use-direction'

export default function TastingSection({ menu, onOpen }: { menu: CatalogProduct[]; onOpen: () => void }) {
  const t = useTranslations('Tasting')
  const { sign } = useDirection()
  const perks = [
    { icon: Sparkles, title: t('perk1Title'), text: t('perk1Text') },
    { icon: Truck, title: t('perk2Title'), text: t('perk2Text') },
    { icon: PackageCheck, title: t('perk3Title'), text: t('perk3Text') },
  ]

  return (
    <section id="cafes" className="relative scroll-mt-20 overflow-hidden border-y border-line bg-ink-2">
      <LogoMark
        className="pointer-events-none absolute -end-24 top-1/2 h-[140%] w-auto -translate-y-1/2 text-rose-600/[0.06]"
        strokeWidth={1}
      />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-24 md:grid-cols-[1.1fr_1fr] md:px-8 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow flex items-center gap-2">
            <Coffee size={14} /> {t('eyebrow')}
          </p>
          <h2 className="mt-5 text-[clamp(2.2rem,5vw,3.8rem)] leading-tight font-bold text-cream">{t('title')}</h2>
          <p className="mt-2 font-display text-2xl text-rose-500 italic md:text-3xl dark:text-rose-300">{t('subtitle')}</p>
          <p className="mt-6 max-w-lg leading-relaxed text-muted">{t('body')}</p>
          <button type="button" onClick={onOpen} className="btn-primary mt-9">
            {t('cta')} <ArrowUpRight size={16} className="rtl:-scale-x-100" />
          </button>
        </motion.div>

        <div className="space-y-4">
          {perks.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, x: 30 * sign }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-4 rounded-2xl border border-line bg-ink/60 p-5 backdrop-blur"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-600/15 text-rose-500 dark:text-rose-400">
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
            className="flex w-max gap-10 font-display text-2xl whitespace-nowrap text-muted italic"
            animate={{ x: ['0%', `${-50 * sign}%`] }}
            transition={{ repeat: Infinity, duration: 36, ease: 'linear' }}
          >
            {[...menu, ...menu].map((p, i) => (
              <span key={`${p.id}-${i}`} className="flex items-center gap-10">
                {p.title} <span className="text-rose-500">✦</span>
              </span>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  )
}
