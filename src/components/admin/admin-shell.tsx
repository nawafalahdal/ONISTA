'use client'

import { useTransition, type ReactNode } from 'react'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Cake, ClipboardList, Coffee, ExternalLink, Languages, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { LogoMark, Wordmark } from '@/components/ui/logo'
import ThemeToggle from '@/components/ui/theme-toggle'
import { logout } from '@/server/actions/auth'
import { setAdminLocale } from '@/server/actions/preferences'

export default function AdminShell({
  user,
  counts,
  children,
}: {
  user: { email: string | null; role: string }
  counts: { newOrders: number; newRequests: number }
  children: ReactNode
}) {
  const t = useTranslations('Admin')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [switching, startTransition] = useTransition()

  const nav = [
    { href: '/admin', label: t('overview'), icon: LayoutDashboard },
    { href: '/admin/orders', label: t('orders'), icon: ClipboardList, badge: counts.newOrders },
    { href: '/admin/tasting-requests', label: t('tasting'), icon: Coffee, badge: counts.newRequests },
    { href: '/admin/products', label: t('products'), icon: Cake },
    { href: '/admin/clients', label: t('clients'), icon: Building2 },
    { href: '/admin/settings', label: t('settings'), icon: Settings },
  ]
  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href))

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
              <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{t('backOffice')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <NextLink href={`/${locale}`} className="btn-ghost px-3 py-1.5 text-xs">
              <ExternalLink size={13} /> {t('store')}
            </NextLink>
          </div>
        </div>

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
                    layoutId="admin-nav"
                    className="absolute inset-0 rounded-xl bg-ink-3 ring-1 ring-line"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                {active && <span className="absolute inset-y-2 start-0 hidden w-0.5 rounded-full bg-rose-500 md:block" />}
                <item.icon size={17} className={`relative ${active ? 'text-rose-500' : ''}`} />
                <span className="relative">{item.label}</span>
                {item.badge ? (
                  <span className="relative ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
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
            <ExternalLink size={14} /> {t('viewStorefront')}
          </NextLink>
          <div className="rounded-xl border border-line p-3">
            <p className="truncate text-xs text-cream" dir="ltr">
              {user.email ?? ''}
            </p>
            <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{user.role}</p>
            <form action={logout} className="mt-2">
              <button type="submit" className="flex items-center gap-1.5 text-xs text-muted transition hover:text-rose-500">
                <LogOut size={12} className="rtl:-scale-x-100" /> {t('signOut')}
              </button>
            </form>
          </div>
        </div>

        {/* compact controls on mobile */}
        <div className="flex items-center gap-2 px-3 pb-3 md:hidden">
          <button type="button" onClick={switchLanguage} disabled={switching} className="btn-ghost px-3 py-1.5 text-xs">
            <Languages size={13} /> {t('language')}
          </button>
          <ThemeToggle className="h-8 w-8" />
          <form action={logout} className="ms-auto">
            <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
              <LogOut size={13} className="rtl:-scale-x-100" /> {t('signOut')}
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-6xl"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
