import { formatSar } from './money'

type TastingMessage = {
  requestNumber: number
  cafeName: string
  phone: string
  city?: string | null
  notes?: string | null
  locationUrl?: string | null
  items: string[]
  extraSamplesCount: number
  extraFeeHalalas: number
}

/**
 * The message the café sends to Onista after submitting a tasting request.
 * Written in the café's own voice, because the café is the one pressing send.
 *
 * Deliberately emoji-free: WhatsApp on some desktop setups renders them as
 * question-mark boxes, which made the previous version look broken. Structure
 * comes from WhatsApp's own *bold* markers and spacing instead.
 */
export function buildTastingWhatsApp(businessNumber: string, m: TastingMessage) {
  const lines = [
    `السلام عليكم، معكم *${m.cafeName}*.`,
    '',
    'لدينا طلب عينات مسجّل عبر نظام أونيستا، ونرجو مراجعته وتأكيد موعد التذوق.',
    '',
    `*رقم الطلب:* TST-${m.requestNumber}`,
    ...(m.city ? [`*المدينة:* ${m.city}`] : []),
    `*للتواصل:* ${m.phone}`,
    ...(m.locationUrl ? [`*موقع المحل:* ${m.locationUrl}`] : []),
    '',
    '*الأصناف المطلوبة للتذوق:*',
    ...m.items.map((title, i) => `${i + 1}. ${title}`),
    ...(m.extraSamplesCount > 0
      ? ['', `*عينات إضافية:* ${m.extraSamplesCount}`, `*رسوم العينات الإضافية:* ${formatSar(m.extraFeeHalalas, 'ar')}`]
      : []),
    ...(m.notes ? ['', `*ملاحظات:* ${m.notes}`] : []),
    '',
    'شاكرين لكم، وبانتظار ردكم.',
  ]

  const text = lines.join('\n')
  return { text, url: `https://wa.me/${businessNumber}?text=${encodeURIComponent(text)}` }
}
