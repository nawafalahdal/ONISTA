'use server'

import { fail, ok, type ActionResult } from '@/lib/action-result'
import { cafeAddressSchema, deleteCafeAddressSchema, setDefaultCafeAddressSchema } from '@/lib/validation/cafe'
import { fieldErrors } from '@/lib/validation/common'
import { db } from '@/server/db'
import { guardCafeAction } from '@/server/dal/guard'

/** Café self-service: saved delivery addresses, reused across orders. */
export async function createCafeAddress(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardCafeAction()
  if (denied) return denied

  const parsed = cafeAddressSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const data = parsed.data

  const address = await db.$transaction(async (tx) => {
    if (data.isDefault) await tx.cafeAddress.updateMany({ where: { cafeId: user.cafeId }, data: { isDefault: false } })
    return tx.cafeAddress.create({ data: { ...data, cafeId: user.cafeId }, select: { id: true } })
  })
  return ok({ id: address.id })
}

export async function setDefaultCafeAddress(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardCafeAction()
  if (denied) return denied

  const parsed = setDefaultCafeAddressSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id } = parsed.data

  const owned = await db.cafeAddress.findFirst({ where: { id, cafeId: user.cafeId }, select: { id: true } })
  if (!owned) return fail('notFound')

  await db.$transaction([
    db.cafeAddress.updateMany({ where: { cafeId: user.cafeId }, data: { isDefault: false } }),
    db.cafeAddress.update({ where: { id }, data: { isDefault: true } }),
  ])
  return ok({ id })
}

export async function archiveCafeAddress(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardCafeAction()
  if (denied) return denied

  const parsed = deleteCafeAddressSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id } = parsed.data

  const { count } = await db.cafeAddress.updateMany({
    where: { id, cafeId: user.cafeId },
    data: { archivedAt: new Date(), isDefault: false },
  })
  if (count === 0) return fail('notFound')
  return ok({ id })
}
