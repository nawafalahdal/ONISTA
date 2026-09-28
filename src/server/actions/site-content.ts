'use server'

import { updateTag } from 'next/cache'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import { siteContentSchema } from '@/lib/validation/site-content'
import { TAGS } from '@/server/queries/catalog'
import { db } from '@/server/db'
import { guardStaffAction } from '@/server/dal/guard'
import { audit } from '@/server/security/audit'

/** ADMIN only: the About paragraph and stat numbers shown on the storefront. */
export async function updateSiteContent(input: unknown): Promise<ActionResult<undefined>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = siteContentSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))

  await db.siteContent.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } })
  await audit({ actorId: user.id, action: 'siteContent.update', entityType: 'SiteContent' })
  updateTag(TAGS.siteContent)
  return ok(undefined)
}
