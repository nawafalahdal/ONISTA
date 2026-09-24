'use server'

import { env } from '@/env'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import { tastingNotesSchema, tastingRequestSchema, tastingStatusSchema } from '@/lib/validation/tasting-request'
import { buildTastingWhatsAppUrl } from '@/lib/whatsapp'
import { db } from '@/server/db'
import { guardStaffAction } from '@/server/dal/guard'
import { audit } from '@/server/security/audit'
import { rateLimit } from '@/server/security/rate-limit'
import { getClientIp, hashIp } from '@/server/security/request'

export type TastingSubmitResult = ActionResult<{ requestNumber: number; whatsappUrl: string } | { requestNumber: null; whatsappUrl: null }>

/**
 * PUBLIC action behind the "طلب تجربة للكافيه" form. Compatible with
 * `useActionState` and progressive enhancement (works without JS).
 */
export async function submitTastingRequest(_prev: TastingSubmitResult | null, formData: FormData): Promise<TastingSubmitResult> {
  // 1. Honeypot: bots fill every field. Pretend success, store nothing.
  if (formData.get('website')) return ok({ requestNumber: null, whatsappUrl: null })

  // 2. Rate limit per IP before doing any work.
  const ip = await getClientIp()
  if (!(await rateLimit('tastingRequest', ip)).success) return fail('rateLimited')

  // 3. Validate and sanitise everything that came from the client.
  const parsed = tastingRequestSchema.safeParse({
    cafeName: formData.get('cafeName'),
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    city: formData.get('city'),
    notes: formData.get('notes'),
    productIds: formData.getAll('productIds'),
    locale: formData.get('locale') ?? undefined,
  })
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { productIds, locale, ...contact } = parsed.data

  // 4. A second limit per phone number stops one café from flooding requests.
  if (!(await rateLimit('tastingRequestPhone', contact.phone)).success) return fail('rateLimited')

  // 5. Never trust client-supplied IDs: re-check each item is currently offered.
  const products = await db.product.findMany({
    where: { id: { in: productIds }, archivedAt: null, inStock: true, isTastingMenu: true },
    select: { id: true, translations: { where: { locale }, select: { title: true } } },
  })
  if (products.length !== productIds.length || products.some((p) => !p.translations[0])) {
    return fail('unavailableSamples', { productIds: ['unavailableSamples'] })
  }

  const request = await db.tastingRequest.create({
    data: {
      ...contact,
      locale,
      ipHash: hashIp(ip),
      selectedProducts: {
        create: products.map((p) => ({ productId: p.id, titleSnapshot: p.translations[0]!.title })),
      },
    },
    select: { requestNumber: true, cafeName: true, phone: true, city: true, notes: true },
  })

  // 6. The WhatsApp link is built server-side from validated, stored data.
  const whatsappUrl = buildTastingWhatsAppUrl(env.BUSINESS_WHATSAPP_NUMBER, {
    ...request,
    items: products.map((p) => p.translations[0]!.title),
  })
  return ok({ requestNumber: request.requestNumber, whatsappUrl })
}

/** STAFF: move a request through NEW → CONTACTED → SCHEDULED → CONVERTED / DECLINED. */
export async function updateTastingRequestStatus(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = tastingStatusSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, status } = parsed.data

  const { count } = await db.tastingRequest.updateMany({ where: { id }, data: { status } })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'tasting.status', entityType: 'TastingRequest', entityId: id, metadata: { status } })
  return ok({ id })
}

/** STAFF: internal follow-up notes (never shown to the café). */
export async function updateTastingRequestNotes(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = tastingNotesSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, staffNotes } = parsed.data

  const { count } = await db.tastingRequest.updateMany({ where: { id }, data: { staffNotes } })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'tasting.notes', entityType: 'TastingRequest', entityId: id })
  return ok({ id })
}
