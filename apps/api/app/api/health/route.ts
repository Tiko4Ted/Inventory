export const runtime = 'nodejs'

export async function GET() {
  return Response.json({ service: 'pharmacy-api', status: 'ok', timestamp: new Date().toISOString() })
}
