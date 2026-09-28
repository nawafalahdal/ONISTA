'use client'

import { useActionState } from 'react'
import NextLink from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Coffee, Loader2, Store } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { LogoMark, Wordmark } from '@/components/ui/logo'
import ThemeToggle from '@/components/ui/theme-toggle'
import { cafeLogin } from '@/server/actions/auth'

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations('Account')
  const locale = useLocale()
  const [state, action, pending] = useActionState(cafeLogin, null)
  const Back = locale === 'ar' ? ArrowRight : ArrowLeft

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-sm"
    >
      <div className="mb-8 flex flex-col items-center text-rose-500" dir="ltr">
        <LogoMark className="h-24 w-auto drop-shadow-[0_0_30px_rgba(224,51,127,0.35)]" strokeWidth={2.4} />
        <Wordmark className="mt-4 text-2xl text-cream" />
      </div>

      <form action={action} className="space-y-4 rounded-3xl border border-line bg-ink-2/90 p-7 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 font-semibold">
            <Store size={16} className="text-rose-500" /> {t('signInTitle')}
          </h1>
          <ThemeToggle className="h-8 w-8" />
        </div>
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ''} />
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">{t('phone')}</span>
          <input className="field" name="identifier" type="tel" dir="ltr" autoComplete="username" placeholder="+966 5X XXX XXXX" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">{t('password')}</span>
          <input className="field" name="password" type="password" dir="ltr" autoComplete="current-password" required />
        </label>
        {state?.error && (
          <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">
            {state.error === 'rateLimited' ? t('rateLimited') : t('invalidCredentials')}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full py-3.5">
          {pending ? <Loader2 size={16} className="animate-spin" /> : null} {t('signIn')}
        </button>
      </form>

      <p className="mt-5 rounded-2xl border border-dashed border-line p-4 text-center text-xs text-muted">
        {t('noSignUp')}{' '}
        <NextLink href={`/${locale}#cafes`} className="inline-flex items-center gap-1 text-rose-500 hover:underline dark:text-rose-300">
          <Coffee size={12} /> {t('requestTasting')}
        </NextLink>
      </p>

      <NextLink href={`/${locale}`} className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted hover:text-cream">
        <Back size={12} /> {t('backToSite')}
      </NextLink>
    </motion.div>
  )
}
