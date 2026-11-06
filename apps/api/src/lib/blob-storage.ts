import { put } from '@vercel/blob'
import { requireEnv } from './env'

export async function uploadPrivateShelfImage(file: Blob, actorId: string) {
  requireEnv('BLOB_READ_WRITE_TOKEN')
  if (!file.type.startsWith('image/')) throw new Error('Only image uploads are supported')
  if (file.size > 4 * 1024 * 1024) throw new Error('Image must be smaller than 4 MB')

  const extension = file.type.split('/')[1] || 'jpeg'
  return put(`shelf-scans/${actorId}/${crypto.randomUUID()}.${extension}`, file, {
    access: 'private',
    addRandomSuffix: false,
    contentType: file.type,
  })
}
