import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { inventoryItems } from '@pharmacy/database/schema'
import { inventoryItemSchema } from '@pharmacy/shared'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'
import { recordAudit } from '@/lib/audit'

const updateSchema = inventoryItemSchema.omit({ currentQuantity: true }).partial()

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await getActorId()
    const { id } = await context.params
    const [item] = await getDb().select().from(inventoryItems).where(eq(inventoryItems.id, id))
    if (!item) return Response.json({ error: 'Inventory item not found' }, { status: 404 })
    return Response.json({ item })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actorId = await getActorId()
    const { id } = await context.params
    const input = updateSchema.parse(await request.json())
    const [item] = await getDb()
      .update(inventoryItems)
      .set({
        ...input,
        expiryDate: input.expiryDate === undefined ? undefined : new Date(input.expiryDate),
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning()
    if (!item) return Response.json({ error: 'Inventory item not found' }, { status: 404 })
    await recordAudit({
      actorId,
      action: 'inventory_item_updated',
      entityType: 'inventory_item',
      entityId: id,
      metadata: { fields: Object.keys(input) },
    })
    return Response.json({ item })
  } catch (error) {
    return errorResponse(error)
  }
}
