export type InventoryItem = {
  id: string
  name: string
  sku: string | null
  category: string | null
  unit: string
  currentQuantity: number
  minimumQuantity: number
  batchNumber: string | null
  expiryDate: string | null
  isActive?: boolean
}

export type StockMovement = {
  id: string
  itemId: string
  movementType: string
  quantityDelta: number
  reason: string
  source: string
  actorId: string
  createdAt: string
}
