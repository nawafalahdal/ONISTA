'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { updateSiteContent } from '@/server/actions/site-content'
import Toast from '@/components/ui/toast'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import { PageHeader, Panel } from './ui'

type Content = {
  aboutBodyAr: string
  aboutBodyEn: string
  statSinceYear: string
  statPartnerCafes: string
  statOnTimeRate: string
  heroTaglineAr: string
  heroTaglineEn: string
}

export default function ContentForm({ content }: { content: Content }) {
  const t = useTranslations('Admin')
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [f, setF] = useState(content)
  const set = (k: keyof Content) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    run(() => updateSiteContent(f), t('contentSaved'))
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('contentTitle')} subtitle={t('contentSub')} />

      <form onSubmit={save} className="space-y-6">
        <Panel className="space-y-4 p-6">
          <p className="text-xs font-medium text-muted uppercase">{t('contentHeroSection')}</p>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">{t('contentHeroTaglineAr')}</span>
            <input className="field" value={f.heroTaglineAr} onChange={set('heroTaglineAr')} maxLength={200} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">{t('contentHeroTaglineEn')}</span>
            <input className="field" dir="ltr" value={f.heroTaglineEn} onChange={set('heroTaglineEn')} maxLength={200} />
          </label>
        </Panel>

        <Panel className="space-y-4 p-6">
          <p className="text-xs font-medium text-muted uppercase">{t('contentAboutSection')}</p>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">{t('contentAboutAr')}</span>
            <textarea className="field min-h-32" value={f.aboutBodyAr} onChange={set('aboutBodyAr')} maxLength={2000} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">{t('contentAboutEn')}</span>
            <textarea className="field min-h-32" dir="ltr" value={f.aboutBodyEn} onChange={set('aboutBodyEn')} maxLength={2000} />
          </label>
        </Panel>

        <Panel className="p-6">
          <p className="mb-4 text-xs font-medium text-muted uppercase">{t('contentStatsSection')}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">{t('contentStatSince')}</span>
              <input className="field" dir="ltr" value={f.statSinceYear} onChange={set('statSinceYear')} maxLength={20} placeholder="2019" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">{t('contentStatCafes')}</span>
              <input className="field" dir="ltr" value={f.statPartnerCafes} onChange={set('statPartnerCafes')} maxLength={20} placeholder="40+" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted">{t('contentStatOnTime')}</span>
              <input className="field" dir="ltr" value={f.statOnTimeRate} onChange={set('statOnTimeRate')} maxLength={20} placeholder="72h" />
            </label>
          </div>
        </Panel>

        <button type="submit" disabled={pending} className="btn-primary px-8 py-3">
          {t('saveChanges')}
        </button>
      </form>
      <Toast message={toast} />
    </div>
  )
}
