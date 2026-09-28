// Calendar-date helpers, all timezone-anchored to Asia/Riyadh (no external
// date library needed — Onista operates in one timezone). Dates are handled
// as 'YYYY-MM-DD' strings ("ISO dates") and compared as UTC midnight, which
// keeps day arithmetic simple and immune to local-timezone drift.

const TZ = 'Asia/Riyadh'
export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/** Current wall-clock date/hour in Riyadh, independent of the server's own timezone. */
export function riyadhNowParts(): { dateISO: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  // en-CA gives YYYY-MM-DD; the hour cycle can report "24" at midnight.
  const hour = Number(get('hour')) % 24
  return { dateISO: `${get('year')}-${get('month')}-${get('day')}`, hour }
}

export const riyadhToday = () => riyadhNowParts().dateISO

/** 0 = Sunday … 6 = Saturday, computed on the calendar date (not a moment). */
export function dayOfWeek(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getUTCDay()
}

export function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const isValidISODate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())

export const compareISO = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
