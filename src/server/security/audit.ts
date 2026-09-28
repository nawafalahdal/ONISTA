import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/server/db'
import { getClientIp, hashIp } from './request'

type AuditEntry = {
  actorId: string
  action: `${string}.${string}` // e.g. "product.update"
  entityType: string
  entityId?: string
  metadata?: Prisma.InputJsonValue
}

/** Record a privileged action. Never throws: auditing must not break the action. */
export async function audit(entry: AuditEntry) {
  try {
    await db.auditLog.create({ data: { ...entry, ipHash: hashIp(await getClientIp()) } })
  } catch (error) {
    console.error('[audit] failed to record', entry.action, error)
  }
}
