import { useState } from 'react'
import { MapPin, MessageCircle } from 'lucide-react'
import { EmptyRow, PageHeader, Panel, StatusSelect, Tabs, TASTING_STATUSES } from './ui.jsx'
import { formatTime } from '../../lib/format.js'
import { useStore } from '../../store/StoreProvider.jsx'

/** wa.me link from the bakery back to the café, pre-filled with a reply. */
function replyLink(r) {
  let digits = r.phone.replace(/\D/g, '')
  if (digits.startsWith('05')) digits = `966${digits.slice(1)}`
  const text = `مرحباً ${r.cafeName}، شكراً لطلب التجربة من أونيستا! نود تأكيد موعد توصيل صندوق التذوق (${r.items.join('، ')}).`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export default function TastingTable() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('All')
  const rows = state.tastingRequests.filter((r) => filter === 'All' || r.status === filter)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Café tasting requests"
        subtitle={
          <>
            B2B leads from the <span dir="rtl">طلب تجربة للكافيه</span> form.
          </>
        }
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-line p-4">
          <Tabs
            id="tasting"
            value={filter}
            onChange={setFilter}
            tabs={['All', ...TASTING_STATUSES].map((s) => ({
              id: s,
              label: s,
              count: s === 'All' ? state.tastingRequests.length : state.tastingRequests.filter((r) => r.status === s).length,
            }))}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.15em] text-muted">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="px-5 py-3 font-medium">Café</th>
                <th className="px-5 py-3 font-medium">Samples</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-ink-3/50">
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium">{r.id}</p>
                    <p className="text-xs text-muted">{formatTime(r.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p className="font-medium">{r.cafeName}</p>
                    <p className="text-xs text-muted">{r.phone}</p>
                    {r.city && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <MapPin size={11} /> {r.city}
                      </p>
                    )}
                  </td>
                  <td className="max-w-[340px] px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {r.items.map((i) => (
                        <span key={i} className="rounded-full border border-line bg-ink px-2.5 py-0.5 text-xs text-muted">
                          {i}
                        </span>
                      ))}
                    </div>
                    {r.notes && <p className="mt-2 text-xs italic text-muted">“{r.notes}”</p>}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <StatusSelect
                      value={r.status}
                      options={TASTING_STATUSES}
                      onChange={(status) => dispatch({ type: 'tasting/setStatus', id: r.id, status })}
                    />
                  </td>
                  <td className="px-5 py-4 text-right align-top">
                    <a
                      href={replyLink(r)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => r.status === 'New' && dispatch({ type: 'tasting/setStatus', id: r.id, status: 'Contacted' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#25D366] ring-1 ring-inset ring-[#25D366]/25 transition hover:bg-[#25D366]/20"
                    >
                      <MessageCircle size={13} /> Reply
                    </a>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={5}>No tasting requests here yet.</EmptyRow>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
