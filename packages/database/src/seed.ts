import 'dotenv/config'
import { getDb } from './db'
import { inventoryItems } from './schema'

const db = getDb()

await db.insert(inventoryItems).values([
  {
    name: 'Example oral rehydration salts',
    sku: 'DEMO-ORS-001',
    category: 'Essential medicines',
    unit: 'sachets',
    currentQuantity: 0,
    minimumQuantity: 20,
  },
])

console.log('Seed data inserted')
