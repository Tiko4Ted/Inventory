import { eq } from 'drizzle-orm'
import { shelfScanLines, shelfScans } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await getActorId()
    const { id } = await context.params
    const [scan] = await getDb().select().from(shelfScans).where(eq(shelfScans.id, id))
    if (!scan) return Response.json({ error: 'Shelf scan not found' }, { status: 404 })
    const lines = await getDb().select().from(shelfScanLines).where(eq(shelfScanLines.scanId, id))
    return Response.json({ scan, lines })
  } catch (error) {
    return errorResponse(error)
  }
}
