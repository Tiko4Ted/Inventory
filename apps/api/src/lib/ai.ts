import { gateway } from '@ai-sdk/gateway'
import { generateText, Output } from 'ai'
import { shelfAnalysisSchema, type ShelfAnalysis } from '@pharmacy/shared'
import { requireEnv } from './env'

export async function analyzeShelfImage(imageUrl: string): Promise<ShelfAnalysis> {
  const modelId = requireEnv('AI_MODEL')
  requireEnv('AI_GATEWAY_API_KEY')

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
          { type: 'image', image: imageUrl },
        ],
      },
    ],
    output: Output.object({ schema: shelfAnalysisSchema }),
  })

  return result.output
}
