// Shared by the checkout UI (estimate) and the server (authoritative totals).
export const DELIVERY_FEE_HALALAS = 2500 // 25 SAR
export const VAT_RATE = 0.15

export type Fulfillment = 'DELIVERY' | 'PICKUP'

export function computeTotals(subtotalHalalas: number, fulfillment: Fulfillment) {
  const deliveryFeeHalalas = fulfillment === 'DELIVERY' ? DELIVERY_FEE_HALALAS : 0
  const vatHalalas = Math.round((subtotalHalalas + deliveryFeeHalalas) * VAT_RATE)
  return {
    subtotalHalalas,
    deliveryFeeHalalas,
    vatHalalas,
    totalHalalas: subtotalHalalas + deliveryFeeHalalas + vatHalalas,
  }
}
