// Shared by the schedule/order-builder UI (a live estimate as the café picks
// items) and the server (authoritative totals, computed from DB prices and
// the live SchedulingSettings — see src/server/scheduling.ts).
export const VAT_RATE = 0.15

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
