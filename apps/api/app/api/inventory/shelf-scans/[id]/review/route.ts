import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { shelfScanLines, shelfScans } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'

const reviewSchema = z.object({
  decisions: z.array(
    z.object({
      lineId: z.string().uuid(),
      status: z.enum(['accepted', 'edited', 'rejected']),
      reviewerNote: z.string().max(500).optional(),
    }),
  ),
})

export const runtime = 'nodejs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actorId = await getActorId()
    const { id } = await context.params
    const { decisions } = reviewSchema.parse(await request.json())
    const db = getDb()

    for (const decision of decisions) {
      await db
        .update(shelfScanLines)
        .set({ reviewStatus: decision.status, reviewerNote: decision.reviewerNote })
        .where(eq(shelfScanLines.id, decision.lineId))
    }

    await db
      .update(shelfScans)
      .set({ status: 'reviewed', reviewedBy: actorId, reviewedAt: new Date() })
      .where(eq(shelfScans.id, id))

    return Response.json({ status: 'reviewed', scanId: id })
  } catch (error) {
    return errorResponse(error)
  }
}
