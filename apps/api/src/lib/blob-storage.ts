import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { requireEnv } from './env'

export async function createUploadResponse(request: Request, body: HandleUploadBody, actorId: string) {
  requireEnv('BLOB_READ_WRITE_TOKEN')

  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname) => ({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
      addRandomSuffix: true,
      tokenPayload: JSON.stringify({ actorId, pathname }),
    }),
    onUploadCompleted: async () => undefined,
  })
}
