'use server'

import { updateTag } from 'next/cache'
import { Prisma } from '@/generated/prisma/client'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import {
  productFlagSchema,
  productIdSchema,
  productInputSchema,
  productPriceSchema,
  updateProductSchema,
} from '@/lib/validation/product'
import { db } from '@/server/db'
import { guardStaffAction } from '@/server/dal/guard'
import { TAGS } from '@/server/queries/catalog'
import { audit } from '@/server/security/audit'

// Every action takes `unknown`: a Server Action is a public POST endpoint, so
// TypeScript types are not a trust boundary. Zod is.

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'

function invalidateProduct(id: string) {
  updateTag(TAGS.catalog)
  updateTag(TAGS.product(id))
}

export async function createProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = productInputSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { translations, images, ...data } = parsed.data

  try {
    const product = await db.product.create({
      data: {
        ...data,
        translations: {
          create: (['ar', 'en'] as const).map((locale) => ({ locale, ...translations[locale] })),
        },
        images: { create: images.map((img, position) => ({ ...img, position })) },
      },
      select: { id: true },
    })
    await audit({ actorId: user.id, action: 'product.create', entityType: 'Product', entityId: product.id, metadata: { slug: data.slug } })
    invalidateProduct(product.id)
    return ok(product)
  } catch (e) {
    if (isUniqueViolation(e)) return fail('conflict', { slug: ['slugTaken'] })
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      return fail('validation', { categoryId: ['invalid'] })
    }
    throw e
  }
}

export async function updateProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = updateProductSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, translations, images, ...data } = parsed.data

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({ where: { id, archivedAt: null }, data })
      for (const locale of ['ar', 'en'] as const) {
        const t = { ...translations[locale], badge: translations[locale].badge ?? null }
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale } },
          create: { productId: id, locale, ...t },
          update: t,
        })
      }
      await tx.productImage.deleteMany({ where: { productId: id } })
      await tx.productImage.createMany({ data: images.map((img, position) => ({ ...img, productId: id, position })) })
    })
  } catch (e) {
    if (isUniqueViolation(e)) return fail('conflict', { slug: ['slugTaken'] })
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return fail('notFound')
    throw e
  }

  await audit({ actorId: user.id, action: 'product.update', entityType: 'Product', entityId: id })
  invalidateProduct(id)
  return ok({ id })
}

/** Inline toggles in the products table: in stock / tasting menu / featured. */
export async function setProductFlag(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = productFlagSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, flag, value } = parsed.data

  const { count } = await db.product.updateMany({ where: { id, archivedAt: null }, data: { [flag]: value } })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'product.flag', entityType: 'Product', entityId: id, metadata: { flag, value } })
  invalidateProduct(id)
  return ok({ id })
}

/** Inline price edit. Input is SAR; stored as halalas. */
export async function updateProductPrice(input: unknown): Promise<ActionResult<{ id: string; priceHalalas: number }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = productPriceSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, priceHalalas } = parsed.data

  const { count } = await db.product.updateMany({ where: { id, archivedAt: null }, data: { priceHalalas } })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'product.price', entityType: 'Product', entityId: id, metadata: { priceHalalas } })
  invalidateProduct(id)
  return ok({ id, priceHalalas })
}

/** Soft delete: keeps order and tasting history intact. */
export async function archiveProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = productIdSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id } = parsed.data

  const { count } = await db.product.updateMany({
    where: { id, archivedAt: null },
    data: { archivedAt: new Date(), inStock: false, isTastingMenu: false },
  })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'product.archive', entityType: 'Product', entityId: id })
  invalidateProduct(id)
  return ok({ id })
}
