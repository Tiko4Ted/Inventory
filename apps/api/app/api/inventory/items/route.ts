import { inventoryItemSchema } from '@pharmacy/shared'
import { inventoryItems } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'
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
    const [item] = await getDb()
      .insert(inventoryItems)
      .values({
        ...input,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    if (!item) throw new Error('Unable to create inventory item')
    return Response.json({ item, createdBy: actorId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
