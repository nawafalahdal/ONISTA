'use client'

import { useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ActionResult } from '@/lib/action-result'

/**
 * Runs a staff Server Action, refreshes the server-rendered admin data on
 * success, and turns error codes into translated messages.
 */
export function useAdminAction(notify: (text: string) => void) {
  const router = useRouter()
  const tv = useTranslations('Validation')
  const [pending, startTransition] = useTransition()

  const run = useCallback(
    <T,>(action: () => Promise<ActionResult<T>>, successText?: string, onDone?: (r: ActionResult<T>) => void) =>
      startTransition(async () => {
        try {
          const res = await action()
          if (res.ok) {
            if (successText) notify(successText)
            router.refresh()
          } else {
            notify(tv(res.error as 'generic'))
          }
          onDone?.(res)
        } catch {
          notify(tv('generic'))
        }
      }),
    [notify, router, tv],
  )

  return { run, pending }
}
