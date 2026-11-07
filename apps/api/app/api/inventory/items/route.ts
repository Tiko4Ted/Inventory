import { eq } from 'drizzle-orm'
import { inventoryItems, stockMovements } from '@pharmacy/database/schema'
import { inventoryItemSchema } from '@pharmacy/shared'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'
import { recordAudit } from '@/lib/audit'
import { listInventoryItems } from '@/services/inventory-service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await getActorId()
    return Response.json({ items: await listInventoryItems() })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const actorId = await getActorId()
    const input = inventoryItemSchema.parse(await request.json())
    const db = getDb()
    const item = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(inventoryItems)
        .values({
          ...input,
          currentQuantity: 0,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
      if (!created) throw new Error('Unable to create inventory item')

      if (input.currentQuantity > 0) {
        await tx.insert(stockMovements).values({
          itemId: created.id,
          movementType: 'received',
          quantityDelta: input.currentQuantity,
          reason: 'Opening stock',
          source: 'manual',
          actorId,
        })
        const [updated] = await tx
          .update(inventoryItems)
          .set({ currentQuantity: input.currentQuantity, updatedAt: new Date() })
          .where(eq(inventoryItems.id, created.id))
          .returning()
        return updated ?? created
      }
      return created
    })

    await recordAudit({
      actorId,
      action: 'inventory_item_created',
      entityType: 'inventory_item',
      entityId: item.id,
      metadata: { openingQuantity: input.currentQuantity },
    })
    return Response.json({ item }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
