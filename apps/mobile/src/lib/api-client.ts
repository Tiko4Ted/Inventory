const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })

  const body = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(body.error ?? `Request failed with ${response.status}`)
  return body
}

export function getApiUrl() {
  return apiUrl
}

export async function uploadShelfPhoto(uri: string) {
  const formData = new FormData()
  formData.append('file', {
    uri,
    name: `shelf-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob)

  const response = await fetch(`${apiUrl}/api/uploads`, { method: 'POST', body: formData })
  const body = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !body.url) throw new Error(body.error ?? 'Photo upload failed')
  return body.url
}
