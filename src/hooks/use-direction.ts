'use client'

import { useLocale } from 'next-intl'

/** 1 for LTR, -1 for RTL: multiply horizontal motion offsets by this. */
export function useDirection() {
  const rtl = useLocale() === 'ar'
  return { rtl, sign: rtl ? -1 : 1 }
}
