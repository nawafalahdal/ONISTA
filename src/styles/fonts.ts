import { Cormorant_Garamond, Manrope, Tajawal } from 'next/font/google'

// Self-hosted at build time by next/font, so the CSP can keep font-src 'self'.
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

export const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
})

export const fontVariables = `${cormorant.variable} ${manrope.variable} ${tajawal.variable}`
