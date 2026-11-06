import { getActorId } from '@/lib/auth'
import { errorResponse } from '@/lib/http'
import { uploadPrivateShelfImage } from '@/lib/blob-storage'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const actorId = await getActorId()
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof Blob)) return Response.json({ error: 'An image file is required' }, { status: 400 })

    const blob = await uploadPrivateShelfImage(file, actorId)
    return Response.json({ url: blob.url, pathname: blob.pathname, contentType: blob.contentType })
  } catch (error) {
    return errorResponse(error)
  }
}
