import { z } from 'zod'
import { MSG, email, id, localeSchema, optional, phone, text } from './common'

// TODO(before launch): raise this to the full strength policy (12+ chars,
// mixed character classes) once the environment-variable UX issue that led
// to relaxing SEED_ADMIN_PASSWORD is resolved for admin-issued passwords too.
const initialPassword = z.string().min(8).max(128)

/** A Google Maps place/share link — the only URL shape this app ever links out to. */
const googleMapsUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)\//, { error: MSG.invalid })

export const cafeAddressSchema = z.object({
  label: text({ min: 1, max: 60 }),
  city: text({ min: 1, max: 60 }),
  district: text({ min: 1, max: 80 }),
  street: text({ min: 1, max: 120 }),
  buildingNumber: optional(text({ max: 10 })),
  additionalNumber: optional(text({ max: 10 })),
  postalCode: optional(text({ max: 10 })),
  deliveryNotes: optional(text({ max: 300, multiline: true })),
  isDefault: z.boolean().default(false),
})
export type CafeAddressInput = z.input<typeof cafeAddressSchema>

/** Admin-only: creates the account AND its first address in one step. */
export const createCafeAccountSchema = z.object({
  cafeName: text({ min: 2, max: 120 }),
  contactName: optional(text({ max: 100 })),
  phone,
  contactEmail: optional(email),
  password: initialPassword,
  googleMapsUrl: optional(googleMapsUrl),
  address: cafeAddressSchema,
})
export type CreateCafeAccountInput = z.input<typeof createCafeAccountSchema>

export const updateCafeSchema = z.object({
  id,
  cafeName: text({ min: 2, max: 120 }),
  contactName: optional(text({ max: 100 })),
  contactPhone: phone,
  contactEmail: optional(email),
  vatNumber: optional(text({ max: 15 })),
  crNumber: optional(text({ max: 20 })),
  internalNotes: optional(text({ max: 1000, multiline: true })),
  preferredLocale: localeSchema,
  googleMapsUrl: optional(googleMapsUrl),
})

export const cafeIdSchema = z.object({ id })

export const resetCafePasswordSchema = z.object({ id, password: initialPassword })

export const setCafeActiveSchema = z.object({ id, isActive: z.boolean() })

export const deleteCafeAddressSchema = z.object({ id })
export const setDefaultCafeAddressSchema = z.object({ id })
