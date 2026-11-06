import { requireEnv } from './env'

export type SmsMessage = { to: string; body: string }

export async function sendSms(message: SmsMessage) {
  const baseUrl = requireEnv('SMS_PROVIDER_BASE_URL')
  const apiKey = requireEnv('SMS_PROVIDER_API_KEY')
  const senderId = requireEnv('SMS_PROVIDER_SENDER_ID')

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ ...message, senderId }),
  })

  if (!response.ok) throw new Error(`SMS provider returned ${response.status}`)
  return response.json()
}
