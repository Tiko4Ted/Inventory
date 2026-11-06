import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { shelfScanLines, shelfScans } from '@pharmacy/database/schema'
import type { ShelfAnalysis } from '@pharmacy/shared'
import { getActorId } from '@/lib/auth'
import { analyzeShelfImage } from '@/lib/ai'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'

const createScanSchema = z.object({ imageUrl: z.string().url() })

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const actorId = await getActorId()
    const { imageUrl } = createScanSchema.parse(await request.json())
    const [scan] = await getDb()
      .insert(shelfScans)
      .values({ imageUrl, createdBy: actorId, status: 'processing' })
      .returning()

    if (!scan) throw new Error('Unable to create shelf scan')
    let analysis: ShelfAnalysis
    try {
      analysis = await analyzeShelfImage(imageUrl)
    } catch (error) {
      await getDb().update(shelfScans).set({ status: 'failed', rawAnalysis: { error: error instanceof Error ? error.message : 'AI analysis failed' } }).where(eq(shelfScans.id, scan.id))
      throw error
    }

    const lines = await getDb()
      .insert(shelfScanLines)
      .values(analysis.observations.map((observation) => ({
        scanId: scan.id,
        productLabel: observation.productLabel,
        quantity: observation.quantity,
        unit: observation.unit,
        batchNumber: observation.batchNumber,
        expiryDate: observation.expiryDate ? new Date(observation.expiryDate) : undefined,
        confidence: Math.round(observation.confidence * 10000),
      })))
      .returning()

    return Response.json({ scanId: scan.id, analysis, lines }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
