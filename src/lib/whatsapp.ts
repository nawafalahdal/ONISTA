type TastingMessage = {
  requestNumber: number
  cafeName: string
  phone: string
  city?: string | null
  notes?: string | null
  items: string[]
}

/** Builds the bilingual wa.me deep link sent after a tasting request. */
export function buildTastingWhatsAppUrl(businessNumber: string, m: TastingMessage) {
  const lines = [
    `طلب تجربة للكافيه #TST-${m.requestNumber} — Onista Cake Shop`,
    '',
    `☕ الكافيه / Café: ${m.cafeName}`,
    `📞 الجوال / Phone: ${m.phone}`,
    ...(m.city ? [`📍 المدينة / City: ${m.city}`] : []),
    '',
    'الأصناف المطلوبة / Requested samples:',
    ...m.items.map((title, i) => `${i + 1}. ${title}`),
    ...(m.notes ? ['', `📝 ${m.notes}`] : []),
  ]
  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(lines.join('\n'))}`
}
