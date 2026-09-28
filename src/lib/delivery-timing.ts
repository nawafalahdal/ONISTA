import { DELIVERY_WINDOWS } from './constants'

/** Saudi Arabia is UTC+3 year round — no daylight saving to account for. */
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000

/** How long before its window a prepared drop becomes collectable. */
export const PICKUP_HEAD_START_MS = 3 * 60 * 60 * 1000

/**
 * The absolute moment a drop's window opens: its calendar date at the
 * window's local start time, converted out of Riyadh time.
 */
export function windowStartMs(deliveryDate: Date, timeWindow: string | null): number {
  const dateISO = deliveryDate.toISOString().slice(0, 10)
  const [startClock] = (timeWindow ?? DELIVERY_WINDOWS[0]).split('-')
  return Date.parse(`${dateISO}T${startClock}:00Z`) - RIYADH_OFFSET_MS
}

export type DeliveryTiming = {
  /** May the driver collect/deliver this right now? */
  canAct: boolean
  /** Why it is not yet actionable — drives the label the driver sees. */
  reason: 'urgent' | 'carrying' | 'open' | 'tooEarly' | 'waitingKitchen'
  /** When the window opens. */
  windowStartMs: number
  /** When the driver may first collect it (window start minus the head start). */
  opensAtMs: number
}

/**
 * The single rule for what a driver may act on, so the run sheet and the
 * server agree. Visibility is deliberately separate: a driver sees the whole
 * queue days ahead, but may only collect a drop the kitchen has finished, and
 * only once it is close enough to its window — unless an admin marked it
 * urgent, or they are already carrying it.
 */
export function deliveryTiming(
  delivery: { deliveryDate: Date; timeWindow: string | null; status: string; isUrgent: boolean },
  now: number,
): DeliveryTiming {
  const startsAt = windowStartMs(delivery.deliveryDate, delivery.timeWindow)
  const opensAt = startsAt - PICKUP_HEAD_START_MS
  const base = { windowStartMs: startsAt, opensAtMs: opensAt }

  if (delivery.status === 'OUT_FOR_DELIVERY') return { ...base, canAct: true, reason: 'carrying' }
  if (delivery.isUrgent) return { ...base, canAct: true, reason: 'urgent' }
  if (delivery.status !== 'READY_FOR_PICKUP') return { ...base, canAct: false, reason: 'waitingKitchen' }
  if (now < opensAt) return { ...base, canAct: false, reason: 'tooEarly' }
  return { ...base, canAct: true, reason: 'open' }
}
