'use client'

import type { ReactNode } from 'react'
import { ThemeProvider as NextThemes } from 'next-themes'

/** Dark by default (the brand look); visitors can switch and it's remembered. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemes>
  )
}
