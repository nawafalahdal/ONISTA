'use client'

import { useState } from 'react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { CafeOrder } from '@/server/queries/cafe'
import { requestReturn } from '@/server/actions/returns'
import { cancelOwnOrder } from '@/server/actions/orders'
import { formatSar } from '@/lib/money'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import Toast from '@/components/ui/toast'
import { CloseButton } from '@/components/ui/overlay'

type Delivery = CafeOrder['deliveries'][number]

export default function OrdersList({ orders }: { orders: CafeOrder[] }) {
  const t = useTranslations('Account.Orders')
  const ta = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'
  const { toast, notify } = useToast()
  const [returnTarget, setReturnTarget] = useState<{ orderNumber: number; delivery: Delivery } | null>(null)
  const [cancelTarget, setCancelTarget] = useState<CafeOrder | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-medium">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">{t('empty')}</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-line bg-ink-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium" dir="ltr">
                    ORD-{o.orderNumber}
                  </p>
                  <p className="text-xs text-muted">
                    {o.type === 'WEEKLY_SCHEDULE' ? t('typeWeekly') : t('typeOneOff')} · {format.dateTime(o.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-display text-2xl">{formatSar(o.totalHalalas, locale)}</p>
                  <p className="text-xs text-muted">{ta(`OrderStatus.${o.status}`)}</p>
                  {o.canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(o)}
                      className="mt-1.5 text-xs text-muted underline-offset-2 hover:text-rose-500 hover:underline"
                    >
                      {t('cancelOrder')}
                    </button>
                  )}
                </div>
              </div>
              <ul className="mt-4 space-y-2 border-t border-line pt-4">
                {o.deliveries.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted" dir="ltr">
                      {format.dateTime(d.deliveryDate, { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                    <span className="min-w-0 flex-1 truncate px-2">{d.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(' · ')}</span>
                    <span className="shrink-0 text-xs text-muted">{ta(`DeliveryStatus.${d.status}`)}</span>
                    {d.status === 'DELIVERED' && (
                      <button
                        type="button"
                        onClick={() => setReturnTarget({ orderNumber: o.orderNumber, delivery: d })}
                        className="shrink-0 text-xs text-rose-500 hover:underline dark:text-rose-300"
                      >
                        {t('requestReturn')}
                      </button>
                    )}
                    {d.returnRequest && (
                      <span className="shrink-0 text-xs text-rose-500 dark:text-rose-300">
                        {d.returnRequest.decision === 'PENDING' ? t('returnPending') : t(`returnDecision.${d.returnRequest.decision}` as 'returnDecision.APPROVED')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <ReturnRequestModal
        target={returnTarget}
        onClose={() => setReturnTarget(null)}
        notify={notify}
      />
      <CancelOrderModal target={cancelTarget} onClose={() => setCancelTarget(null)} notify={notify} />
      <Toast message={toast} />
    </div>
  )
}

function ReturnRequestModal({
  target,
  onClose,
  notify,
}: {
  target: { orderNumber: number; delivery: Delivery } | null
  onClose: () => void
  notify: (text: string) => void
}) {
  const t = useTranslations('Account.Orders')
  const { run, pending } = useAdminAction(notify)
  const [reason, setReason] = useState('')

  if (!target) return null
  const close = () => {
    onClose()
    setReason('')
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-line bg-ink-2 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{t('requestReturn')}</h2>
          <CloseButton onClick={close} />
        </div>
        <p className="mt-2 text-sm text-muted" dir="ltr">
          ORD-{target.orderNumber}
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs text-muted">{t('returnReasonLabel')}</span>
          <textarea
            className="field min-h-28"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('returnReasonPh')}
            maxLength={500}
          />
        </label>
        <button
          type="button"
          disabled={pending || reason.trim().length < 5}
          onClick={() =>
            run(
              () => requestReturn({ deliveryId: target.delivery.id, reason }),
              t('returnSubmitted'),
              (res) => res.ok && close(),
            )
          }
          className="btn-primary mt-4 w-full py-3"
        >
          {t('submitReturn')}
        </button>
      </div>
    </div>
  )
}

/**
 * Cancellation is irreversible and moves money, so it asks once and states
 * plainly where the money goes — credit on the account, usable immediately,
 * not a card refund the café would otherwise sit waiting for.
 */
function CancelOrderModal({
  target,
  onClose,
  notify,
}: {
  target: CafeOrder | null
  onClose: () => void
  notify: (text: string) => void
}) {
  const t = useTranslations('Account.Orders')
  const locale = useLocale() as 'ar' | 'en'
  const { run, pending } = useAdminAction(notify)

  if (!target) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-line bg-ink-2 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{t('cancelOrder')}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <p className="mt-2 text-sm text-muted" dir="ltr">
          ORD-{target.orderNumber}
        </p>

        <p className="mt-4 text-sm">{t('cancelConfirmBody')}</p>

        <div className="mt-4 rounded-2xl bg-rose-600/10 p-4">
          <p className="text-xs text-rose-600 dark:text-rose-300">{t('cancelCreditLabel')}</p>
          <p className="mt-1 font-display text-3xl text-rose-500 dark:text-rose-400" dir="ltr">
            {formatSar(target.totalHalalas, locale)}
          </p>
          <p className="mt-2 text-xs text-muted">{t('cancelCreditNote')}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            {t('cancelKeep')}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() => cancelOwnOrder({ id: target.id }), t('cancelDone'), (res) => {
                if (res.ok) onClose()
              })
            }
            className="flex-1 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {t('cancelConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
