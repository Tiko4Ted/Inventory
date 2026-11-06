import { eq, sql } from 'drizzle-orm'
import { stockMovementSchema } from '@pharmacy/shared'
import { inventoryItems, stockMovements } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const actorId = await getActorId()
    const input = stockMovementSchema.parse(await request.json())
    const db = getDb()
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, input.itemId))
    if (!item) return Response.json({ error: 'Inventory item not found' }, { status: 404 })
    if (item.currentQuantity + input.quantityDelta < 0) {
      return Response.json({ error: 'Stock cannot become negative' }, { status: 409 })
    }

    const [movement] = await db.insert(stockMovements).values({ ...input, actorId }).returning()
    await db
      .update(inventoryItems)
      .set({ currentQuantity: sql`${inventoryItems.currentQuantity} + ${input.quantityDelta}`, updatedAt: new Date() })
      .where(eq(inventoryItems.id, input.itemId))

    return Response.json({ movement }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
