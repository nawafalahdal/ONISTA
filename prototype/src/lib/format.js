const sar = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export const formatPrice = (value) => `${sar.format(value)} SAR`

export const formatTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export const nextId = (prefix, list) => {
  const max = list.reduce((m, x) => Math.max(m, Number(x.id.split('-')[1]) || 0), 0)
  return `${prefix}-${max + 1}`
}

/** Build a wa.me deep link for a B2B tasting request. */
export function buildTastingWhatsAppLink(businessNumber, { cafeName, phone, city, items, notes }) {
  const lines = [
    'طلب تجربة للكافيه — Onista Cake Shop',
    '',
    `☕ Cafe / الكافيه: ${cafeName}`,
    `📞 Phone / الجوال: ${phone}`,
    ...(city ? [`📍 City / المدينة: ${city}`] : []),
    '',
    'Requested samples / الأصناف المطلوبة:',
    ...items.map((name, i) => `${i + 1}. ${name}`),
    ...(notes ? ['', `📝 Notes: ${notes}`] : []),
  ]

  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(lines.join('\n'))}`
}
