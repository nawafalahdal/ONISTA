'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { addBlackoutDate, removeBlackoutDate, updateSchedulingSettings } from '@/server/actions/scheduling-settings'
import Toast from '@/components/ui/toast'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import { WEEKDAY_KEYS } from '@/lib/date'
import { halalasToSar } from '@/lib/money'
import { PageHeader, Panel } from './ui'

type Settings = {
  cutoffHour: number
  minLeadDays: number
  maxAdvanceDays: number
  deliveryWeekdays: number[]
  deliveryFeeOneOffHalalas: number
  deliveryFeeWeekHalalas: number
  deliveryFeeBiweekHalalas: number
  deliveryFeeMonthHalalas: number
  tastingExtraFeeHalalas: number
}
type Blackout = { date: Date; reasonAr: string | null; reasonEn: string | null }

export default function SchedulingSettingsForm({ settings, blackouts }: { settings: Settings; blackouts: Blackout[] }) {
  const t = useTranslations('Admin')
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)

  const [f, setF] = useState({
    cutoffHour: String(settings.cutoffHour),
    minLeadDays: String(settings.minLeadDays),
    maxAdvanceDays: String(settings.maxAdvanceDays),
    deliveryWeekdays: settings.deliveryWeekdays,
    deliveryFeeOneOffHalalas: String(halalasToSar(settings.deliveryFeeOneOffHalalas)),
    deliveryFeeWeekHalalas: String(halalasToSar(settings.deliveryFeeWeekHalalas)),
    deliveryFeeBiweekHalalas: String(halalasToSar(settings.deliveryFeeBiweekHalalas)),
    deliveryFeeMonthHalalas: String(halalasToSar(settings.deliveryFeeMonthHalalas)),
    tastingExtraFeeHalalas: String(halalasToSar(settings.tastingExtraFeeHalalas)),
  })

  const toggleDay = (d: number) =>
    setF((p) => ({
      ...p,
      deliveryWeekdays: p.deliveryWeekdays.includes(d) ? p.deliveryWeekdays.filter((x) => x !== d) : [...p.deliveryWeekdays, d].sort(),
    }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    run(
      () =>
        updateSchedulingSettings({
          cutoffHour: f.cutoffHour,
          minLeadDays: f.minLeadDays,
          maxAdvanceDays: f.maxAdvanceDays,
          deliveryWeekdays: f.deliveryWeekdays,
          deliveryFeeOneOffHalalas: f.deliveryFeeOneOffHalalas,
          deliveryFeeWeekHalalas: f.deliveryFeeWeekHalalas,
          deliveryFeeBiweekHalalas: f.deliveryFeeBiweekHalalas,
          deliveryFeeMonthHalalas: f.deliveryFeeMonthHalalas,
          tastingExtraFeeHalalas: f.tastingExtraFeeHalalas,
        }),
      t('settingsSaved'),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('settingsTitle')} subtitle={t('settingsSub')} />

      <Panel className="p-6">
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">{t('cutoffHour')}</span>
            <input className="field" dir="ltr" type="number" min={0} max={23} value={f.cutoffHour} onChange={(e) => setF((p) => ({ ...p, cutoffHour: e.target.value }))} />
            <span className="mt-1 block text-[11px] text-muted/80">{t('cutoffHourHint')}</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">{t('minLeadDays')}</span>
            <input className="field" dir="ltr" type="number" min={1} max={14} value={f.minLeadDays} onChange={(e) => setF((p) => ({ ...p, minLeadDays: e.target.value }))} />
            <span className="mt-1 block text-[11px] text-muted/80">{t('minLeadDaysHint')}</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">{t('maxAdvanceDays')}</span>
            <input className="field" dir="ltr" type="number" min={1} max={365} value={f.maxAdvanceDays} onChange={(e) => setF((p) => ({ ...p, maxAdvanceDays: e.target.value }))} />
          </label>
          <div className="sm:col-span-2">
            <span className="mb-2 block text-xs text-muted">{t('deliveryFeeTiers')}</span>
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] text-muted">{t('deliveryFeeOneOff')}</span>
                <input className="field" dir="ltr" type="number" min={0} step={0.5} value={f.deliveryFeeOneOffHalalas} onChange={(e) => setF((p) => ({ ...p, deliveryFeeOneOffHalalas: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] text-muted">{t('deliveryFeeWeek')}</span>
                <input className="field" dir="ltr" type="number" min={0} step={0.5} value={f.deliveryFeeWeekHalalas} onChange={(e) => setF((p) => ({ ...p, deliveryFeeWeekHalalas: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] text-muted">{t('deliveryFeeBiweek')}</span>
                <input className="field" dir="ltr" type="number" min={0} step={0.5} value={f.deliveryFeeBiweekHalalas} onChange={(e) => setF((p) => ({ ...p, deliveryFeeBiweekHalalas: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] text-muted">{t('deliveryFeeMonth')}</span>
                <input className="field" dir="ltr" type="number" min={0} step={0.5} value={f.deliveryFeeMonthHalalas} onChange={(e) => setF((p) => ({ ...p, deliveryFeeMonthHalalas: e.target.value }))} />
              </label>
            </div>
            <span className="mt-1 block text-[11px] text-muted/80">{t('deliveryFeeTiersHint')}</span>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">{t('tastingExtraFee')}</span>
            <input className="field" dir="ltr" type="number" min={0} step={0.5} value={f.tastingExtraFeeHalalas} onChange={(e) => setF((p) => ({ ...p, tastingExtraFeeHalalas: e.target.value }))} />
            <span className="mt-1 block text-[11px] text-muted/80">{t('tastingExtraFeeHint')}</span>
          </label>
          <div className="sm:col-span-2">
            <span className="mb-2 block text-xs text-muted">{t('deliveryWeekdays')}</span>
            <div className="flex flex-wrap gap-2" dir="ltr">
              {WEEKDAY_KEYS.map((key, i) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleDay(i)}
                  className={`rounded-full border px-4 py-2 text-xs transition ${
                    f.deliveryWeekdays.includes(i) ? 'border-rose-500 bg-rose-600/15 text-cream' : 'border-line text-muted hover:text-cream'
                  }`}
                >
                  {t(`Weekday.${key}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending} className="btn-primary py-3">
              {t('saveSettings')}
            </button>
          </div>
        </form>
      </Panel>

      <BlackoutPanel blackouts={blackouts} notify={notify} />
      <Toast message={toast} />
    </div>
  )
}

function BlackoutPanel({ blackouts, notify }: { blackouts: Blackout[]; notify: (t: string) => void }) {
  const t = useTranslations('Admin')
  const format = useFormatter()
  const { run, pending } = useAdminAction(notify)
  const [date, setDate] = useState('')
  const [reasonEn, setReasonEn] = useState('')
  const [reasonAr, setReasonAr] = useState('')

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return
    run(() => addBlackoutDate({ date, reasonEn, reasonAr }), undefined, (res) => {
      if (res.ok) {
        setDate('')
        setReasonEn('')
        setReasonAr('')
      }
    })
  }

  return (
    <Panel className="p-6">
      <p className="font-semibold">{t('blackoutTitle')}</p>
      <p className="mt-1 text-sm text-muted">{t('blackoutSub')}</p>

      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto]">
        <input className="field" dir="ltr" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <input className="field" dir="ltr" value={reasonEn} onChange={(e) => setReasonEn(e.target.value)} placeholder={t('blackoutReasonEn')} />
        <input className="field" dir="rtl" value={reasonAr} onChange={(e) => setReasonAr(e.target.value)} placeholder={t('blackoutReasonAr')} />
        <button type="submit" disabled={pending} className="btn-primary px-5">
          {t('addBlackout')}
        </button>
      </form>

      <ul className="mt-5 divide-y divide-line">
        <AnimatePresence initial={false}>
          {blackouts.map((b) => {
            const iso = b.date.toISOString().slice(0, 10)
            return (
              <motion.li key={iso} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span dir="ltr">{format.dateTime(b.date, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span className="flex-1 text-muted">{b.reasonEn || b.reasonAr || '—'}</span>
                <button type="button" onClick={() => run(() => removeBlackoutDate({ date: iso }))} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-rose-500">
                  <Trash2 size={14} />
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
        {blackouts.length === 0 && <li className="py-6 text-center text-sm text-muted">{t('noBlackouts')}</li>}
      </ul>
    </Panel>
  )
}
