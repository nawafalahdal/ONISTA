import { z } from 'zod'
import { IMAGE_HOSTS } from '@/config/security'
import { sarToHalalas } from '@/lib/money'
import { MSG, checkbox, id, optional, text } from './common'

const translation = z.object({
  title: text({ min: 2, max: 120 }),
  description: text({ min: 10, max: 1000, multiline: true }),
  badge: optional(text({ max: 32 })),
})

/** HTTPS images from allow-listed hosts only (mirrors next.config remotePatterns). */
const imageUrl = z
  .url({ protocol: /^https$/, error: MSG.invalid })
  .max(500)
  .refine((u) => (IMAGE_HOSTS as readonly string[]).includes(new URL(u).hostname), { error: 'imageHostNotAllowed' })

const image = z.object({
  url: imageUrl,
  altAr: optional(text({ max: 160 })),
  altEn: optional(text({ max: 160 })),
})

/** Prices are entered in SAR (e.g. 185 or 42.5) and stored as halalas. */
export const price = z.coerce
  .number({ error: MSG.invalid })
  .positive({ error: MSG.invalid })
  .max(100_000, { error: MSG.invalid })
  .transform(sarToHalalas)

export const productInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, { error: MSG.tooLong })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: 'invalidSlug' }),
  categoryId: id,
  priceHalalas: price,
  inStock: checkbox,
  isTastingMenu: checkbox,
  isFeatured: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
  translations: z.object({ ar: translation, en: translation }),
  images: z.array(image).max(8).default([]),
})
export type ProductInput = z.input<typeof productInputSchema>

export const updateProductSchema = productInputSchema.extend({ id })

export const productFlagSchema = z.object({
  id,
  flag: z.enum(['inStock', 'isTastingMenu', 'isFeatured']),
  value: z.boolean(),
})

export const productPriceSchema = z.object({ id, priceHalalas: price })

export const productIdSchema = z.object({ id })
