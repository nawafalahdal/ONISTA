'use server'

import { hashPassword } from '@/auth/password'
import { Prisma } from '@/generated/prisma/client'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { fieldErrors } from '@/lib/validation/common'
import { assignDriverSchema, createDriverAccountSchema, resetDriverPasswordSchema, setDriverActiveSchema } from '@/lib/validation/driver'
import { db } from '@/server/db'
import { guardStaffAction } from '@/server/dal/guard'
import { audit } from '@/server/security/audit'

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'

/** ADMIN only: driver accounts are admin-issued, same as café accounts — no self-service sign-up. */
export async function createDriverAccount(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = createDriverAccountSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { name, email, password } = parsed.data

  try {
    const created = await db.user.create({
      data: { email, name, role: 'DRIVER', passwordHash: await hashPassword(password), mustChangePassword: true, createdById: user.id },
      select: { id: true },
    })
    await audit({ actorId: user.id, action: 'driver.create', entityType: 'User', entityId: created.id, metadata: { name } })
    return ok({ id: created.id })
  } catch (e) {
    if (isUniqueViolation(e)) return fail('conflict', { email: ['conflict'] })
    throw e
  }
}

export async function resetDriverPassword(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = resetDriverPasswordSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, password } = parsed.data

  const { count } = await db.user.updateMany({
    where: { id, role: 'DRIVER' },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      sessionVersion: { increment: 1 },
    },
  })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'driver.password_reset', entityType: 'User', entityId: id })
  return ok({ id })
}

export async function setDriverActive(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction('ADMIN')
  if (denied) return denied

  const parsed = setDriverActiveSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { id, isActive } = parsed.data

  const { count } = await db.user.updateMany({
    where: { id, role: 'DRIVER' },
    data: { isActive, ...(isActive ? {} : { sessionVersion: { increment: 1 } }) },
  })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'driver.set_active', entityType: 'User', entityId: id, metadata: { isActive } })
  return ok({ id })
}

/** STAFF: assigns (or clears, when driverId is omitted) the driver on one delivery. */
export async function assignDriver(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { user, denied } = await guardStaffAction()
  if (denied) return denied

  const parsed = assignDriverSchema.safeParse(input)
  if (!parsed.success) return fail('validation', fieldErrors(parsed.error))
  const { deliveryId, driverId } = parsed.data

  if (driverId) {
    const driver = await db.user.findUnique({ where: { id: driverId }, select: { role: true, isActive: true } })
    if (!driver || driver.role !== 'DRIVER' || !driver.isActive) return fail('notFound')
  }

  const { count } = await db.delivery.updateMany({ where: { id: deliveryId }, data: { assignedDriverId: driverId ?? null } })
  if (count === 0) return fail('notFound')

  await audit({ actorId: user.id, action: 'delivery.assign_driver', entityType: 'Delivery', entityId: deliveryId, metadata: { driverId: driverId ?? null } })
  return ok({ id: deliveryId })
}
