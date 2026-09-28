'use server'

import { hashPassword } from '@/auth/password'
import { Prisma } from '@/generated/prisma/client'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import {
  adjustWalletSchema,
  createCafeAccountSchema,
  resetCafePasswordSchema,
  setCafeActiveSchema,
  updateCafeSchema,
} from '@/lib/validation/cafe'
import { sarToHalalas } from '@/lib/money'
import { db } from '@/server/db'
import { guardStaffAction } from '@/server/dal/guard'
import { audit } from '@/server/security/audit'

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'

/**
 * ADMIN only: the entire café-account lifecycle is admin-issued — there is
 * no public sign-up. The generated password is handed to the café outside
 * this system (WhatsApp, in person); `mustChangePassword` forces them to
 * replace it at first sign-in.
 */
export async function createCafeAccount(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = createCafeAccountSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { cafeName, contactName, phone, contactEmail, password, googleMapsUrl, address } = parsed.data

  try {
    const created = await db.user.create({
      data: {
        phone,
        name: cafeName,
        role: 'CAFE',
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
        createdById: user.id,
        cafe: {
          create: {
            cafeName,
            contactName,
            contactPhone: phone,
            contactEmail,
            googleMapsUrl,
            addresses: { create: { ...address, isDefault: true } },
          },
        },
      },
      select: { id: true, cafe: { select: { id: true } } },
    })
    await audit({ actorId: user.id, action: 'cafe.create', entityType: 'CafeProfile', entityId: created.cafe!.id, metadata: { cafeName } })
    return ok({ id: created.cafe!.id })
  } catch (e) {
    if (isUniqueViolation(e)) return fail('conflict', { phone: ['conflict'] })
    throw e
  }
}

export async function updateCafeProfile(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = updateCafeSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, ...data } = parsed.data

  const { count } = await db.cafeProfile.updateMany({ where: { id }, data })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'cafe.update', entityType: 'CafeProfile', entityId: id })
  return ok({ id })
}

/** Sets a new admin-issued password and forces the café to replace it next sign-in. */
export async function resetCafePassword(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = resetCafePasswordSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, password } = parsed.data

  const profile = await db.cafeProfile.findUnique({ where: { id }, select: { userId: true } })
  if (!profile) return fail('notFound')

  await db.user.update({
    where: { id: profile.userId },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      sessionVersion: { increment: 1 }, // sign the café out everywhere
    },
  })
  await audit({ actorId: user.id, action: 'cafe.password_reset', entityType: 'CafeProfile', entityId: id })
  return ok({ id })
}

export async function setCafeActive(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = setCafeActiveSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, isActive } = parsed.data

  const profile = await db.cafeProfile.findUnique({ where: { id }, select: { userId: true } })
  if (!profile) return fail('notFound')

  await db.user.update({
    where: { id: profile.userId },
    data: { isActive, ...(isActive ? {} : { sessionVersion: { increment: 1 } }) },
  })
  await audit({ actorId: user.id, action: 'cafe.set_active', entityType: 'CafeProfile', entityId: id, metadata: { isActive } })
  return ok({ id })
}

/**
 * ADMIN: correct a café's store credit by hand — a goodwill gesture, or
 * undoing a mistake. Deliberately ADMIN-only rather than STAFF: this moves
 * money. The reason and the resulting balance both land in the audit log.
 *
 * The floor is enforced by a CHECK constraint on the column, so a deduction
 * larger than the balance fails at the database rather than silently going
 * negative.
 */
export async function adjustCafeWallet(input: unknown): Promise<ActionResult<{ balanceHalalas: number }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = adjustWalletSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { cafeId, deltaSar, reason } = parsed.data
  const deltaHalalas = sarToHalalas(deltaSar)

  let updated
  try {
    updated = await db.cafeProfile.update({
      where: { id: cafeId },
      data: { walletBalanceHalalas: { increment: deltaHalalas } },
      select: { walletBalanceHalalas: true },
    })
  } catch {
    // Either the café is gone or the deduction would take the wallet negative.
    return fail('validation', { deltaSar: ['walletWouldGoNegative'] })
  }

  await audit({
    actorId: user.id,
    action: 'cafe.wallet_adjust',
    entityType: 'CafeProfile',
    entityId: cafeId,
    metadata: { deltaHalalas, reason, balanceHalalas: updated.walletBalanceHalalas },
  })
  return ok({ balanceHalalas: updated.walletBalanceHalalas })
}
