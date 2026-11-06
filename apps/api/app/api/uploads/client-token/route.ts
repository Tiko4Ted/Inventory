import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getActorId } from '@/lib/auth'
import { requireEnv } from '@/lib/env'
import { errorResponse } from '@/lib/http'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const actorId = await getActorId()
    requireEnv('BLOB_READ_WRITE_TOKEN')
    const body = (await request.json()) as HandleUploadBody

    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maximumSizeInBytes: 20 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ actorId, pathname }),
      }),
      onUploadCompleted: async () => undefined,
    })

    return Response.json(response)
  } catch (error) {
    return errorResponse(error)
  }
}
