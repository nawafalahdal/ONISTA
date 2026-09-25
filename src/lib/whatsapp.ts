type TastingMessage = {
  requestNumber: number
  cafeName: string
  phone: string
  city?: string | null
  notes?: string | null
  items: string[]
}

/** Builds the wa.me deep link sent after a tasting request — branded, warm, WhatsApp-formatted. */
export function buildTastingWhatsAppUrl(businessNumber: string, m: TastingMessage) {
  const lines = [
    'مرحباً 👋 معكم فريق *Onista* لحلويات الجملة',
    '',
    `يسعدنا استلام طلب تجربة جديد *#TST-${m.requestNumber}*`,
    '',
    `☕ *الكافيه:* ${m.cafeName}`,
    ...(m.city ? [`📍 *المدينة:* ${m.city}`] : []),
    `📞 *الجوال:* ${m.phone}`,
    '',
    '🍰 *الأصناف المطلوبة للتذوق:*',
    ...m.items.map((title, i) => `${i + 1}. ${title}`),
    ...(m.notes ? ['', `📝 *ملاحظات:* ${m.notes}`] : []),
    '',
    'راح نجهّز لكم صندوق التذوق ونأكد معكم موعد التوصيل قريباً 🌸',
  ]
  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(lines.join('\n'))}`
}
