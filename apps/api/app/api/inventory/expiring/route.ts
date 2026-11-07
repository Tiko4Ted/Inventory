import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { inventoryItems } from '@pharmacy/database/schema'
import { getActorId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { errorResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await getActorId()
    const days = Math.max(
      1,
      Math.min(365, Number(new URL(request.url).searchParams.get('days') ?? 90)),
    )
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() + days)
    const items = await getDb()
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.isActive, true),
          gte(inventoryItems.expiryDate, today),
          lte(inventoryItems.expiryDate, cutoff),
        ),
      )
      .orderBy(asc(inventoryItems.expiryDate))
    return Response.json({ items, days })
  } catch (error) {
    return errorResponse(error)
  }
}
