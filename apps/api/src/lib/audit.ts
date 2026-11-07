import { auditLogs } from '@pharmacy/database/schema'
import { getDb } from './db'

export async function recordAudit(input: {
  actorId: string
  action: string
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  await getDb().insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  })
}
