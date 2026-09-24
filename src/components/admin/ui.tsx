'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const
export const TASTING_STATUSES = ['NEW', 'CONTACTED', 'SCHEDULED', 'CONVERTED', 'DECLINED'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type TastingStatus = (typeof TASTING_STATUSES)[number]

const TONE: Record<string, string> = {
  PENDING: 'bg-rose-500/15 text-rose-600 ring-rose-500/30 dark:text-rose-300',
  NEW: 'bg-rose-500/15 text-rose-600 ring-rose-500/30 dark:text-rose-300',
  CONFIRMED: 'bg-amber-400/15 text-amber-700 ring-amber-400/30 dark:text-amber-300',
  PREPARING: 'bg-amber-400/15 text-amber-700 ring-amber-400/30 dark:text-amber-300',
  CONTACTED: 'bg-amber-400/15 text-amber-700 ring-amber-400/30 dark:text-amber-300',
  READY: 'bg-sky-400/15 text-sky-700 ring-sky-400/30 dark:text-sky-300',
  SCHEDULED: 'bg-sky-400/15 text-sky-700 ring-sky-400/30 dark:text-sky-300',
  OUT_FOR_DELIVERY: 'bg-violet-400/15 text-violet-700 ring-violet-400/30 dark:text-violet-300',
  DELIVERED: 'bg-emerald-400/15 text-emerald-700 ring-emerald-400/30 dark:text-emerald-300',
  CONVERTED: 'bg-emerald-400/15 text-emerald-700 ring-emerald-400/30 dark:text-emerald-300',
  CANCELLED: 'bg-cream/5 text-muted ring-line',
  DECLINED: 'bg-cream/5 text-muted ring-line',
}

/** Coloured status pill that is also a native <select> for quick edits. */
export function StatusSelect<T extends string>({
  value,
  options,
  label,
  onChange,
  disabled,
}: {
  value: T
  options: readonly T[]
  label: (v: T) => string
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <label className={`relative inline-flex items-center rounded-full ring-1 ring-inset ${TONE[value] ?? TONE.CANCELLED} ${disabled ? 'opacity-60' : ''}`}>
      <span className="sr-only">Status</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="cursor-pointer appearance-none bg-transparent py-1 ps-3 pe-7 text-xs font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink-2 text-cream">
            {label(o)}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute end-2.5" />
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      dir="ltr"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
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

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
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

export function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-ink-2 ${className}`}>{children}</div>
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  id,
}: {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  id: string
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto">
      {tabs.map((t) => (
        <button
          type="button"
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs transition ${
            value === t.id ? 'text-cream' : 'text-muted hover:text-cream'
          }`}
        >
          {value === t.id && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-full bg-ink-3 ring-1 ring-line" />}
          <span className="relative">
            {t.label}
            {t.count != null && <span className="ms-1.5 text-muted">{t.count}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-16 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  )
}
