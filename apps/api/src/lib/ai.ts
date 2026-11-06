import { gateway } from '@ai-sdk/gateway'
import { get } from '@vercel/blob'
import { generateText, Output } from 'ai'
import { shelfAnalysisSchema, type ShelfAnalysis } from '@pharmacy/shared'
import { requireEnv } from './env'

export async function analyzeShelfImage(imageUrl: string): Promise<ShelfAnalysis> {
  const modelId = requireEnv('AI_MODEL')
  requireEnv('AI_GATEWAY_API_KEY')

  const blob = await get(imageUrl, { access: 'private' })
  if (!blob || blob.statusCode !== 200) throw new Error('Shelf image could not be read from private storage')
  const imageBytes = await new Response(blob.stream).arrayBuffer()
  const imageDataUrl = `data:${blob.blob.contentType};base64,${Buffer.from(imageBytes).toString('base64')}`

  const result = await generateText({
    model: gateway(modelId),
    system:
      'You analyze pharmacy shelf photos. Return only visible, evidence-based observations. Never invent unreadable product names or quantities. Keep confidence low when uncertain.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Identify visible pharmacy products, approximate visible quantity, unit, batch, and expiry only when readable.',
          },
          { type: 'image', image: imageDataUrl },
        ],
      },
    ],
    output: Output.object({ schema: shelfAnalysisSchema }),
  })

  return result.output
}
