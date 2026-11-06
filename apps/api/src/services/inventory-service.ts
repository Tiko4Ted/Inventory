import { and, asc, eq, lte } from 'drizzle-orm'
import { inventoryItems } from '@pharmacy/database/schema'
import { getDb } from '../lib/db'

export async function listInventoryItems() {
  return getDb()
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.isActive, true))
    .orderBy(asc(inventoryItems.name))
}

export async function listLowStockItems() {
  return getDb()
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.isActive, true), lte(inventoryItems.currentQuantity, inventoryItems.minimumQuantity)))
    .orderBy(asc(inventoryItems.name))
}
