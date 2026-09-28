'use server'

import { cookies } from 'next/headers'
import { localeSchema } from '@/lib/validation/common'

/** Admin language preference (the admin area has no locale prefix in its URLs). */
export async function setAdminLocale(locale: unknown) {
  const parsed = localeSchema.safeParse(locale)
  if (!parsed.success) return
  ;(await cookies()).set('NEXT_LOCALE', parsed.data, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
  })
}
