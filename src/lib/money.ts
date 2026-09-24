export const VAT_RATE = 0.15

/** 12.5 SAR → 1250 halalas. Rounds to the nearest halala. */
export const sarToHalalas = (sar: number) => Math.round(sar * 100)
export const halalasToSar = (halalas: number) => halalas / 100

export function formatSar(halalas: number, locale: 'ar' | 'en') {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(halalasToSar(halalas))
}
