import { eq } from 'drizzle-orm'
import { inventoryItems } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'
import { recordAudit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actorId = await getActorId()
    const { id } = await context.params
    const [item] = await getDb()
      .update(inventoryItems)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning()
    if (!item) return Response.json({ error: 'Inventory item not found' }, { status: 404 })
    await recordAudit({
      actorId,
      action: 'inventory_item_archived',
      entityType: 'inventory_item',
      entityId: id,
    })
    return Response.json({ item })
  } catch (error) {
    return errorResponse(error)
  }
}
