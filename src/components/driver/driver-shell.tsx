'use client'

import { useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Languages, LogOut } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { LogoMark, Wordmark } from '@/components/ui/logo'
import ThemeToggle from '@/components/ui/theme-toggle'
import { driverLogout } from '@/server/actions/auth'
import { setAdminLocale } from '@/server/actions/preferences'

export default function DriverShell({ driverName, children }: { driverName: string; children: ReactNode }) {
  const t = useTranslations('Driver')
  const locale = useLocale()
  const router = useRouter()
  const [switching, startTransition] = useTransition()

  const switchLanguage = () =>
    startTransition(async () => {
      await setAdminLocale(locale === 'ar' ? 'en' : 'ar')
      router.refresh()
    })

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-ink-2/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3 text-rose-500">
          <LogoMark className="h-8 w-auto" strokeWidth={4} />
          <div>
            <Wordmark className="text-sm text-cream" sub={false} />
            <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{t('portalTitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="me-1 hidden text-sm text-cream sm:inline">{driverName}</span>
          <button type="button" onClick={switchLanguage} disabled={switching} className="btn-ghost px-3 py-1.5 text-xs">
            <Languages size={13} /> {t('language')}
          </button>
          <ThemeToggle className="h-8 w-8" />
          <form action={driverLogout}>
            <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
              <LogOut size={13} className="rtl:-scale-x-100" /> {t('signOut')}
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  )
}
