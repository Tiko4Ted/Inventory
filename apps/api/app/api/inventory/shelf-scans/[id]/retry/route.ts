import { eq } from 'drizzle-orm'
import { shelfScanLines, shelfScans } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { analyzeShelfImage } from '@/lib/ai'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await getActorId()
    const { id } = await context.params
    const db = getDb()
    const [scan] = await db.select().from(shelfScans).where(eq(shelfScans.id, id))
    if (!scan) return Response.json({ error: 'Shelf scan not found' }, { status: 404 })

    await db.update(shelfScans).set({ status: 'processing' }).where(eq(shelfScans.id, id))
    try {
      const analysis = await analyzeShelfImage(scan.imageUrl)
      await db.delete(shelfScanLines).where(eq(shelfScanLines.scanId, id))
      const lines = await db.insert(shelfScanLines).values(analysis.observations.map((observation) => ({
        scanId: id,
        productLabel: observation.productLabel,
        quantity: observation.quantity,
        unit: observation.unit,
        batchNumber: observation.batchNumber,
        expiryDate: observation.expiryDate ? new Date(observation.expiryDate) : undefined,
        confidence: Math.round(observation.confidence * 10000),
      }))).returning()
      await db.update(shelfScans).set({ status: 'processing', rawAnalysis: analysis }).where(eq(shelfScans.id, id))
      return Response.json({ scanId: id, lines })
    } catch (error) {
      await db.update(shelfScans).set({ status: 'failed', rawAnalysis: { error: error instanceof Error ? error.message : 'AI analysis failed' } }).where(eq(shelfScans.id, id))
      throw error
    }
  } catch (error) {
    return errorResponse(error)
  }
}
