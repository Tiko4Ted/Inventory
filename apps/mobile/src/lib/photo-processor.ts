import NetInfo from '@react-native-community/netinfo'
import { processShelfPhoto } from './api-client'
import { listPendingPhotos, removePendingPhoto, saveReadyScan } from './photo-queue'

export async function flushPendingPhotos() {
  const network = await NetInfo.fetch()
  if (!network.isConnected) return

  const pending = await listPendingPhotos()
  for (const photo of pending) {
    try {
      const result = await processShelfPhoto(photo.uri)
      await saveReadyScan({ scanId: result.scanId, imageUri: photo.uri, createdAt: new Date().toISOString() })
      await removePendingPhoto(photo.id)
    } catch {
      // Keep the photo queued. The next connectivity event or app launch retries it.
    }
  }
}
