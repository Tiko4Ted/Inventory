import { errorResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const expected = process.env.CRON_SECRET
    const received = request.headers.get('authorization')?.replace('Bearer ', '')
    if (expected && received !== expected) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    return Response.json({ status: 'not_enabled', message: 'Family-planning reminders are scheduled for the next module.' })
  } catch (error) {
    return errorResponse(error)
  }
}
