'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Plus, Star, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CafeAddressRow } from '@/server/queries/cafe'
import { archiveCafeAddress, createCafeAddress, setDefaultCafeAddress } from '@/server/actions/cafe-addresses'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import Toast from '@/components/ui/toast'

const emptyForm = { label: '', city: '', district: '', street: '', buildingNumber: '', additionalNumber: '', postalCode: '', deliveryNotes: '' }

export default function AddressesManager({ addresses }: { addresses: CafeAddressRow[] }) {
  const t = useTranslations('Account.Addresses')
  const tc = useTranslations('Common')
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState(emptyForm)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    run(
      () => createCafeAddress({ ...f, isDefault: addresses.length === 0 }),
      undefined,
      (res) => {
        if (res.ok) {
          setAdding(false)
          setF(emptyForm)
        }
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-medium">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
        </div>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="btn-primary py-2.5">
            <Plus size={16} /> {t('addNew')}
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="rounded-2xl border border-line bg-ink-2 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="field" placeholder={t('label')} value={f.label} onChange={set('label')} required />
            <input className="field" placeholder={t('city')} value={f.city} onChange={set('city')} required />
            <input className="field" placeholder={t('district')} value={f.district} onChange={set('district')} required />
            <input className="field" placeholder={t('street')} value={f.street} onChange={set('street')} required />
            <input className="field" dir="ltr" placeholder={t('buildingNumber')} value={f.buildingNumber} onChange={set('buildingNumber')} />
            <input className="field" dir="ltr" placeholder={t('additionalNumber')} value={f.additionalNumber} onChange={set('additionalNumber')} />
            <input className="field" dir="ltr" placeholder={t('postalCode')} value={f.postalCode} onChange={set('postalCode')} />
            <input className="field" placeholder={t('deliveryNotes')} value={f.deliveryNotes} onChange={set('deliveryNotes')} />
          </div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setAdding(false)} className="btn-ghost flex-1">
              {tc('cancel')}
            </button>
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              {t('save')}
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !adding ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">{t('empty')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {addresses.map((a) => (
              <motion.li key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-line bg-ink-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 font-medium">
                    <MapPin size={14} className="text-rose-500" /> {a.label}
                  </p>
                  {a.isDefault && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-600/10 px-2 py-0.5 text-[10px] text-rose-500">
                      <Star size={10} fill="currentColor" /> {t('default')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {a.street}, {a.district}, {a.city}
                </p>
                <div className="mt-3 flex gap-3 text-xs">
                  {!a.isDefault && (
                    <button type="button" disabled={pending} onClick={() => run(() => setDefaultCafeAddress({ id: a.id }))} className="text-rose-500 hover:underline dark:text-rose-300">
                      {t('setDefault')}
                    </button>
                  )}
                  <button type="button" disabled={pending} onClick={() => run(() => archiveCafeAddress({ id: a.id }))} className="flex items-center gap-1 text-muted hover:text-rose-500">
                    <Trash2 size={12} /> {t('archive')}
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <Toast message={toast} />
    </div>
  )
}
