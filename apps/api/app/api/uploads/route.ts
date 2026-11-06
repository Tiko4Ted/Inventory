import { getActorId } from '@/lib/auth'
import { createUploadResponse } from '@/lib/blob-storage'
import { errorResponse } from '@/lib/http'
import type { HandleUploadBody } from '@vercel/blob/client'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const actorId = await getActorId()
    return Response.json(await createUploadResponse(request, (await request.json()) as HandleUploadBody, actorId))
  } catch (error) {
    return errorResponse(error)
  }
}
