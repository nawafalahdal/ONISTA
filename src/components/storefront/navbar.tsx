'use client'

import { useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Languages, LogIn } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LogoMark, Wordmark } from '@/components/ui/logo'
import ThemeToggle from '@/components/ui/theme-toggle'

// NOTE: this storefront has no /admin reference anywhere — the back office
// is a separate, unlinked area. The only account entry point here is the
// café partner portal (/account), which is itself closed (no sign-up).
export default function Navbar() {
  const t = useTranslations('Nav')
  const locale = useLocale()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40))

  const links = [
    { href: '#about', label: t('about') },
    { href: '#collection', label: t('collection') },
    { href: '#cafes', label: t('cafes') },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-all duration-500 ${
        scrolled ? 'border-b border-line/70 bg-ink/75 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <a href="#top" className="flex items-center gap-3 text-rose-500" dir="ltr">
          <LogoMark className="h-9 w-auto md:h-10" strokeWidth={4} />
          <Wordmark className="text-base text-cream md:text-lg" />
        </a>

        <ul className="hidden items-center gap-9 text-[13px] tracking-wide text-muted md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition hover:text-cream">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            locale={locale === 'ar' ? 'en' : 'ar'}
            className="hidden h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-muted transition hover:border-rose-500/50 hover:text-cream sm:flex"
          >
            <Languages size={14} /> {t('switchLanguage')}
          </Link>
          <ThemeToggle className="hidden sm:grid" />
          <a href="/account" className="btn-primary py-2 text-xs md:text-sm">
            <LogIn size={15} /> {t('portal')}
          </a>
        </div>
      </nav>
    </header>
  )
}
