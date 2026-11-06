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
}
