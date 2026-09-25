'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { AdminReturnRequest } from '@/server/queries/admin'
import { decideReturn } from '@/server/actions/returns'
import { formatSar } from '@/lib/money'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import Toast from '@/components/ui/toast'
import { EmptyRow, PageHeader, Panel, Tabs } from './ui'

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

const TONE: Record<string, string> = {
  PENDING: 'bg-sky-400/15 text-sky-700 ring-sky-400/30 dark:text-sky-300',
  APPROVED: 'bg-emerald-400/15 text-emerald-700 ring-emerald-400/30 dark:text-emerald-300',
  REJECTED: 'bg-cream/5 text-muted ring-line',
}

export default function ReturnsManager({ requests }: { requests: AdminReturnRequest[] }) {
  const t = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [filter, setFilter] = useState<Filter>('PENDING')
  const rows = requests.filter((r) => filter === 'ALL' || r.decision === filter)

  return (
    <div className="space-y-6">
      <PageHeader title={t('returnsTitle')} subtitle={t('returnsSub')} />

      <Panel className="overflow-hidden">
        <div className="border-b border-line p-4">
          <Tabs<Filter>
            id="returns"
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: 'ALL', label: t('all'), count: requests.length },
              { id: 'PENDING', label: t('ReturnDecision.PENDING'), count: requests.filter((r) => r.decision === 'PENDING').length },
              { id: 'APPROVED', label: t('ReturnDecision.APPROVED'), count: requests.filter((r) => r.decision === 'APPROVED').length },
              { id: 'REJECTED', label: t('ReturnDecision.REJECTED'), count: requests.filter((r) => r.decision === 'REJECTED').length },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-muted uppercase">
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-start font-medium">{t('colOrder')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colCafe')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('returnReason')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colStatus')}</th>
                <th className="px-5 py-3 text-end font-medium">{t('colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-ink-3/50">
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium" dir="ltr">
                      ORD-{r.delivery.order.orderNumber}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted" dir="ltr">
                      <CalendarDays size={11} /> {format.dateTime(r.delivery.deliveryDate, { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="mt-1 text-xs font-semibold">{formatSar(r.delivery.subtotalHalalas, locale)}</p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium">{r.cafe.cafeName}</p>
                    <p className="text-xs text-muted" dir="ltr">
                      {r.cafe.contactPhone}
                    </p>
                  </td>
                  <td className="max-w-[320px] px-5 py-4 align-top">
                    <p className="text-sm">{r.reason}</p>
                    {r.adminNotes && <p className="mt-1 text-xs text-muted italic">{r.adminNotes}</p>}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${TONE[r.decision]}`}>
                      {t(`ReturnDecision.${r.decision}`)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-end align-top">
                    {r.decision === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => decideReturn({ id: r.id, decision: 'REJECTED' }), t('statusUpdated'))}
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-rose-500/50 hover:text-cream"
                        >
                          {t('reject')}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => decideReturn({ id: r.id, decision: 'APPROVED' }), t('statusUpdated'))}
                          className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
                        >
                          {t('approve')}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted">{r.decidedBy?.name}</p>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={5}>{t('noReturns')}</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Toast message={toast} />
    </div>
  )
}
