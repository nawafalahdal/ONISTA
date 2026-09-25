'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Coffee } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CatalogProduct } from '@/server/queries/catalog'
import Navbar from './navbar'
import HeroAbout from './hero-about'
import ProductsCatalog from './products-catalog'
import TastingSection from './tasting-section'
import TastingModal from './tasting-modal'
import Footer from './footer'

/**
 * Client shell for the (showcase-only) storefront. There is no cart or guest
 * checkout here: purchasing — one-off or a weekly schedule — happens in the
 * café partner portal (/account) after signing in. This page's only
 * transactional action is the public tasting-request lead form.
 */
type SiteContent = {
  aboutBodyAr: string
  aboutBodyEn: string
  statSinceYear: string
  statPartnerCafes: string
  statOnTimeRate: string
}

export default function Storefront({
  products,
  cutoffHour,
  content,
}: {
  products: CatalogProduct[]
  cutoffHour: number
  content: SiteContent
}) {
  const [tastingOpen, setTastingOpen] = useState(false)
  const tastingMenu = products.filter((p) => p.isTastingMenu && p.inStock)
  const scrollToCollection = () => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div id="top">
      <Navbar />
      <main>
        <HeroAbout onShop={scrollToCollection} onTasting={() => setTastingOpen(true)} content={content} />
        <ProductsCatalog products={products} />
        <TastingSection menu={tastingMenu} onOpen={() => setTastingOpen(true)} />
      </main>
      <Footer cutoffHour={cutoffHour} />

      <TastingFab onClick={() => setTastingOpen(true)} hidden={tastingOpen} />
      <TastingModal open={tastingOpen} onClose={() => setTastingOpen(false)} menu={tastingMenu} />
    </div>
  )
}

/** Floating lead-gen entry point, revealed once the visitor leaves the hero. */
function TastingFab({ onClick, hidden }: { onClick: () => void; hidden: boolean }) {
  const t = useTranslations('Tasting')
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setVisible(y > window.innerHeight * 0.8))

  return (
    <AnimatePresence>
      {visible && !hidden && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
          onClick={onClick}
          className="fixed bottom-5 end-5 z-30 flex items-center gap-3 rounded-full border border-rose-400/30 bg-ink-3/90 py-2 ps-2 pe-5 shadow-[0_20px_50px_-15px_rgba(200,16,110,0.6)] backdrop-blur-xl md:bottom-8 md:end-8"
        >
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-rose-600 text-white">
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />
            <Coffee size={17} className="relative" />
          </span>
          <span className="text-start leading-tight">
            <span className="block text-sm font-bold">{t('fab')}</span>
            <span className="block text-[10px] tracking-[0.2em] text-muted uppercase">{t('fabSub')}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
