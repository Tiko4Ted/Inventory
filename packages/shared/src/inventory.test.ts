import { describe, expect, it } from 'vitest'
import { getStockStatus, inventoryItemSchema, stockMovementSchema } from './inventory'

describe('inventory rules', () => {
  it('classifies zero and negative stock as out of stock', () => {
    expect(getStockStatus(0, 5)).toBe('out_of_stock')
    expect(getStockStatus(-1, 5)).toBe('out_of_stock')
  })

  it('classifies stock at or below the minimum as low stock', () => {
    expect(getStockStatus(5, 5)).toBe('low_stock')
    expect(getStockStatus(1, 5)).toBe('low_stock')
  })

  it('classifies stock above the minimum as in stock', () => {
    expect(getStockStatus(6, 5)).toBe('in_stock')
  })

  it('accepts a valid item and rejects negative quantities', () => {
    const result = inventoryItemSchema.safeParse({
      name: 'Condoms',
      unit: 'packs',
      currentQuantity: 10,
      minimumQuantity: 2,
      expiryDate: '2027-12-31',
    })
    expect(result.success).toBe(true)
    expect(
      inventoryItemSchema.safeParse({ name: 'Condoms', unit: 'packs', currentQuantity: -1 })
        .success,
    ).toBe(false)
  })

  it('requires a non-zero movement quantity and a valid movement type', () => {
    const valid = stockMovementSchema.safeParse({
      itemId: '11111111-1111-4111-8111-111111111111',
      movementType: 'dispensed',
      quantityDelta: -2,
      reason: 'Issued to client',
    })
    expect(valid.success).toBe(true)
    expect(
      stockMovementSchema.safeParse({
        itemId: '11111111-1111-4111-8111-111111111111',
        movementType: 'dispensed',
        quantityDelta: 0,
        reason: 'No change',
      }).success,
    ).toBe(false)
    expect(
      stockMovementSchema.safeParse({
        itemId: '11111111-1111-4111-8111-111111111111',
        movementType: 'unknown',
        quantityDelta: 1,
        reason: 'Test',
      }).success,
    ).toBe(false)
  })
})
