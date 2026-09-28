'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { KeyRound, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LogoMark, Wordmark } from '@/components/ui/logo'
import { ACCOUNT_PATH } from '@/config/security'
import { changePassword } from '@/server/actions/auth'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import Toast from '@/components/ui/toast'

export function ChangePasswordForm() {
  const t = useTranslations('Account')
  const tv = useTranslations('Validation')
  const router = useRouter()
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    run(
      () => changePassword(f),
      t('passwordUpdated'),
      (res) => {
        if (res.ok) router.replace(ACCOUNT_PATH)
        else setError(tv((res.fieldErrors?.confirmPassword?.[0] ?? res.error) as 'generic'))
      },
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-rose-500" dir="ltr">
        <LogoMark className="h-20 w-auto drop-shadow-[0_0_30px_rgba(224,51,127,0.35)]" strokeWidth={2.4} />
        <Wordmark className="mt-4 text-xl text-cream" />
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-ink-2/90 p-7 shadow-2xl backdrop-blur">
        <h1 className="flex items-center gap-2 font-semibold">
          <KeyRound size={16} className="text-rose-500" /> {t('changePasswordTitle')}
        </h1>
        <p className="text-sm text-muted">{t('changePasswordBody')}</p>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">{t('currentPassword')}</span>
          <input className="field" dir="ltr" type="password" required value={f.currentPassword} onChange={(e) => setF((p) => ({ ...p, currentPassword: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">{t('newPassword')}</span>
          <input className="field" dir="ltr" type="password" minLength={8} required value={f.newPassword} onChange={(e) => setF((p) => ({ ...p, newPassword: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">{t('confirmPassword')}</span>
          <input className="field" dir="ltr" type="password" minLength={8} required value={f.confirmPassword} onChange={(e) => setF((p) => ({ ...p, confirmPassword: e.target.value }))} />
        </label>
        {error && <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full py-3.5">
          {pending ? <Loader2 size={16} className="animate-spin" /> : null} {t('updatePassword')}
        </button>
      </form>
      <Toast message={toast} />
    </motion.div>
  )
}
