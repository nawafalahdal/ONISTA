'use server'

import { updateTag } from 'next/cache'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { TAGS } from '@/server/queries/catalog'
import { fieldErrors } from '@/lib/validation/common'
import { blackoutDateDeleteSchema, blackoutDateSchema, schedulingSettingsSchema } from '@/lib/validation/scheduling'
import { db } from '@/server/db'
import { guardStaffAction } from '@/server/dal/guard'
import { audit } from '@/server/security/audit'

/** ADMIN only: these rules are what enforces "no same-day delivery" storewide. */
export async function updateSchedulingSettings(input: unknown): Promise<ActionResult<undefined>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = schedulingSettingsSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))

  await db.schedulingSettings.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } })
  await audit({ actorId: user.id, action: 'scheduling.update', entityType: 'SchedulingSettings', metadata: parsed.data })
  updateTag(TAGS.scheduling)
  return ok(undefined)
}

export async function addBlackoutDate(input: unknown): Promise<ActionResult<undefined>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = blackoutDateSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { date, reasonAr, reasonEn } = parsed.data

  await db.blackoutDate.upsert({
    where: { date: new Date(`${date}T00:00:00Z`) },
    update: { reasonAr, reasonEn },
    create: { date: new Date(`${date}T00:00:00Z`), reasonAr, reasonEn },
  })
  await audit({ actorId: user.id, action: 'scheduling.blackout_add', entityType: 'BlackoutDate', entityId: date })
  return ok(undefined)
}

export async function removeBlackoutDate(input: unknown): Promise<ActionResult<undefined>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = blackoutDateDeleteSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))

  await db.blackoutDate.delete({ where: { date: new Date(`${parsed.data.date}T00:00:00Z`) } }).catch(() => null)
  await audit({ actorId: user.id, action: 'scheduling.blackout_remove', entityType: 'BlackoutDate', entityId: parsed.data.date })
  return ok(undefined)
}
