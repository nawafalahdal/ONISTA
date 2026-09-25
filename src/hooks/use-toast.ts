'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ToastMessage } from '@/components/ui/toast'

export function useToast(duration = 2400) {
  const [toast, setToast] = useState<ToastMessage>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const notify = useCallback(
    (text: string) => {
      clearTimeout(timer.current)
      setToast({ text, key: Date.now() })
      timer.current = setTimeout(() => setToast(null), duration)
    },
    [duration],
  )
  useEffect(() => () => clearTimeout(timer.current), [])
  return { toast, notify }
}
