'use client'

import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KeyRound, Plus, Truck } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { AdminDriver } from '@/server/queries/admin'
import { createDriverAccount, resetDriverPassword, setDriverActive } from '@/server/actions/drivers'
import { CloseButton, Drawer } from '@/components/ui/overlay'
import Toast from '@/components/ui/toast'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import { EmptyRow, PageHeader, Panel, Toggle } from './ui'

export default function DriversManager({ drivers }: { drivers: AdminDriver[] }) {
  const t = useTranslations('Admin')
  const format = useFormatter()
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [creating, setCreating] = useState(false)
  const [resetTarget, setResetTarget] = useState<AdminDriver | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader title={t('driversTitle')} subtitle={t('driversSub')}>
        <button type="button" onClick={() => setCreating(true)} className="btn-primary py-2.5">
          <Plus size={16} /> {t('newDriver')}
        </button>
      </PageHeader>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-muted uppercase">
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-start font-medium">{t('driverName')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('driverEmail')}</th>
                <th className="px-5 py-3 text-center font-medium">{t('colOrders')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colJoined')}</th>
                <th className="px-5 py-3 text-center font-medium">{t('colActive')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {drivers.map((d) => (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="transition hover:bg-ink-3/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-600/10 text-rose-500">
                          <Truck size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{d.name}</p>
                          {d.mustChangePassword && <p className="text-[10px] text-amber-500">{t('mustChangePassword')}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted" dir="ltr">
                      {d.email}
                    </td>
                    <td className="px-5 py-3 text-center tabular-nums">{d.deliveryCount}</td>
                    <td className="px-5 py-3 text-muted">{format.dateTime(d.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-3 text-center">
                      <Toggle
                        label={`${d.name} · ${t('colActive')}`}
                        checked={d.isActive}
                        disabled={pending}
                        onChange={(isActive) => run(() => setDriverActive({ id: d.id, isActive }), t('statusUpdated'))}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setResetTarget(d)}
                        title={t('resetPassword')}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink-3 hover:text-cream"
                      >
                        <KeyRound size={15} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {drivers.length === 0 && <EmptyRow colSpan={6}>{t('noDrivers')}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer open={creating} onClose={() => setCreating(false)}>
        <CreateDriverForm onCancel={() => setCreating(false)} onCreated={(name) => { notify(t('driverCreated', { name })); setCreating(false) }} />
      </Drawer>

      <ResetPasswordModal driver={resetTarget} onClose={() => setResetTarget(null)} notify={notify} />
      <Toast message={toast} />
    </div>
  )
}

function ResetPasswordModal({ driver, onClose, notify }: { driver: AdminDriver | null; onClose: () => void; notify: (t: string) => void }) {
  const t = useTranslations('Admin')
  const { run, pending } = useAdminAction(notify)
  const [password, setPassword] = useState('')

  if (!driver) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-line bg-ink-2 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{t('resetPassword')}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <p className="mt-2 text-sm text-muted">{t('resetPasswordConfirm', { name: driver.name })}</p>
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
              () => resetDriverPassword({ id: driver.id, password }),
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

function CreateDriverForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (name: string) => void }) {
  const t = useTranslations('Admin')
  const tv = useTranslations('Validation')
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }))
  const err = (k: string) => {
    const code = errors[k]?.[0]
    return code ? tv(code as 'invalid') : undefined
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    run(
      () => createDriverAccount(f),
      undefined,
      (res) => {
        if (res.ok) onCreated(f.name)
        else setErrors(res.fieldErrors ?? {})
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex h-full flex-col">
      <div className="border-b border-line px-6 py-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">{t('createDriverTitle')}</p>
          <CloseButton onClick={onCancel} />
        </div>
        <p className="mt-2 text-xs text-muted">{t('createDriverSub')}</p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <Field label={t('driverName')} error={err('name')}>
          <input className="field" value={f.name} onChange={set('name')} maxLength={100} required />
        </Field>
        <Field label={t('driverEmail')} error={err('email')}>
          <input className="field" dir="ltr" type="email" value={f.email} onChange={set('email')} required />
        </Field>
        <Field label={t('initialPassword')} error={err('password')}>
          <input className="field" dir="ltr" value={f.password} onChange={set('password')} minLength={8} required />
        </Field>
      </div>

      <div className="flex gap-3 border-t border-line px-6 py-5">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          {t('cancel')}
        </button>
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {t('createDriver')}
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
