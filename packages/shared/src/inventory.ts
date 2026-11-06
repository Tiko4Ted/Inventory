import { z } from 'zod'

export const movementTypes = [
  'received',
  'dispensed',
  'damaged',
  'expired',
  'adjustment',
] as const

export const movementSources = ['manual', 'shelf_scan', 'import'] as const

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().max(80).optional(),
  category: z.string().trim().max(120).optional(),
  unit: z.string().trim().min(1).max(40),
  currentQuantity: z.number().int().min(0).default(0),
  minimumQuantity: z.number().int().min(0).default(0),
  batchNumber: z.string().trim().max(120).optional(),
  expiryDate: z.string().date().optional(),
})

export const stockMovementSchema = z.object({
  itemId: z.string().uuid(),
  movementType: z.enum(movementTypes),
  quantityDelta: z.number().int().refine((value) => value !== 0, 'Quantity cannot be zero'),
  reason: z.string().trim().min(1).max(500),
  source: z.enum(movementSources).default('manual'),
  shelfScanId: z.string().uuid().optional(),
})

export const shelfSuggestionSchema = z.object({
  productLabel: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(0),
  unit: z.string().trim().max(40).optional(),
  batchNumber: z.string().trim().max(120).optional(),
  expiryDate: z.string().date().optional(),
  confidence: z.number().min(0).max(1),
  notes: z.string().trim().max(500).optional(),
})

export const shelfAnalysisSchema = z.object({
  observations: z.array(shelfSuggestionSchema),
  warnings: z.array(z.string().max(500)),
})

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>
export type StockMovementInput = z.infer<typeof stockMovementSchema>
export type ShelfSuggestion = z.infer<typeof shelfSuggestionSchema>
export type ShelfAnalysis = z.infer<typeof shelfAnalysisSchema>

export function getStockStatus(quantity: number, minimumQuantity: number) {
  if (quantity <= 0) return 'out_of_stock' as const
  if (quantity <= minimumQuantity) return 'low_stock' as const
  return 'in_stock' as const
}
