import { desc, eq } from 'drizzle-orm'
import { stockMovements } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await getActorId()
    const { id } = await context.params
    const movements = await getDb()
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.itemId, id))
      .orderBy(desc(stockMovements.createdAt))
    return Response.json({ movements })
  } catch (error) {
    return errorResponse(error)
  }
}
