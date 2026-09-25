import { z } from 'zod'

// Error messages are i18n keys resolved on the client (messages → "Validation").
export const MSG = {
  required: 'required',
  tooLong: 'tooLong',
  invalid: 'invalid',
  invalidPhone: 'invalidPhone',
  invalidEmail: 'invalidEmail',
} as const

// C0/C1 control characters except tab and newline, plus bidi overrides and
// zero-width characters that can be abused to spoof text direction/content.
const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g

/**
 * Sanitised free text: NFC-normalised, unsafe characters stripped, whitespace
 * collapsed and trimmed, and angle brackets rejected. React escapes output and
 * we never render HTML from user input, so this is defence in depth (also
 * keeps WhatsApp / admin views clean).
 */
export function text({ min = 1, max, multiline = false }: { min?: number; max: number; multiline?: boolean }) {
  return z
    .string({ error: MSG.required })
    .normalize('NFC')
    .overwrite((v) => {
      const cleaned = v.replace(UNSAFE_CHARS, '')
      return multiline
        ? cleaned.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
        : cleaned.replace(/\s+/g, ' ').trim()
    })
    .min(min, { error: MSG.required })
    .max(max, { error: MSG.tooLong })
    .refine((v) => !/[<>]/.test(v), { error: MSG.invalid })
}

/** Treat missing (FormData → null) or blank inputs as "not provided". */
export const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v == null || (typeof v === 'string' && v.trim() === '') ? undefined : v), schema.optional())

/**
 * Phone numbers normalised to E.164. Saudi local formats (05XXXXXXXX,
 * 5XXXXXXXX, 009665...) are converted; other countries need a + prefix.
 */
export const phone = z
  .string({ error: MSG.required })
  .transform((v) => v.replace(/[\s\-().]/g, '').replace(/^00/, '+'))
  .transform((v) => {
    if (/^05\d{8}$/.test(v)) return `+966${v.slice(1)}`
    if (/^5\d{8}$/.test(v)) return `+966${v}`
    if (/^9665\d{8}$/.test(v)) return `+${v}`
    return v
  })
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, { error: MSG.invalidPhone }))

export const email = z.email({ error: MSG.invalidEmail }).max(254, { error: MSG.tooLong }).toLowerCase()

export const id = z.cuid({ error: MSG.invalid })

/** A calendar date as 'YYYY-MM-DD', no time component. */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: MSG.invalid })

export const localeSchema = z.enum(['ar', 'en'])

/** HTML checkbox ("on") or JSON boolean. */
export const checkbox = z
  .union([z.boolean(), z.literal('on'), z.literal('true'), z.literal('false')])
  .optional()
  .transform((v) => v === true || v === 'on' || v === 'true')

/** Flatten a ZodError into { field: [i18nKey, ...] } using dotted paths. */
/** A Google Maps place/share link — the only URL shape this app ever links out to. */
export const googleMapsUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)\//, { error: MSG.invalid })

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    ;(out[key] ??= []).push(issue.message)
  }
  return out
}
