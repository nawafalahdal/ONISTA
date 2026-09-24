'use client'

import { useState } from 'react'
import { Building2, MapPin, MessageCircle } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import type { AdminTastingRequest } from '@/server/queries/admin'
import { updateTastingRequestStatus } from '@/server/actions/tasting-requests'
import Toast from '@/components/ui/toast'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import { EmptyRow, PageHeader, Panel, StatusSelect, Tabs, TASTING_STATUSES, type TastingStatus } from './ui'

type Filter = 'ALL' | TastingStatus

/** wa.me link from the bakery back to the café, pre-filled with a reply. */
function replyLink(r: AdminTastingRequest) {
  const digits = r.phone.replace(/\D/g, '')
  const items = r.selectedProducts.map((p) => p.titleSnapshot)
  const text =
    r.locale === 'ar'
      ? `مرحباً ${r.cafeName}، شكراً لطلب التجربة من أونيستا! نود تأكيد موعد توصيل صندوق التذوق (${items.join('، ')}).`
      : `Hi ${r.cafeName}, thank you for your tasting request with Onista! We'd love to confirm delivery of your tasting box (${items.join(', ')}).`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export default function TastingTable({ requests }: { requests: AdminTastingRequest[] }) {
  const t = useTranslations('Admin')
  const format = useFormatter()
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [filter, setFilter] = useState<Filter>('ALL')
  const rows = requests.filter((r) => filter === 'ALL' || r.status === filter)
  const statusLabel = (s: TastingStatus) => t(`TastingStatus.${s}`)

  return (
    <div className="space-y-6">
      <PageHeader title={t('tastingTitle')} subtitle={t('tastingSub')} />

      <Panel className="overflow-hidden">
        <div className="border-b border-line p-4">
          <Tabs<Filter>
            id="tasting"
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: 'ALL', label: t('all'), count: requests.length },
              ...TASTING_STATUSES.map((s) => ({ id: s, label: statusLabel(s), count: requests.filter((r) => r.status === s).length })),
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-muted uppercase">
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-start font-medium">{t('colRequest')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colCafe')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colSamples')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colStatus')}</th>
                <th className="px-5 py-3 text-end font-medium">{t('colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-ink-3/50">
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium" dir="ltr">
                      TST-{r.requestNumber}
                    </p>
                    <p className="text-xs text-muted">
                      {format.dateTime(r.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium">{r.cafeName}</p>
                    <p className="text-xs text-muted" dir="ltr">
                      {r.phone}
                    </p>
                    {r.city && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <MapPin size={11} /> {r.city}
                      </p>
                    )}
                  </td>
                  <td className="max-w-[340px] px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {r.selectedProducts.map((p) => (
                        <span key={p.productId} className="rounded-full border border-line bg-ink px-2.5 py-0.5 text-xs text-muted">
                          {p.titleSnapshot}
                        </span>
                      ))}
                    </div>
                    {r.notes && <p className="mt-2 text-xs text-muted italic">“{r.notes}”</p>}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <StatusSelect
                      value={r.status as TastingStatus}
                      options={TASTING_STATUSES}
                      label={statusLabel}
                      disabled={pending}
                      onChange={(status) => run(() => updateTastingRequestStatus({ id: r.id, status }), t('statusUpdated'))}
                    />
                  </td>
                  <td className="px-5 py-4 text-end align-top">
                    <div className="flex justify-end gap-2">
                    <a
                      href={`/admin/clients?cafeName=${encodeURIComponent(r.cafeName)}&phone=${encodeURIComponent(r.phone)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-rose-500/50 hover:text-cream"
                    >
                      <Building2 size={13} /> {t('convertCta')}
                    </a>
                    <a
                      href={replyLink(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (r.status === 'NEW') run(() => updateTastingRequestStatus({ id: r.id, status: 'CONTACTED' }))
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#128C4B] ring-1 ring-[#25D366]/25 ring-inset transition hover:bg-[#25D366]/20 dark:text-[#25D366]"
                    >
                      <MessageCircle size={13} /> {t('reply')}
                    </a>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={5}>{t('noRequests')}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Toast message={toast} />
    </div>
  )
}
