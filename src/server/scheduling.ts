import 'server-only'
import { connection } from 'next/server'
import { addDays, compareISO, dayOfWeek, riyadhNowParts } from '@/lib/date'
import { db } from '@/server/db'

export type SchedulingContext = {
  cutoffHour: number
  minLeadDays: number
  maxAdvanceDays: number
  deliveryWeekdays: number[]
  deliveryFeeHalalas: number
  blackout: Set<string>
  todayISO: string
}

/**
 * Loads the live scheduling rules. Always read fresh (no cache): this backs
 * both the date picker and the order-time validation, and the admin can
 * change these rules at any moment.
 */
export async function getSchedulingContext(): Promise<SchedulingContext> {
  // "Now" is inherently per-request; opt out of prerendering explicitly
  // rather than relying on a caller's own dynamic API call to do it first.
  await connection()
  const [settings, blackoutRows] = await Promise.all([
    db.schedulingSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    db.blackoutDate.findMany({ select: { date: true } }),
  ])
  const { dateISO, hour } = riyadhNowParts()
  return {
    cutoffHour: settings.cutoffHour,
    minLeadDays: Math.max(1, settings.minLeadDays), // never allow same-day, even if misconfigured
    maxAdvanceDays: settings.maxAdvanceDays,
    deliveryWeekdays: settings.deliveryWeekdays,
    deliveryFeeHalalas: settings.deliveryFeeHalalas,
    blackout: new Set(blackoutRows.map((b) => b.date.toISOString().slice(0, 10))),
    todayISO: dateISO,
  }
}

/** Is `dateISO` a calendar day the kitchen delivers on at all (weekday + not blacked out)? */
function isDeliverableWeekday(dateISO: string, ctx: SchedulingContext): boolean {
  return ctx.deliveryWeekdays.includes(dayOfWeek(dateISO)) && !ctx.blackout.has(dateISO)
}

/**
 * The earliest calendar date that can ever be offered right now: today plus
 * the minimum lead time, pushed one more day if the daily cut-off has
 * already passed, then rolled forward over non-delivery days/blackouts.
 * This is the single source of truth behind "no same-day delivery".
 */
export function earliestAllowedDate(ctx: SchedulingContext): string {
  const pastCutoff = riyadhNowParts().hour >= ctx.cutoffHour
  let candidate = addDays(ctx.todayISO, ctx.minLeadDays + (pastCutoff ? 1 : 0))
  const limit = addDays(ctx.todayISO, ctx.maxAdvanceDays)
  while (!isDeliverableWeekday(candidate, ctx) && compareISO(candidate, limit) <= 0) {
    candidate = addDays(candidate, 1)
  }
  return candidate
}

/** Authoritative check used by every order-creating Server Action. */
export function isDateAllowed(dateISO: string, ctx: SchedulingContext): boolean {
  const earliest = earliestAllowedDate(ctx)
  const latest = addDays(ctx.todayISO, ctx.maxAdvanceDays)
  return compareISO(dateISO, earliest) >= 0 && compareISO(dateISO, latest) <= 0 && isDeliverableWeekday(dateISO, ctx)
}

/** Every allowed date in [fromISO, fromISO + span) — used to render pickers. */
export function listAllowedDates(ctx: SchedulingContext, fromISO: string, span: number): string[] {
  const out: string[] = []
  for (let i = 0; i < span; i++) {
    const d = addDays(fromISO, i)
    if (isDateAllowed(d, ctx)) out.push(d)
  }
  return out
}
