import { and, eq, sql } from 'drizzle-orm'
import { stockMovementSchema } from '@pharmacy/shared'
import { inventoryItems, stockMovements } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'
import { recordAudit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const actorId = await getActorId()
    const input = stockMovementSchema.parse(await request.json())
    const db = getDb()

    const movement = await db.transaction(async (tx) => {
      const [updatedItem] = await tx
        .update(inventoryItems)
        .set({
          currentQuantity: sql`${inventoryItems.currentQuantity} + ${input.quantityDelta}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryItems.id, input.itemId),
            sql`${inventoryItems.currentQuantity} + ${input.quantityDelta} >= 0`,
          ),
        )
        .returning()

      if (!updatedItem) throw new Error('STOCK_CONFLICT')
      const [createdMovement] = await tx
        .insert(stockMovements)
        .values({ ...input, actorId })
        .returning()
      if (!createdMovement) throw new Error('Unable to create stock movement')
      return createdMovement
    })

    await recordAudit({
      actorId,
      action: 'stock_movement_created',
      entityType: 'stock_movement',
      entityId: movement.id,
      metadata: {
        itemId: input.itemId,
        quantityDelta: input.quantityDelta,
        movementType: input.movementType,
      },
    })
    return Response.json({ movement }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
