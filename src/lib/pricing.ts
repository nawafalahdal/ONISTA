// Shared by the schedule/order-builder UI (a live estimate as the café picks
// items) and the server (authoritative totals, computed from DB prices and
// the live SchedulingSettings — see src/server/scheduling.ts).
export const VAT_RATE = 0.15

/** Per-day delivery rates, cheapest first — cafés that commit to more delivery days in one schedule pay less per day. */
export type DeliveryFeeTiers = {
  oneOffHalalas: number
  weekHalalas: number
  biweekHalalas: number
  monthHalalas: number
}

/** Picks the per-day rate for a schedule with `deliveryDays` drop-offs (thresholds mirror the tier names shown to cafés). */
export function pickDeliveryFeePerDay(deliveryDays: number, tiers: DeliveryFeeTiers): number {
  if (deliveryDays >= 16) return tiers.monthHalalas
  if (deliveryDays >= 7) return tiers.biweekHalalas
  if (deliveryDays >= 2) return tiers.weekHalalas
  return tiers.oneOffHalalas
}

/** `deliveryFeeHalalas` is charged per delivery day (each is a separate drop-off). */
export function computeTotals(subtotalHalalas: number, deliveryDays: number, deliveryFeePerDayHalalas: number) {
  const deliveryFeeHalalas = deliveryDays * deliveryFeePerDayHalalas
  const vatHalalas = Math.round((subtotalHalalas + deliveryFeeHalalas) * VAT_RATE)
  return {
    subtotalHalalas,
    deliveryFeeHalalas,
    vatHalalas,
    totalHalalas: subtotalHalalas + deliveryFeeHalalas + vatHalalas,
  }
}
