import AsyncStorage from '@react-native-async-storage/async-storage'

export type PendingPhoto = {
  id: string
  uri: string
  createdAt: string
}

export type ReadyScan = {
  scanId: string
  imageUri?: string
  createdAt: string
}

const pendingKey = 'pharmacy.pending-shelf-photos.v1'
const readyKey = 'pharmacy.ready-shelf-scans.v1'

async function read<T>(key: string, fallback: T): Promise<T> {
  const value = await AsyncStorage.getItem(key)
  return value ? (JSON.parse(value) as T) : fallback
}

export async function queuePhoto(uri: string) {
  const pending = await read<PendingPhoto[]>(pendingKey, [])
  const photo = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, uri, createdAt: new Date().toISOString() }
  await AsyncStorage.setItem(pendingKey, JSON.stringify([...pending, photo]))
  return photo
}

export async function listPendingPhotos() {
  return read<PendingPhoto[]>(pendingKey, [])
}

export async function removePendingPhoto(id: string) {
  const pending = await listPendingPhotos()
  await AsyncStorage.setItem(pendingKey, JSON.stringify(pending.filter((photo) => photo.id !== id)))
}

export async function saveReadyScan(scan: ReadyScan) {
  const scans = await read<ReadyScan[]>(readyKey, [])
  await AsyncStorage.setItem(readyKey, JSON.stringify([...scans.filter((item) => item.scanId !== scan.scanId), scan]))
}

export async function listReadyScans() {
  return read<ReadyScan[]>(readyKey, [])
}

export async function removeReadyScan(scanId: string) {
  const scans = await listReadyScans()
  await AsyncStorage.setItem(readyKey, JSON.stringify(scans.filter((scan) => scan.scanId !== scanId)))
}

export async function getPhotoQueueSummary() {
  const [pending, ready] = await Promise.all([listPendingPhotos(), listReadyScans()])
  return { pendingCount: pending.length, readyCount: ready.length }
}
