import NetInfo from '@react-native-community/netinfo'
import { upload } from '@vercel/blob/client'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { queuePhoto } from './photo-queue'

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
let tokenGetter: (() => Promise<string | null>) | null = null

export class OfflineQueuedError extends Error {
  constructor() {
    super('OFFLINE_QUEUED')
  }
}

export function setTokenGetter(getter: (() => Promise<string | null>) | null) {
  tokenGetter = getter
}

async function authHeaders() {
  const token = await tokenGetter?.()
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  return headers
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders()
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...headers, ...(init?.headers ?? {}) },
  })

  const body = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(body.error ?? `Request failed with ${response.status}`)
  return body
}

async function retry<T>(operation: () => Promise<T>, attempts = 3) {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Operation failed')
}

async function prepareShelfPhoto(uri: string) {
  return manipulateAsync(uri, [{ resize: { width: 1600 } }], { compress: 0.72, format: SaveFormat.JPEG })
}

export async function uploadShelfPhoto(uri: string, onProgress?: (percentage: number) => void) {
  const network = await NetInfo.fetch()
  if (!network.isConnected) {
    await queuePhoto(uri)
    throw new OfflineQueuedError()
  }

  const prepared = await prepareShelfPhoto(uri)
  const imageResponse = await fetch(prepared.uri)
  const imageBlob = await imageResponse.blob()
  const headers = await authHeaders()

  const result = await retry(() => upload(`shelf-scans/${Date.now()}.jpg`, imageBlob, {
    access: 'private',
    contentType: 'image/jpeg',
    multipart: true,
    handleUploadUrl: `${apiUrl}/api/uploads/client-token`,
    headers,
    onUploadProgress: ({ percentage }) => onProgress?.(percentage),
  }))

  return result.url
}

export async function processShelfPhoto(uri: string, onProgress?: (percentage: number) => void) {
  const imageUrl = await uploadShelfPhoto(uri, onProgress)
  return api<{ scanId: string; lines: Array<{ id: string; productLabel: string; quantity: number; unit: string | null; batchNumber: string | null; expiryDate: string | null; confidence: number }> }>('/api/inventory/shelf-scans', {
    method: 'POST',
    body: JSON.stringify({ imageUrl }),
  })
}

export function getApiUrl() {
  return apiUrl
}
