'use client'

import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, KeyRound, Plus } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { AdminCafe } from '@/server/queries/admin'
import { createCafeAccount, resetCafePassword, setCafeActive } from '@/server/actions/cafes'
import { CloseButton, Drawer } from '@/components/ui/overlay'
import Toast from '@/components/ui/toast'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import { EmptyRow, PageHeader, Panel, Toggle } from './ui'

export default function ClientsManager({ cafes, prefill }: { cafes: AdminCafe[]; prefill?: { cafeName: string; phone: string } }) {
  const t = useTranslations('Admin')
  const format = useFormatter()
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [creating, setCreating] = useState(Boolean(prefill))
  const [resetTarget, setResetTarget] = useState<AdminCafe | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader title={t('clientsTitle')} subtitle={t('clientsSub')}>
        <button type="button" onClick={() => setCreating(true)} className="btn-primary py-2.5">
          <Plus size={16} /> {t('newClient')}
        </button>
      </PageHeader>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-muted uppercase">
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-start font-medium">{t('colCafeName')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colContact')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colPhone')}</th>
                <th className="px-5 py-3 text-center font-medium">{t('colOrders')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colJoined')}</th>
                <th className="px-5 py-3 text-center font-medium">{t('colActive')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {cafes.map((c) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="transition hover:bg-ink-3/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-600/10 text-rose-500">
                          <Building2 size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.cafeName}</p>
                          {c.mustChangePassword && <p className="text-[10px] text-amber-500">{t('mustChangePassword')}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{c.contactName ?? '—'}</td>
                    <td className="px-5 py-3 text-muted" dir="ltr">
                      {c.contactPhone}
                    </td>
                    <td className="px-5 py-3 text-center tabular-nums">{c.orderCount}</td>
                    <td className="px-5 py-3 text-muted">{format.dateTime(c.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-3 text-center">
                      <Toggle
                        label={`${c.cafeName} · ${t('colActive')}`}
                        checked={c.isActive}
                        disabled={pending}
                        onChange={(isActive) => run(() => setCafeActive({ id: c.id, isActive }), t('statusUpdated'))}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setResetTarget(c)}
                        title={t('resetPassword')}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink-3 hover:text-cream"
                      >
                        <KeyRound size={15} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {cafes.length === 0 && <EmptyRow colSpan={7}>{t('noClients')}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer open={creating} onClose={() => setCreating(false)}>
        <CreateClientForm prefill={prefill} onCancel={() => setCreating(false)} onCreated={(name) => { notify(t('clientCreated', { name })); setCreating(false) }} />
      </Drawer>

      <ResetPasswordModal cafe={resetTarget} onClose={() => setResetTarget(null)} notify={notify} />
      <Toast message={toast} />
    </div>
  )
}

function ResetPasswordModal({ cafe, onClose, notify }: { cafe: AdminCafe | null; onClose: () => void; notify: (t: string) => void }) {
  const t = useTranslations('Admin')
  const { run, pending } = useAdminAction(notify)
  const [password, setPassword] = useState('')

  if (!cafe) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-line bg-ink-2 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{t('resetPassword')}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <p className="mt-2 text-sm text-muted">{t('resetPasswordConfirm', { name: cafe.cafeName })}</p>
        <input
          className="field mt-4"
          dir="ltr"
          type="text"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('initialPassword')}
        />
        <button
          type="button"
          disabled={pending || password.length < 8}
          onClick={() =>
            run(
              () => resetCafePassword({ id: cafe.id, password }),
              undefined,
              (res) => res.ok && onClose(),
            )
          }
          className="btn-primary mt-4 w-full py-3"
        >
          {t('resetPassword')}
        </button>
      </div>
    </div>
  )
}

function CreateClientForm({
  prefill,
  onCancel,
  onCreated,
}: {
  prefill?: { cafeName: string; phone: string }
  onCancel: () => void
  onCreated: (name: string) => void
}) {
  const t = useTranslations('Admin')
  const tv = useTranslations('Validation')
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [f, setF] = useState({
    cafeName: prefill?.cafeName ?? '', contactName: '', phone: prefill?.phone ?? '', contactEmail: '', password: '',
    label: 'Main', city: '', district: '', street: '', buildingNumber: '', additionalNumber: '', postalCode: '',
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }))
  const err = (k: string) => {
    const code = errors[k]?.[0]
    return code ? tv(code as 'invalid') : undefined
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    run(
      () =>
        createCafeAccount({
          cafeName: f.cafeName,
          contactName: f.contactName,
          phone: f.phone,
          contactEmail: f.contactEmail,
          password: f.password,
          address: {
            label: f.label,
            city: f.city,
            district: f.district,
            street: f.street,
            buildingNumber: f.buildingNumber,
            additionalNumber: f.additionalNumber,
            postalCode: f.postalCode,
            isDefault: true,
          },
        }),
      undefined,
      (res) => {
        if (res.ok) onCreated(f.cafeName)
        else setErrors(res.fieldErrors ?? {})
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex h-full flex-col">
      <div className="border-b border-line px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">{t('createClientTitle')}</p>
          <CloseButton onClick={onCancel} />
        </div>
        <p className="mt-2 text-xs text-muted">{t('createClientSub')}</p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <Field label={t('cafeName')} error={err('cafeName')}>
          <input className="field" value={f.cafeName} onChange={set('cafeName')} maxLength={120} required />
        </Field>
        <Field label={t('contactName')} error={err('contactName')}>
          <input className="field" value={f.contactName} onChange={set('contactName')} maxLength={100} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('contactPhone')} error={err('phone')}>
            <input className="field" dir="ltr" value={f.phone} onChange={set('phone')} placeholder="+966 5X XXX XXXX" required />
          </Field>
          <Field label={t('contactEmail')} error={err('contactEmail')}>
            <input className="field" dir="ltr" type="email" value={f.contactEmail} onChange={set('contactEmail')} />
          </Field>
        </div>
        <Field label={t('initialPassword')} error={err('password')}>
          <input className="field" dir="ltr" value={f.password} onChange={set('password')} minLength={8} required />
        </Field>

        <div className="rounded-2xl border border-line p-4">
          <p className="mb-3 text-xs font-medium text-muted uppercase">{t('addressSection')}</p>
          <div className="space-y-4">
            <Field label={t('addressLabel')} error={err('address.label')}>
              <input className="field" value={f.label} onChange={set('label')} placeholder={t('addressLabelPh')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('city')} error={err('address.city')}>
                <input className="field" value={f.city} onChange={set('city')} required />
              </Field>
              <Field label={t('district')} error={err('address.district')}>
                <input className="field" value={f.district} onChange={set('district')} required />
              </Field>
            </div>
            <Field label={t('street')} error={err('address.street')}>
              <input className="field" value={f.street} onChange={set('street')} required />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t('buildingNumber')}>
                <input className="field" dir="ltr" value={f.buildingNumber} onChange={set('buildingNumber')} />
              </Field>
              <Field label={t('additionalNumber')}>
                <input className="field" dir="ltr" value={f.additionalNumber} onChange={set('additionalNumber')} />
              </Field>
              <Field label={t('postalCode')}>
                <input className="field" dir="ltr" value={f.postalCode} onChange={set('postalCode')} />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 border-t border-line px-6 py-5">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          {t('cancel')}
        </button>
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {t('createClient')}
        </button>
      </div>
      <Toast message={toast} />
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  )
}
