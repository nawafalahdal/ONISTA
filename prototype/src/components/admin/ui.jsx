import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export const ORDER_STATUSES = ['New', 'Preparing', 'Ready', 'Out for delivery', 'Delivered', 'Cancelled']
export const TASTING_STATUSES = ['New', 'Contacted', 'Scheduled', 'Converted', 'Declined']

const TONE = {
  New: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  Preparing: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  Contacted: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  Ready: 'bg-sky-400/10 text-sky-300 ring-sky-400/25',
  Scheduled: 'bg-sky-400/10 text-sky-300 ring-sky-400/25',
  'Out for delivery': 'bg-violet-400/10 text-violet-300 ring-violet-400/25',
  Delivered: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  Converted: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  Cancelled: 'bg-white/5 text-muted ring-white/10',
  Declined: 'bg-white/5 text-muted ring-white/10',
}

/** Colored status pill that is also a native <select> for quick edits. */
export function StatusSelect({ value, options, onChange }) {
  return (
    <label className={`relative inline-flex items-center rounded-full ring-1 ring-inset ${TONE[value] ?? TONE.Cancelled}`}>
      <span className="sr-only">Status</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent py-1 pl-3 pr-7 text-xs font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink-2 text-cream">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2.5" />
    </label>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-rose-600' : 'bg-line'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        className={`h-5 w-5 rounded-full bg-white shadow ${checked ? 'ml-[22px]' : 'ml-0.5'}`}
      />
    </button>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl font-medium">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function Panel({ className = '', children }) {
  return <div className={`rounded-2xl border border-line bg-ink-2 ${className}`}>{children}</div>
}

export function Tabs({ tabs, value, onChange, id }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs transition ${
            value === t.id ? 'text-cream' : 'text-muted hover:text-cream'
          }`}
        >
          {value === t.id && (
            <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-full bg-ink-3 ring-1 ring-line" />
          )}
          <span className="relative">
            {t.label}
            {t.count != null && <span className="ml-1.5 text-muted">{t.count}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-16 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  )
}
