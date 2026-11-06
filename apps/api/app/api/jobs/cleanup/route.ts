import { del } from '@vercel/blob'
import { and, eq, lt } from 'drizzle-orm'
import { shelfScanLines, shelfScans } from '@pharmacy/database/schema'
import { getDb } from '@/lib/db'
import { requireEnv } from '@/lib/env'
import { errorResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const cronSecret = requireEnv('CRON_SECRET')
    const received = request.headers.get('authorization')?.replace('Bearer ', '')
    if (received !== cronSecret) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const retentionDays = Number(process.env.SHELF_SCAN_RETENTION_DAYS ?? 90)
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const oldScans = await getDb().select().from(shelfScans).where(and(lt(shelfScans.createdAt, cutoff), eq(shelfScans.status, 'reviewed')))

    for (const scan of oldScans) {
      await del(scan.imageUrl)
      await getDb().delete(shelfScanLines).where(eq(shelfScanLines.scanId, scan.id))
      await getDb().delete(shelfScans).where(eq(shelfScans.id, scan.id))
    }

    return Response.json({ deleted: oldScans.length, retentionDays })
  } catch (error) {
    return errorResponse(error)
  }
}
