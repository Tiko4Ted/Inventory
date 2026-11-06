import { and, eq, ilike, sql } from 'drizzle-orm'
import { z } from 'zod'
import { inventoryItems, shelfScanLines, shelfScans, stockMovements } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'

const reviewSchema = z.object({
  decisions: z.array(
    z.object({
      lineId: z.string().uuid(),
      status: z.enum(['accepted', 'edited', 'rejected']),
      reviewerNote: z.string().max(500).optional(),
      productLabel: z.string().trim().min(1).max(200).optional(),
      quantity: z.number().int().min(0).optional(),
      unit: z.string().trim().max(40).optional(),
      batchNumber: z.string().trim().max(120).optional(),
      expiryDate: z.string().date().optional(),
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
      const [line] = await db
        .select()
        .from(shelfScanLines)
        .where(and(eq(shelfScanLines.id, decision.lineId), eq(shelfScanLines.scanId, id)))
      if (!line) continue

      const productLabel = decision.productLabel ?? line.productLabel
      const quantity = decision.quantity ?? line.quantity
      const unit = decision.unit ?? line.unit ?? 'units'
      const batchNumber = decision.batchNumber ?? line.batchNumber ?? undefined
      const expiryDate = decision.expiryDate ? new Date(decision.expiryDate) : line.expiryDate ?? undefined

      await db
        .update(shelfScanLines)
        .set({ productLabel, quantity, unit, batchNumber, expiryDate, reviewStatus: decision.status, reviewerNote: decision.reviewerNote })
        .where(eq(shelfScanLines.id, decision.lineId))

      if (decision.status === 'rejected') continue

      const [existing] = await db.select().from(inventoryItems).where(ilike(inventoryItems.name, productLabel)).limit(1)

      if (!existing) {
        const [created] = await db
          .insert(inventoryItems)
          .values({ name: productLabel, unit, currentQuantity: quantity, minimumQuantity: 0, batchNumber, expiryDate, updatedAt: new Date() })
          .returning()
        if (created) {
          await db.insert(stockMovements).values({
            itemId: created.id,
            movementType: 'received',
            quantityDelta: quantity,
            reason: 'Verified from shelf photo',
            source: 'shelf_scan',
            shelfScanId: id,
            actorId,
          })
        }
      } else {
        const delta = quantity - existing.currentQuantity
        if (delta !== 0) {
          await db
            .update(inventoryItems)
            .set({ currentQuantity: sql`${inventoryItems.currentQuantity} + ${delta}`, unit, batchNumber, expiryDate, updatedAt: new Date() })
            .where(eq(inventoryItems.id, existing.id))
          await db.insert(stockMovements).values({
            itemId: existing.id,
            movementType: 'adjustment',
            quantityDelta: delta,
            reason: 'Verified from shelf photo',
            source: 'shelf_scan',
            shelfScanId: id,
            actorId,
          })
        }
      }
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
