import { getActorId } from '@/lib/auth'
import { errorResponse } from '@/lib/http'
import { listLowStockItems } from '@/services/inventory-service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await getActorId()
    return Response.json({ items: await listLowStockItems() })
  } catch (error) {
    return errorResponse(error)
  }
}
