'use client'

import { useTransition, type ReactNode } from 'react'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CalendarClock, ClipboardList, LayoutDashboard, Languages, LogOut, MapPin, Store } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { LogoMark, Wordmark } from '@/components/ui/logo'
import ThemeToggle from '@/components/ui/theme-toggle'
import { cafeLogout } from '@/server/actions/auth'
import { setAdminLocale } from '@/server/actions/preferences'

export default function CafeShell({ cafeName, children }: { cafeName: string; children: ReactNode }) {
  const t = useTranslations('Account')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [switching, startTransition] = useTransition()

  const nav = [
    { href: '/account', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/account/schedule', label: t('nav.schedule'), icon: CalendarClock },
    { href: '/account/orders', label: t('nav.orders'), icon: ClipboardList },
    { href: '/account/addresses', label: t('nav.addresses'), icon: MapPin },
  ]
  const isActive = (href: string) => (href === '/account' ? pathname === href : pathname.startsWith(href))

  const switchLanguage = () =>
    startTransition(async () => {
      await setAdminLocale(locale === 'ar' ? 'en' : 'ar')
      router.refresh()
    })

  return (
    <div className="min-h-screen bg-ink md:grid md:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 z-20 flex flex-col border-b border-line bg-ink-2/95 backdrop-blur md:h-screen md:border-e md:border-b-0">
        <div className="flex items-center justify-between gap-3 px-5 py-4 md:py-6">
          <div className="flex items-center gap-3 text-rose-500">
            <LogoMark className="h-9 w-auto" strokeWidth={4} />
            <div>
              <Wordmark className="text-base text-cream" sub={false} />
              <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{t('portalTitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <NextLink href={`/${locale}`} className="btn-ghost px-3 py-1.5 text-xs">
              <Store size={13} />
            </NextLink>
          </div>
        </div>

        <div className="px-5 pb-3 text-sm font-medium text-cream md:pb-4">{cafeName}</div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {nav.map((item) => {
            const active = isActive(item.href)
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                  active ? 'text-cream' : 'text-muted hover:text-cream'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="account-nav"
                    className="absolute inset-0 rounded-xl bg-ink-3 ring-1 ring-line"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                {active && <span className="absolute inset-y-2 start-0 hidden w-0.5 rounded-full bg-rose-500 md:block" />}
                <item.icon size={17} className={`relative ${active ? 'text-rose-500' : ''}`} />
                <span className="relative">{item.label}</span>
              </NextLink>
            )
          })}
        </nav>

        <div className="mt-auto hidden space-y-3 p-4 md:block">
          <div className="flex items-center gap-2">
            <button type="button" onClick={switchLanguage} disabled={switching} className="btn-ghost flex-1 px-3 py-2 text-xs">
              <Languages size={14} /> {t('language')}
            </button>
            <ThemeToggle />
          </div>
          <NextLink href={`/${locale}`} className="btn-ghost w-full">
            <Store size={14} /> {t('backToSite')}
          </NextLink>
          <form action={cafeLogout}>
            <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-full border border-line py-2 text-xs text-muted transition hover:text-rose-500">
              <LogOut size={12} className="rtl:-scale-x-100" /> {t('signOut')}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-2 px-3 pb-3 md:hidden">
          <button type="button" onClick={switchLanguage} disabled={switching} className="btn-ghost px-3 py-1.5 text-xs">
            <Languages size={13} /> {t('language')}
          </button>
          <ThemeToggle className="h-8 w-8" />
          <form action={cafeLogout} className="ms-auto">
            <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
              <LogOut size={13} className="rtl:-scale-x-100" /> {t('signOut')}
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">
        <motion.div key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto max-w-5xl">
          {children}
        </motion.div>
      </main>
    </div>
  )
}
