import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { inventoryItems, stockMovements } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'
import { recordAudit } from '@/lib/audit'

const reconcileSchema = z.object({
  itemId: z.string().uuid(),
  countedQuantity: z.number().int().min(0),
  reason: z.string().trim().min(1).max(500),
})

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const actorId = await getActorId()
    const input = reconcileSchema.parse(await request.json())
    const db = getDb()
    const result = await db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, input.itemId))
      if (!item) throw new Error('INVENTORY_ITEM_NOT_FOUND')
      const delta = input.countedQuantity - item.currentQuantity
      if (delta === 0) return { item, movement: null, delta }

      const [updated] = await tx
        .update(inventoryItems)
        .set({ currentQuantity: input.countedQuantity, updatedAt: new Date() })
        .where(eq(inventoryItems.id, item.id))
        .returning()
      if (!updated) throw new Error('STOCK_CONFLICT')
      const [movement] = await tx
        .insert(stockMovements)
        .values({
          itemId: item.id,
          movementType: 'adjustment',
          quantityDelta: delta,
          reason: input.reason,
          source: 'manual',
          actorId,
        })
        .returning()
      return { item: updated, movement, delta }
    })

    await recordAudit({
      actorId,
      action: 'stock_reconciled',
      entityType: 'inventory_item',
      entityId: input.itemId,
      metadata: {
        countedQuantity: input.countedQuantity,
        delta: result.delta,
        reason: input.reason,
      },
    })
    return Response.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVENTORY_ITEM_NOT_FOUND')
      return Response.json({ error: 'Inventory item not found' }, { status: 404 })
    return errorResponse(error)
  }
}
